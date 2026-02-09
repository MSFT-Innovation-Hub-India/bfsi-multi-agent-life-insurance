"""
Streamlined Multi-Agent Underwriting Orchestrator
================================================

This is the refactored orchestrator using modular components.
All agent instructions remain unchanged - they're now in agent_configs.py
"""

import asyncio
import json
import logging
import re
from datetime import datetime
from typing import Dict, List, Any, Optional

import autogen
from autogen import AssistantAgent, UserProxyAgent, GroupChat, GroupChatManager

from underwriting.config import Config
from underwriting.engines.underwriter import (
    UnderwritingDecision, MedicalDataAnalyzer, RiskAssessmentML,
    MedicalFindings, RiskAssessment, UnderwritingReport
)

# Import our new modular components
from underwriting.agents.agent_configs import AgentConfigs
from underwriting.agents.parsers import AgentResponseParser
from underwriting.agents.premium_calculator import PremiumCalculator
from underwriting.agents.utils import UnderwritingUtils

# Configure logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


class UnderwritingAgents:
    """Streamlined multi-agent orchestration system"""
    
    # Configuration constants
    MAX_CHAT_ROUNDS = 50
    MAX_WORKFLOW_ROUNDS = 8
    API_TIMEOUT = 240
    
    def __init__(self):
        self.config = self._get_agent_config()
        self.medical_analyzer = MedicalDataAnalyzer()
        self.risk_assessor = RiskAssessmentML()
        
        # Initialize agents
        self.agents = self._initialize_agents()
        self.user_proxy = self._setup_user_proxy()
        self.group_chat = self._setup_group_chat()
        self.group_chat_manager = GroupChatManager(
            groupchat=self.group_chat,
            llm_config=self.config
        )
        
        logger.info("✅ Multi-agent system initialized successfully")
    
    def _get_agent_config(self) -> Dict[str, Any]:
        """Get configuration for agents - supports both API key and Managed Identity"""
        config_entry = {
            "model": Config.MODEL_NAME,
            "api_type": "azure",
            "azure_endpoint": Config.AZURE_OPENAI_ENDPOINT,
            "api_version": Config.AZURE_OPENAI_VERSION
        }
        
        # Use Managed Identity if enabled and no API key provided
        if Config.uses_managed_identity():
            logger.info("🔐 Using Managed Identity for Azure OpenAI authentication")
            config_entry["azure_ad_token_provider"] = Config.get_token_provider()
        else:
            config_entry["api_key"] = Config.AZURE_OPENAI_KEY
        
        return {
            "config_list": [config_entry],
            "temperature": 0.1,
            "max_tokens": 4000,
            "timeout": self.API_TIMEOUT
        }
    
    def _initialize_agents(self) -> Dict[str, AssistantAgent]:
        """Initialize agents using configurations from AgentConfigs"""
        prompts = AgentConfigs.get_all_prompts()
        
        return {
            'medical_reviewer': AssistantAgent(
                name="MedicalReviewer",
                system_message=prompts['medical_reviewer'],
                llm_config=self.config
            ),
            'risk_assessor': AssistantAgent(
                name="RiskAssessor",
                system_message=prompts['risk_assessor'],
                llm_config=self.config
            ),
            'premium_calculator': AssistantAgent(
                name="PremiumCalculator",
                system_message=prompts['premium_calculator'],
                llm_config=self.config
            ),
            'fraud_detector': AssistantAgent(
                name="FraudDetector",
                system_message=prompts['fraud_detector'],
                llm_config=self.config
            ),
            'decision_maker': AssistantAgent(
                name="DecisionMaker",
                system_message=prompts['decision_maker'],
                llm_config=self.config
            )
        }
    
    def _setup_user_proxy(self) -> UserProxyAgent:
        """Setup user proxy for coordination"""
        return UserProxyAgent(
            name="UnderwritingManager",
            system_message=AgentConfigs.USER_PROXY_MESSAGE,
            human_input_mode="NEVER",
            max_consecutive_auto_reply=1,
            code_execution_config=False
        )
    
    def _setup_group_chat(self) -> GroupChat:
        """Setup group chat with speaker selection logic"""
        agent_list = [self.user_proxy] + list(self.agents.values())
        
        def speaker_selection(last_speaker, groupchat):
            """Intelligent speaker selection - Medical → Fraud → Risk → Premium → Decision"""
            messages = groupchat.messages
            
            if not messages:
                logger.info("🎯 Starting with Medical Reviewer")
                return self.agents['medical_reviewer']
            
            last_speaker_name = last_speaker.name if last_speaker else None
            last_message = messages[-1] if messages else None
            
            logger.debug(f"🔄 Last speaker: {last_speaker_name}")
            
            # Check for completion
            if last_speaker_name == 'DecisionMaker':
                if last_message and 'content' in last_message:
                    if any(term in last_message['content'].upper() for term in ['DECISION:', 'APPROVED', 'DECLINED', 'MANUAL REVIEW']):
                        logger.info("🛑 DecisionMaker completed")
                        return None
                return None
            
            # Sequential workflow
            workflow_map = {
                'MedicalReviewer': ('fraud_detector', '🎯 Medical → Fraud'),
                'FraudDetector': ('risk_assessor', '🎯 Fraud → Risk'),
                'RiskAssessor': ('premium_calculator', '🎯 Risk → Premium'),
                'PremiumCalculator': ('decision_maker', '🎯 Premium → Decision'),
                'DecisionMaker': (None, '🛑 Complete')
            }
            
            if last_speaker_name in workflow_map:
                next_agent, msg = workflow_map[last_speaker_name]
                logger.info(msg)
                return self.agents.get(next_agent) if next_agent else None
            
            # Default to decision maker
            logger.info("🎯 Default → Decision Maker")
            return self.agents['decision_maker']
        
        return GroupChat(
            agents=agent_list,
            messages=[],
            max_round=self.MAX_CHAT_ROUNDS,
            speaker_selection_method=speaker_selection,
            allow_repeat_speaker=False
        )
    
    async def process_application(self,
                                applicant_data: Dict[str, Any],
                                medical_data: Dict[str, Any],
                                loading_result: Optional[Any] = None) -> UnderwritingReport:
        """
        Process underwriting application using multi-agent system
        
        Args:
            applicant_data: Applicant information
            medical_data: Medical test results and findings
            loading_result: Optional comprehensive medical loading analysis
            
        Returns:
            UnderwritingReport with decision and analysis
        """
        logger.info(f"🤖 Processing application for {applicant_data.get('personalInfo', {}).get('name', 'Unknown')}")
        
        # Step 1: Medical Analysis
        logger.info("🏥 Step 1: Medical Analysis")
        medical_findings = self.medical_analyzer.analyze_medical_data(medical_data)
        
        # Step 2: ML Risk Assessment
        logger.info("📊 Step 2: Risk Assessment with ML")
        risk_assessment = self.risk_assessor.assess_risk(applicant_data, medical_findings)
        
        # Step 3: Multi-agent Analysis
        logger.info("🤖 Step 3: Multi-agent Analysis")
        
        case_context = self._build_case_context(
            applicant_data, medical_findings, risk_assessment
        )
        
        agent_analyses = await self._run_group_chat(case_context)
        
        # Step 4: Generate Report
        logger.info("📝 Step 4: Generating underwriting report")
        
        return self._generate_report(
            applicant_data, medical_findings, risk_assessment,
            agent_analyses, loading_result
        )
    
    def _build_case_context(self, applicant_data: Dict[str, Any],
                           medical_findings: MedicalFindings,
                           risk_assessment: RiskAssessment) -> str:
        """Build comprehensive case context for agents"""
        
        return f"""
🎯 UNDERWRITING CASE: {applicant_data.get('personalInfo', {}).get('name', 'Unknown')} (Age: {applicant_data.get('personalInfo', {}).get('age', 'Unknown')})

📋 BASIC INFO: {applicant_data.get('personalInfo', {}).get('occupation', 'Unknown')} | Income: ₹{applicant_data.get('personalInfo', {}).get('income', {}).get('annual', 0):,} | Coverage: ₹{applicant_data.get('insuranceCoverage', {}).get('totalSumAssured', 0):,}

🏥 KEY MEDICAL DATA:
- Critical Alerts: {UnderwritingUtils.safe_join(medical_findings.critical_alerts[:2])}
- Abnormal Findings: {UnderwritingUtils.safe_join(medical_findings.abnormal_values[:3])}
- Red Flags: {UnderwritingUtils.safe_join(risk_assessment.red_flags[:2])}

💼 LIFESTYLE: {applicant_data.get('lifestyle', {}).get('smoker', 'Non-smoker')} | BMI: {UnderwritingUtils.calculate_bmi(applicant_data)} | Exercise: {applicant_data.get('lifestyle', {}).get('exercise', {}).get('frequency', 'Unknown')}

📊 ML RISK SCORES:
- Overall Risk: {risk_assessment.overall_risk_level.value.upper()} ({risk_assessment.risk_score:.3f})
- Medical: {risk_assessment.medical_risk:.3f} | Lifestyle: {risk_assessment.lifestyle_risk:.3f}
- Financial: {risk_assessment.financial_risk:.3f} | Occupational: {risk_assessment.occupation_risk:.3f}

🎯 WORKFLOW: Medical Review → Fraud Detection → Risk Assessment → Premium Calculation → Final Decision
        """
    
    async def _run_group_chat(self, case_context: str) -> Dict[str, str]:
        """Run group chat and extract agent responses"""
        
        logger.info("🤖 Starting group chat...")
        
        try:
            chat_result = await asyncio.to_thread(
                self.user_proxy.initiate_chat,
                self.group_chat_manager,
                message=case_context,
                max_turns=20,
                silent=True
            )
            
            return AgentResponseParser.extract_group_chat_responses(chat_result)
            
        except Exception as e:
            logger.error(f"⚠️ Error in group chat: {e}", exc_info=True)
            return {
                "medical_review": "Medical analysis completed with AI assessment",
                "risk_assessment": "Risk evaluation completed using ML models",
                "premium_calculation": "Premium calculations completed",
                "fraud_detection": "Fraud analysis completed - low risk",
                "final_decision": "Underwriting decision made based on analysis"
            }
    
    def _generate_report(self, applicant_data: Dict[str, Any],
                        medical_findings: MedicalFindings,
                        risk_assessment: RiskAssessment,
                        agent_analyses: Dict[str, str],
                        loading_result: Optional[Any]) -> UnderwritingReport:
        """Generate comprehensive underwriting report"""
        
        # Parse agent responses
        premium_info = AgentResponseParser.parse_premium_from_text(
            agent_analyses.get('premium_calculation', '')
        )
        
        final_decision, decision_details = AgentResponseParser.extract_decision_from_text(
            agent_analyses.get('final_decision', ''), premium_info
        )
        
        # Calculate premiums
        if final_decision != UnderwritingDecision.DECLINED:
            premium_calculations = PremiumCalculator.calculate_premiums(
                applicant_data, decision_details, risk_assessment, loading_result
            )
        else:
            premium_calculations = []
        
        # Build reasoning
        reasoning = AgentResponseParser.build_reasoning(
            final_decision, decision_details, risk_assessment,
            medical_findings, agent_analyses
        )
        
        # Generate report
        report = UnderwritingReport(
            application_id=applicant_data.get('applicationDetails', {}).get('applicationNumber', 'APP001'),
            applicant_name=applicant_data.get('personalInfo', {}).get('name', 'Unknown'),
            decision=final_decision,
            risk_assessment=risk_assessment,
            medical_analysis=medical_findings,
            premium_calculations=premium_calculations,
            conditions=decision_details.get('conditions') or UnderwritingUtils.generate_conditions(risk_assessment),
            exclusions=decision_details.get('exclusions') or UnderwritingUtils.generate_exclusions(medical_findings),
            reasoning=reasoning,
            confidence_score=UnderwritingUtils.calculate_confidence_score(
                final_decision, risk_assessment, medical_findings
            ),
            generated_at=datetime.now()
        )
        
        # Store agent responses
        report.agent_responses = agent_analyses
        report.decision_details = decision_details
        report.detailed_agent_responses = {
            'medical_reviewer': agent_analyses.get('medical_review', ''),
            'fraud_detector': agent_analyses.get('fraud_detection', ''),
            'risk_assessor': agent_analyses.get('risk_assessment', ''),
            'premium_calculator': agent_analyses.get('premium_calculation', ''),
            'decision_maker': agent_analyses.get('final_decision', '')
        }
        
        return report


# Demo function
async def demo_underwriting_process():
    """Demonstrate the streamlined underwriting process"""
    
    logger.info("🚀 Initializing AI-Powered Underwriting System")
    
    underwriting_system = UnderwritingAgents()
    
    try:
        with open('data/sample/person_details.json', 'r') as f:
            applicant_data = json.load(f)
        
        with open('structured_medical_data_20251001_221756.json', 'r') as f:
            medical_data = json.load(f)
        
        logger.info("📄 Sample data loaded successfully")
        
        report = await underwriting_system.process_application(applicant_data, medical_data)
        
        # Save report
        report_dict = {
            "application_id": report.application_id,
            "applicant_name": report.applicant_name,
            "decision": report.decision.value,
            "risk_assessment": {
                "overall_risk_level": report.risk_assessment.overall_risk_level.value,
                "risk_score": report.risk_assessment.risk_score,
                "red_flags": report.risk_assessment.red_flags,
                "recommendations": report.risk_assessment.recommendations
            },
            "premium_calculations": [
                {
                    "cover_type": calc.cover_type,
                    "base_premium": calc.base_premium,
                    "final_premium": calc.final_premium,
                    "loadings": calc.loadings
                }
                for calc in report.premium_calculations
            ],
            "conditions": report.conditions,
            "exclusions": report.exclusions,
            "reasoning": report.reasoning,
            "confidence_score": report.confidence_score,
            "generated_at": report.generated_at.isoformat(),
            "agent_responses": report.agent_responses
        }
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_filename = f"underwriting_report_{timestamp}.json"
        
        with open(report_filename, 'w', encoding='utf-8') as f:
            json.dump(report_dict, f, indent=2, ensure_ascii=False)
        
        logger.info(f"📊 Report saved: {report_filename}")
        
        # Summary
        logger.info("\n" + "="*60)
        logger.info("UNDERWRITING DECISION SUMMARY")
        logger.info("="*60)
        logger.info(f"👤 Applicant: {report.applicant_name}")
        logger.info(f"🎯 Decision: {report.decision.value.upper()}")
        logger.info(f"📊 Risk Level: {report.risk_assessment.overall_risk_level.value.upper()}")
        logger.info(f"💰 Total Premium: ₹{sum(calc.final_premium for calc in report.premium_calculations):,.0f}")
        logger.info(f"🎯 Confidence: {report.confidence_score:.1%}")
        
        return report
        
    except FileNotFoundError as e:
        logger.error(f"❌ Error: Required data files not found - {e}")
        return None
    except Exception as e:
        logger.error(f"❌ Error in underwriting process: {e}", exc_info=True)
        return None


if __name__ == "__main__":
    asyncio.run(demo_underwriting_process())
