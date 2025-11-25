"""
Main Application Entry Point - Modular Version
==============================================

Complete AI-powered term insurance underwriting system using orchestrator_v2.
This version uses the new modular architecture with agent_configs, parsers, 
premium_calculator, and utils modules.
"""

import asyncio
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional

# Import all our components
from underwriting.config import Config
from underwriting.engines.underwriter import (
    RiskLevel, UnderwritingDecision, 
    MedicalDataAnalyzer, RiskAssessmentML
)
from underwriting.agents.orchestrator_v2 import UnderwritingAgents  # NEW MODULAR VERSION
from underwriting.analyzers.fraud_detector import ComprehensiveFraudDetector
from underwriting.analyzers.medical_extractor import StructuredMedicalExtractor
from underwriting.engines.loading_engine import (
    MedicalLoadingEngine, LoadingResult, MedicalLoading,
    create_loading_summary_report
)


class InsuranceUnderwritingSystemV2:
    """Complete AI-powered insurance underwriting system using modular orchestrator"""
    
    def __init__(self):
        """Initialize all system components"""
        
        print("🚀 Initializing AI-Powered Term Insurance Underwriting System (Modular V2)")
        print("=" * 70)
        
        # Initialize components
        self.medical_extractor = StructuredMedicalExtractor()
        self.medical_analyzer = MedicalDataAnalyzer()
        self.risk_assessor = RiskAssessmentML()
        self.fraud_detector = ComprehensiveFraudDetector()
        self.agent_system = UnderwritingAgents()  # Using modular orchestrator_v2
        self.medical_loading_engine = MedicalLoadingEngine()
        
        # Setup logging
        self._setup_logging()
        
        # Create output directories
        self._create_directories()
        
        print("✅ System initialization completed (Modular Architecture)")
        print(f"🎯 Auto-approval threshold: {Config.AUTO_APPROVAL_THRESHOLD}")
        print(f"⚠️  High-risk threshold: {Config.HIGH_RISK_THRESHOLD}")
        print("=" * 70)
    
    def _setup_logging(self):
        """Setup logging configuration"""
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(f'underwriting_log_{datetime.now().strftime("%Y%m%d")}.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
    
    def _create_directories(self):
        """Create necessary directories for outputs"""
        
        output_dirs = [
            'outputs/reports',
            'outputs/extractions',
            'logs'
        ]
        for directory in output_dirs:
            Path(directory).mkdir(parents=True, exist_ok=True)
    
    async def process_complete_application(self, 
                                         applicant_data_file: str,
                                         medical_images_directory: str = "tinsurance") -> Dict[str, Any]:
        """
        Process a complete insurance application end-to-end using modular orchestrator
        
        Args:
            applicant_data_file: Path to JSON file with applicant information
            medical_images_directory: Directory containing medical report images
            
        Returns:
            Complete underwriting decision with all analysis
        """
        
        start_time = datetime.now()
        
        try:
            # Step 1: Load applicant data
            print("📄 Step 1: Loading applicant data...")
            with open(applicant_data_file, 'r') as f:
                applicant_data = json.load(f)
            
            applicant_name = applicant_data.get('personalInfo', {}).get('name', 'Unknown')
            application_id = applicant_data.get('applicationDetails', {}).get('applicationNumber', 'APP001')
            
            print(f"👤 Processing application for: {applicant_name}")
            print(f"🆔 Application ID: {application_id}")
            
            # Step 2: Extract medical data from images
            print(f"\n🏥 Step 2: Extracting medical data from {medical_images_directory}...")
            medical_data = self.medical_extractor.process_all_images(medical_images_directory)
            
            if not medical_data or not medical_data.get('medical_data'):
                raise ValueError("No medical data could be extracted from images")
            
            print(f"✅ Successfully extracted data from {medical_data['extraction_metadata']['successful_extractions']} medical reports")
            
            # Step 3: Fraud detection analysis
            print(f"\n🔍 Step 3: Comprehensive fraud detection analysis...")
            fraud_assessment = self.fraud_detector.comprehensive_fraud_analysis(applicant_data, medical_data)
            
            # Step 4: Advanced Medical Loading Calculation
            print(f"\n🏥 Step 4: Advanced medical loading calculation...")
            loading_result = self.medical_loading_engine.calculate_comprehensive_loading(applicant_data, medical_data)
            
            print(f"✅ Medical loading calculated: {loading_result.total_loading_percentage:.1f}%")
            print(f"🎯 Risk Category: {loading_result.risk_category}")
            print(f"📊 Health Score: {loading_result.overall_health_score:.2f}/1.00")
            
            # Step 5: Multi-agent underwriting process (using modular orchestrator_v2)
            print(f"\n🤖 Step 5: Multi-agent underwriting analysis (Modular System)...")
            underwriting_report = await self.agent_system.process_application(
                applicant_data, 
                medical_data, 
                loading_result
            )
            
            # Step 6: Compile final comprehensive report (same structure as original)
            print(f"\n📊 Step 6: Compiling comprehensive underwriting report...")
            
            is_declined = underwriting_report.decision == UnderwritingDecision.DECLINED
            
            comprehensive_result = {
                "application_metadata": {
                    "application_id": application_id,
                    "applicant_name": applicant_name,
                    "processing_date": datetime.now().isoformat(),
                    "processing_time_seconds": (datetime.now() - start_time).total_seconds(),
                    "system_version": "2.0.0-modular"
                },
                
                "medical_extraction": {
                    "total_reports_processed": medical_data['extraction_metadata']['total_files'],
                    "successful_extractions": medical_data['extraction_metadata']['successful_extractions'],
                    "extraction_success_rate": medical_data['extraction_metadata']['successful_extractions'] / medical_data['extraction_metadata']['total_files'] if medical_data['extraction_metadata']['total_files'] > 0 else 0,
                    "medical_findings_summary": {
                        "normal_findings": len(underwriting_report.medical_analysis.normal_values),
                        "abnormal_findings": len(underwriting_report.medical_analysis.abnormal_values),
                        "critical_alerts": len(underwriting_report.medical_analysis.critical_alerts),
                        "critical_alert_details": underwriting_report.medical_analysis.critical_alerts if is_declined else [],
                        "overall_medical_risk_score": underwriting_report.medical_analysis.risk_score
                    }
                },
                
                "medical_loading_analysis": {
                    "total_loading_percentage": loading_result.total_loading_percentage,
                    "risk_category": loading_result.risk_category,
                    "overall_health_score": loading_result.overall_health_score,
                    "individual_loadings_count": len(loading_result.individual_loadings),
                    "requires_additional_tests": loading_result.requires_additional_tests,
                    "loading_breakdown": [
                        {
                            "condition": loading.condition,
                            "loading_percentage": loading.loading_percentage,
                            "severity": loading.severity.value,
                            "loading_type": loading.loading_type.value,
                            "reasoning": loading.reasoning,
                            "affects_critical_illness": loading.affects_critical_illness,
                            "affects_term_life": loading.affects_term_life,
                            "affects_disability": loading.affects_disability
                        }
                        for loading in loading_result.individual_loadings
                    ],
                    "recommendations": loading_result.recommendations,
                    "exclusions": loading_result.exclusions
                },
                
                "fraud_assessment": {
                    "overall_fraud_risk": fraud_assessment.overall_fraud_risk,
                    "fraud_score": fraud_assessment.fraud_score,
                    "indicators_count": len(fraud_assessment.indicators),
                    "critical_indicators": len([i for i in fraud_assessment.indicators if i.severity == 'CRITICAL']),
                    "high_risk_indicators": len([i for i in fraud_assessment.indicators if i.severity == 'HIGH']),
                    "verification_requirements": fraud_assessment.verification_required,
                    "key_concerns": [ind.description for ind in fraud_assessment.indicators if ind.severity in ['CRITICAL', 'HIGH']][:3]
                },
                
                "risk_assessment": {
                    "overall_risk_level": underwriting_report.risk_assessment.overall_risk_level.value,
                    "risk_score": underwriting_report.risk_assessment.risk_score,
                    "component_risks": {
                        "medical_risk": underwriting_report.risk_assessment.medical_risk,
                        "lifestyle_risk": underwriting_report.risk_assessment.lifestyle_risk,
                        "financial_risk": underwriting_report.risk_assessment.financial_risk,
                        "occupation_risk": underwriting_report.risk_assessment.occupation_risk
                    },
                    "red_flags": underwriting_report.risk_assessment.red_flags,
                    "recommendations": underwriting_report.risk_assessment.recommendations
                },
                
                "underwriting_decision": {
                    "final_decision": underwriting_report.decision.value,
                    "confidence_score": underwriting_report.confidence_score,
                    "reasoning": underwriting_report.reasoning,
                    "conditions": underwriting_report.conditions if not is_declined else [],
                    "exclusions": underwriting_report.exclusions if not is_declined else []
                }
            }
            
            # Premium analysis for non-declined applications
            if not is_declined:
                comprehensive_result["premium_analysis"] = {
                    "total_covers": len(underwriting_report.premium_calculations),
                    "total_base_premium": sum(calc.base_premium for calc in underwriting_report.premium_calculations),
                    "total_final_premium": sum(calc.final_premium for calc in underwriting_report.premium_calculations),
                    "total_loading_amount": sum(calc.final_premium - calc.base_premium for calc in underwriting_report.premium_calculations),
                    "average_loading_percentage": sum(calc.total_loading_percentage for calc in underwriting_report.premium_calculations) / len(underwriting_report.premium_calculations) if underwriting_report.premium_calculations else 0,
                    "cover_details": [
                        {
                            "cover_type": calc.cover_type,
                            "base_premium": calc.base_premium,
                            "final_premium": calc.final_premium,
                            "loading_percentage": calc.total_loading_percentage,
                            "loadings_applied": [loading["type"] for loading in calc.loadings]
                        }
                        for calc in underwriting_report.premium_calculations
                    ]
                }
                
                comprehensive_result["business_impact"] = {
                    "auto_processable": underwriting_report.decision == UnderwritingDecision.AUTO_APPROVED,
                    "requires_manual_review": underwriting_report.decision == UnderwritingDecision.MANUAL_REVIEW,
                    "additional_requirements_needed": underwriting_report.decision == UnderwritingDecision.ADDITIONAL_REQUIREMENTS,
                    "declined": False,
                    "estimated_processing_time_days": self._estimate_processing_time(underwriting_report.decision, fraud_assessment),
                    "business_value_score": self._calculate_business_value(applicant_data, underwriting_report)
                }
            else:
                comprehensive_result["decline_analysis"] = {
                    "primary_reason": "Critical medical conditions identified",
                    "critical_medical_issues": underwriting_report.medical_analysis.critical_alerts,
                    "risk_factors": underwriting_report.risk_assessment.red_flags,
                    "decline_confidence": underwriting_report.confidence_score,
                    "estimated_processing_time_days": 1
                }
                
                comprehensive_result["business_impact"] = {
                    "auto_processable": False,
                    "requires_manual_review": False,
                    "additional_requirements_needed": False,
                    "declined": True,
                    "estimated_processing_time_days": 1,
                    "business_value_score": 0.0
                }
            
            # Quality metrics
            comprehensive_result["quality_metrics"] = {
                "data_completeness_score": self._calculate_data_completeness(applicant_data, medical_data),
                "analysis_confidence": min(underwriting_report.confidence_score, fraud_assessment.confidence_level),
                "recommendation_strength": self._calculate_recommendation_strength(underwriting_report),
                "system_performance_score": 0.95
            }
            
            # Add detailed agent responses
            if hasattr(underwriting_report, 'detailed_agent_responses') and underwriting_report.detailed_agent_responses:
                comprehensive_result["detailed_agent_responses"] = underwriting_report.detailed_agent_responses
            
            # Save comprehensive report
            report_filename = f"outputs/reports/comprehensive_underwriting_report_{application_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(report_filename, 'w', encoding='utf-8') as f:
                json.dump(comprehensive_result, f, indent=2, ensure_ascii=False)
            
            # Generate and display summary
            from underwriting.core.main_system import InsuranceUnderwritingSystem
            temp_system = InsuranceUnderwritingSystem()
            executive_summary = temp_system._generate_executive_summary(comprehensive_result)
            
            print("\n" + "=" * 80)
            print("🎯 EXECUTIVE UNDERWRITING SUMMARY")
            print("=" * 80)
            print(executive_summary)
            print("=" * 80)
            
            print(f"\n💾 Comprehensive report saved: {report_filename}")
            
            # Generate professional reports
            professional_report = temp_system._generate_professional_underwriting_report(comprehensive_result)
            professional_report_filename = f"outputs/reports/professional_underwriting_report_{application_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
            
            with open(professional_report_filename, 'w', encoding='utf-8') as f:
                f.write(professional_report)
            
            print(f"📋 Professional underwriting report saved: {professional_report_filename}")
            
            # Medical loading report
            medical_loading_report = create_loading_summary_report(
                loading_result, applicant_name, application_id
            )
            medical_loading_filename = f"outputs/reports/medical_loading_report_{application_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
            
            with open(medical_loading_filename, 'w', encoding='utf-8') as f:
                f.write(medical_loading_report)
            
            print(f"🏥 Medical loading report saved: {medical_loading_filename}")
            
            print("\n" + "=" * 80)
            print("📋 UNDERWRITING REPORT")
            print("=" * 80)
            print(professional_report)
            
            return comprehensive_result
            
        except Exception as e:
            self.logger.error(f"Error processing application: {str(e)}")
            print(f"❌ Error processing application: {str(e)}")
            import traceback
            traceback.print_exc()
            return {
                "error": str(e),
                "application_id": application_id if 'application_id' in locals() else "UNKNOWN",
                "processing_failed": True,
                "timestamp": datetime.now().isoformat()
            }
    
    def _estimate_processing_time(self, decision: UnderwritingDecision, fraud_assessment) -> int:
        """Estimate processing time in days"""
        if decision == UnderwritingDecision.AUTO_APPROVED:
            return 1
        elif decision == UnderwritingDecision.DECLINED:
            return 2
        elif fraud_assessment.overall_fraud_risk in ['HIGH', 'CRITICAL']:
            return 7
        else:
            return 3
    
    def _calculate_business_value(self, applicant_data: Dict[str, Any], report) -> float:
        """Calculate business value score"""
        total_premium = sum(calc.final_premium for calc in report.premium_calculations)
        base_score = min(1.0, total_premium / 50000)
        
        if report.risk_assessment.overall_risk_level == RiskLevel.LOW:
            return min(1.0, base_score * 1.2)
        elif report.risk_assessment.overall_risk_level == RiskLevel.HIGH:
            return base_score * 0.7
        else:
            return base_score
    
    def _calculate_data_completeness(self, applicant_data: Dict[str, Any], medical_data: Dict[str, Any]) -> float:
        """Calculate data completeness score"""
        required_fields = ['personalInfo', 'lifestyle', 'health', 'insuranceCoverage']
        present_fields = sum(1 for field in required_fields if field in applicant_data)
        medical_completeness = medical_data['extraction_metadata']['successful_extractions'] / medical_data['extraction_metadata']['total_files'] if medical_data['extraction_metadata']['total_files'] > 0 else 0
        return (present_fields / len(required_fields) + medical_completeness) / 2
    
    def _calculate_recommendation_strength(self, report) -> float:
        """Calculate recommendation strength"""
        base_strength = report.confidence_score
        
        if len(report.risk_assessment.red_flags) == 0 and report.risk_assessment.overall_risk_level == RiskLevel.LOW:
            base_strength += 0.1
        elif len(report.risk_assessment.red_flags) > 3:
            base_strength -= 0.1
        
        return min(1.0, base_strength)
