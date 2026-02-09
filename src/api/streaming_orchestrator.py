"""
Streaming Orchestrator for Realtime Agent Output
=================================================

This module wraps the underwriting orchestrator to provide realtime
streaming of agent outputs for frontend showcase.
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional, AsyncGenerator, Callable
from dataclasses import dataclass, field, asdict
from enum import Enum

import autogen
from autogen import AssistantAgent, UserProxyAgent, GroupChat, GroupChatManager

# Import existing underwriting components
from underwriting.config import Config
from underwriting.engines.underwriter import (
    UnderwritingDecision, MedicalDataAnalyzer, RiskAssessmentML,
    MedicalFindings, RiskAssessment, UnderwritingReport
)
from underwriting.agents.agent_configs import AgentConfigs
from underwriting.agents.parsers import AgentResponseParser
from underwriting.agents.premium_calculator import PremiumCalculator
from underwriting.agents.utils import UnderwritingUtils

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


class AgentStatus(str, Enum):
    """Status of an agent in the workflow"""
    PENDING = "pending"
    ACTIVE = "active"
    COMPLETED = "completed"
    ERROR = "error"


@dataclass
class AgentEvent:
    """Event emitted when an agent produces output"""
    event_id: str
    timestamp: str
    agent_name: str
    agent_role: str
    status: AgentStatus
    message: str
    analysis: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        return {
            "event_id": self.event_id,
            "timestamp": self.timestamp,
            "agent_name": self.agent_name,
            "agent_role": self.agent_role,
            "status": self.status.value,
            "message": self.message,
            "analysis": self.analysis,
            "metadata": self.metadata
        }
    
    def to_json(self) -> str:
        """Convert to JSON string"""
        return json.dumps(self.to_dict())


@dataclass
class WorkflowProgress:
    """Overall workflow progress tracking"""
    workflow_id: str
    application_id: str
    applicant_name: str
    start_time: str
    current_agent: Optional[str] = None
    completed_agents: List[str] = field(default_factory=list)
    pending_agents: List[str] = field(default_factory=list)
    progress_percentage: float = 0.0
    status: str = "initializing"
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
    
    def to_json(self) -> str:
        return json.dumps(self.to_dict())


class StreamingOrchestrator:
    """
    Streaming wrapper for UnderwritingAgents that emits realtime events.
    
    This orchestrator processes applications and yields agent events
    as they complete, enabling realtime frontend updates.
    """
    
    # Agent workflow order
    AGENT_WORKFLOW = [
        ("medical_reviewer", "MedicalReviewer", "Medical Review Specialist"),
        ("fraud_detector", "FraudDetector", "Fraud Detection Specialist"),
        ("risk_assessor", "RiskAssessor", "Risk Assessment Specialist"),
        ("premium_calculator", "PremiumCalculator", "Premium Calculation Specialist"),
        ("decision_maker", "DecisionMaker", "Senior Underwriting Decision Maker"),
    ]
    
    MAX_CHAT_ROUNDS = 50
    API_TIMEOUT = 240
    
    def __init__(self):
        """Initialize the streaming orchestrator"""
        self.config = self._get_agent_config()
        self.medical_analyzer = MedicalDataAnalyzer()
        self.risk_assessor = RiskAssessmentML()
        
        # Initialize agents
        self.agents = self._initialize_agents()
        self.user_proxy = self._setup_user_proxy()
        
        # Event tracking
        self._event_counter = 0
        self._subscribers: List[Callable] = []
        
        logger.info("✅ Streaming Orchestrator initialized successfully")
    
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
    
    def _generate_event_id(self) -> str:
        """Generate unique event ID"""
        self._event_counter += 1
        return f"evt_{datetime.now().strftime('%Y%m%d%H%M%S')}_{self._event_counter:04d}"
    
    def _create_event(
        self,
        agent_key: str,
        agent_name: str,
        agent_role: str,
        status: AgentStatus,
        message: str,
        analysis: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> AgentEvent:
        """Create an agent event"""
        return AgentEvent(
            event_id=self._generate_event_id(),
            timestamp=datetime.now().isoformat(),
            agent_name=agent_name,
            agent_role=agent_role,
            status=status,
            message=message,
            analysis=analysis,
            metadata=metadata or {}
        )
    
    def _build_case_context(
        self,
        applicant_data: Dict[str, Any],
        medical_findings: MedicalFindings,
        risk_assessment: RiskAssessment
    ) -> str:
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
    
    async def _call_agent_direct(self, agent: AssistantAgent, context: str) -> str:
        """Make a direct API call to an agent"""
        try:
            messages = [{"role": "user", "content": context}]
            response = await asyncio.to_thread(agent.generate_reply, messages)
            
            if isinstance(response, dict):
                return response.get('content', str(response))
            return str(response) if response else "Analysis completed"
            
        except Exception as e:
            logger.error(f"Agent call failed: {e}")
            raise
    
    async def process_application_streaming(
        self,
        applicant_data: Dict[str, Any],
        medical_data: Dict[str, Any],
        loading_result: Optional[Any] = None
    ) -> AsyncGenerator[AgentEvent, None]:
        """
        Process underwriting application with realtime streaming of agent outputs.
        
        Yields AgentEvent objects as each agent completes their analysis.
        
        Args:
            applicant_data: Applicant information dictionary
            medical_data: Medical test results and findings
            loading_result: Optional comprehensive medical loading analysis
            
        Yields:
            AgentEvent objects with agent outputs
        """
        workflow_id = f"wf_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        application_id = applicant_data.get('applicationDetails', {}).get('applicationNumber', 'APP001')
        applicant_name = applicant_data.get('personalInfo', {}).get('name', 'Unknown')
        
        # Emit workflow start event
        yield self._create_event(
            agent_key="system",
            agent_name="System",
            agent_role="Workflow Orchestrator",
            status=AgentStatus.ACTIVE,
            message=f"Starting underwriting workflow for {applicant_name}",
            metadata={
                "workflow_id": workflow_id,
                "application_id": application_id,
                "total_agents": len(self.AGENT_WORKFLOW)
            }
        )
        
        # Step 1: Medical Analysis
        logger.info("🏥 Step 1: Medical Analysis")
        yield self._create_event(
            agent_key="medical_analyzer",
            agent_name="MedicalAnalyzer",
            agent_role="ML Medical Data Analyzer",
            status=AgentStatus.ACTIVE,
            message="Analyzing medical data using ML models..."
        )
        
        try:
            medical_findings = self.medical_analyzer.analyze_medical_data(medical_data)
            yield self._create_event(
                agent_key="medical_analyzer",
                agent_name="MedicalAnalyzer",
                agent_role="ML Medical Data Analyzer",
                status=AgentStatus.COMPLETED,
                message="Medical data analysis complete",
                analysis=f"Found {len(medical_findings.normal_values)} normal, {len(medical_findings.abnormal_values)} abnormal, {len(medical_findings.critical_alerts)} critical findings",
                metadata={
                    "normal_count": len(medical_findings.normal_values),
                    "abnormal_count": len(medical_findings.abnormal_values),
                    "critical_count": len(medical_findings.critical_alerts),
                    "risk_score": medical_findings.risk_score
                }
            )
        except Exception as e:
            yield self._create_event(
                agent_key="medical_analyzer",
                agent_name="MedicalAnalyzer",
                agent_role="ML Medical Data Analyzer",
                status=AgentStatus.ERROR,
                message=f"Medical analysis failed: {str(e)}"
            )
            raise
        
        # Step 2: ML Risk Assessment
        logger.info("📊 Step 2: Risk Assessment with ML")
        yield self._create_event(
            agent_key="risk_ml",
            agent_name="RiskAssessmentML",
            agent_role="ML Risk Assessment Engine",
            status=AgentStatus.ACTIVE,
            message="Computing risk scores using ML models..."
        )
        
        try:
            risk_assessment = self.risk_assessor.assess_risk(applicant_data, medical_findings)
            yield self._create_event(
                agent_key="risk_ml",
                agent_name="RiskAssessmentML",
                agent_role="ML Risk Assessment Engine",
                status=AgentStatus.COMPLETED,
                message=f"Risk assessment complete - {risk_assessment.overall_risk_level.value.upper()}",
                analysis=f"Overall Risk Score: {risk_assessment.risk_score:.3f}",
                metadata={
                    "risk_level": risk_assessment.overall_risk_level.value,
                    "risk_score": risk_assessment.risk_score,
                    "medical_risk": risk_assessment.medical_risk,
                    "lifestyle_risk": risk_assessment.lifestyle_risk,
                    "financial_risk": risk_assessment.financial_risk,
                    "occupation_risk": risk_assessment.occupation_risk,
                    "red_flags": risk_assessment.red_flags
                }
            )
        except Exception as e:
            yield self._create_event(
                agent_key="risk_ml",
                agent_name="RiskAssessmentML",
                agent_role="ML Risk Assessment Engine",
                status=AgentStatus.ERROR,
                message=f"Risk assessment failed: {str(e)}"
            )
            raise
        
        # Build case context for agents
        case_context = self._build_case_context(applicant_data, medical_findings, risk_assessment)
        
        # Step 3: Multi-Agent Analysis with streaming
        logger.info("🤖 Step 3: Multi-Agent Analysis")
        agent_analyses = {}
        accumulated_context = case_context
        
        for agent_key, agent_name, agent_role in self.AGENT_WORKFLOW:
            # Emit agent starting event
            yield self._create_event(
                agent_key=agent_key,
                agent_name=agent_name,
                agent_role=agent_role,
                status=AgentStatus.ACTIVE,
                message=f"{agent_role} is analyzing the case..."
            )
            
            try:
                # Call agent
                agent = self.agents[agent_key]
                agent_context = accumulated_context
                
                # Add previous analyses to context
                if agent_analyses:
                    agent_context += "\n\n📋 PREVIOUS AGENT ANALYSES:\n"
                    for prev_key, prev_analysis in agent_analyses.items():
                        agent_context += f"\n{prev_key.upper().replace('_', ' ')}:\n{prev_analysis[:500]}...\n"
                
                logger.info(f"🎯 Calling {agent_name}...")
                response = await self._call_agent_direct(agent, agent_context)
                
                # Store analysis
                agent_analyses[agent_key] = response
                
                # Extract key insights for the event
                response_preview = response[:300] + "..." if len(response) > 300 else response
                
                # Emit agent completed event with full analysis
                yield self._create_event(
                    agent_key=agent_key,
                    agent_name=agent_name,
                    agent_role=agent_role,
                    status=AgentStatus.COMPLETED,
                    message=f"{agent_role} completed analysis",
                    analysis=response,  # Full analysis
                    metadata={
                        "response_length": len(response),
                        "preview": response_preview
                    }
                )
                
                # Small delay for rate limiting and visibility
                await asyncio.sleep(0.5)
                
            except Exception as e:
                logger.error(f"Agent {agent_name} failed: {e}")
                yield self._create_event(
                    agent_key=agent_key,
                    agent_name=agent_name,
                    agent_role=agent_role,
                    status=AgentStatus.ERROR,
                    message=f"Agent failed: {str(e)}"
                )
                # Continue with next agent
                agent_analyses[agent_key] = f"Analysis failed: {str(e)}"
        
        # Step 4: Generate final report
        logger.info("📝 Step 4: Generating final report")
        yield self._create_event(
            agent_key="report_generator",
            agent_name="ReportGenerator",
            agent_role="Report Generation Engine",
            status=AgentStatus.ACTIVE,
            message="Compiling final underwriting report..."
        )
        
        try:
            # Parse agent responses and generate report
            report = self._generate_report(
                applicant_data, medical_findings, risk_assessment,
                agent_analyses, loading_result
            )
            
            # Prepare report summary
            report_summary = {
                "application_id": report.application_id,
                "applicant_name": report.applicant_name,
                "decision": report.decision.value,
                "confidence_score": report.confidence_score,
                "risk_level": report.risk_assessment.overall_risk_level.value,
                "total_premium": sum(calc.final_premium for calc in report.premium_calculations) if report.premium_calculations else 0,
                "conditions": report.conditions,
                "exclusions": report.exclusions,
                "reasoning": report.reasoning
            }
            
            yield self._create_event(
                agent_key="report_generator",
                agent_name="ReportGenerator",
                agent_role="Report Generation Engine",
                status=AgentStatus.COMPLETED,
                message=f"Underwriting decision: {report.decision.value.upper()}",
                analysis=json.dumps(report_summary, indent=2),
                metadata=report_summary
            )
            
            # Emit workflow complete event
            yield self._create_event(
                agent_key="system",
                agent_name="System",
                agent_role="Workflow Orchestrator",
                status=AgentStatus.COMPLETED,
                message="Underwriting workflow completed successfully",
                metadata={
                    "workflow_id": workflow_id,
                    "application_id": application_id,
                    "decision": report.decision.value,
                    "confidence": report.confidence_score,
                    "processing_complete": True
                }
            )
            
        except Exception as e:
            logger.error(f"Report generation failed: {e}")
            yield self._create_event(
                agent_key="report_generator",
                agent_name="ReportGenerator",
                agent_role="Report Generation Engine",
                status=AgentStatus.ERROR,
                message=f"Report generation failed: {str(e)}"
            )
            raise
    
    async def process_application(
        self,
        applicant_data: Dict[str, Any],
        medical_data: Dict[str, Any],
        loading_result: Optional[Any] = None
    ) -> Dict[str, Any]:
        """
        Process application and return complete result with all agent outputs.
        
        This is the non-streaming version that collects all events and returns
        a comprehensive result.
        
        Args:
            applicant_data: Applicant information dictionary
            medical_data: Medical test results and findings
            loading_result: Optional comprehensive medical loading analysis
            
        Returns:
            Complete result dictionary with all agent outputs and final decision
        """
        events = []
        final_report = None
        
        async for event in self.process_application_streaming(
            applicant_data, medical_data, loading_result
        ):
            events.append(event.to_dict())
            
            # Capture final report from report generator
            if event.agent_name == "ReportGenerator" and event.status == AgentStatus.COMPLETED:
                if event.metadata:
                    final_report = event.metadata
        
        return {
            "workflow_id": events[0].get("metadata", {}).get("workflow_id") if events else None,
            "application_id": applicant_data.get('applicationDetails', {}).get('applicationNumber', 'APP001'),
            "applicant_name": applicant_data.get('personalInfo', {}).get('name', 'Unknown'),
            "processing_timestamp": datetime.now().isoformat(),
            "events": events,
            "agent_outputs": self._extract_agent_outputs(events),
            "final_decision": final_report,
            "status": "completed"
        }
    
    def _extract_agent_outputs(self, events: List[Dict]) -> Dict[str, Any]:
        """Extract agent outputs from events list"""
        outputs = {}
        for event in events:
            if event.get("status") == "completed" and event.get("analysis"):
                agent_key = event.get("agent_name", "unknown").lower().replace(" ", "_")
                outputs[agent_key] = {
                    "role": event.get("agent_role"),
                    "analysis": event.get("analysis"),
                    "timestamp": event.get("timestamp"),
                    "metadata": event.get("metadata", {})
                }
        return outputs
    
    def _generate_report(
        self,
        applicant_data: Dict[str, Any],
        medical_findings: MedicalFindings,
        risk_assessment: RiskAssessment,
        agent_analyses: Dict[str, str],
        loading_result: Optional[Any]
    ) -> UnderwritingReport:
        """Generate comprehensive underwriting report"""
        
        # Map agent_analyses keys to parser expected keys
        mapped_analyses = {
            'medical_review': agent_analyses.get('medical_reviewer', ''),
            'risk_assessment': agent_analyses.get('risk_assessor', ''),
            'premium_calculation': agent_analyses.get('premium_calculator', ''),
            'fraud_detection': agent_analyses.get('fraud_detector', ''),
            'final_decision': agent_analyses.get('decision_maker', '')
        }
        
        # Parse agent responses
        premium_info = AgentResponseParser.parse_premium_from_text(
            mapped_analyses.get('premium_calculation', '')
        )
        
        final_decision, decision_details = AgentResponseParser.extract_decision_from_text(
            mapped_analyses.get('final_decision', ''), premium_info
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
            medical_findings, mapped_analyses
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
        report.agent_responses = mapped_analyses
        report.decision_details = decision_details
        report.detailed_agent_responses = {
            'medical_reviewer': agent_analyses.get('medical_reviewer', ''),
            'fraud_detector': agent_analyses.get('fraud_detector', ''),
            'risk_assessor': agent_analyses.get('risk_assessor', ''),
            'premium_calculator': agent_analyses.get('premium_calculator', ''),
            'decision_maker': agent_analyses.get('decision_maker', '')
        }
        
        return report
