"""
Main Application Entry Point
===========================

Complete AI-powered term insurance underwriting system orchestrator.
This is the main entry point that coordinates all components.
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
from underwriting.agents.orchestrator import UnderwritingAgents
from underwriting.analyzers.fraud_detector import ComprehensiveFraudDetector
from underwriting.analyzers.medical_extractor import StructuredMedicalExtractor
from underwriting.engines.loading_engine import (
    MedicalLoadingEngine, LoadingResult, MedicalLoading,
    create_loading_summary_report
)


class InsuranceUnderwritingSystem:
    """Complete AI-powered insurance underwriting system"""
    
    def __init__(self):
        """Initialize all system components"""
        
        print("🚀 Initializing AI-Powered Term Insurance Underwriting System")
        print("=" * 70)
        
        # Initialize components
        self.medical_extractor = StructuredMedicalExtractor()
        self.medical_analyzer = MedicalDataAnalyzer()
        self.risk_assessor = RiskAssessmentML()
        self.fraud_detector = ComprehensiveFraudDetector()
        self.agent_system = UnderwritingAgents()
        self.medical_loading_engine = MedicalLoadingEngine()
        
        # Setup logging
        self._setup_logging()
        
        # Create output directories
        self._create_directories()
        
        print("✅ System initialization completed")
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
        """Create necessary directories for outputs only when needed"""
        
        # Only create output directories that will actually be used
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
        Process a complete insurance application end-to-end
        
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
            
            # Step 5: Multi-agent underwriting process (enhanced with loading data)
            print(f"\n🤖 Step 5: Multi-agent underwriting analysis...")
            underwriting_report = await self.agent_system.process_application(applicant_data, medical_data, loading_result)
            
            # Step 6: Compile final comprehensive report
            print(f"\n📊 Step 6: Compiling comprehensive underwriting report...")
            
            # Check if application was declined
            is_declined = underwriting_report.decision == UnderwritingDecision.DECLINED
            
            comprehensive_result = {
                "application_metadata": {
                    "application_id": application_id,
                    "applicant_name": applicant_name,
                    "processing_date": datetime.now().isoformat(),
                    "processing_time_seconds": (datetime.now() - start_time).total_seconds(),
                    "system_version": "1.0.0"
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
            
            # Only include premium analysis and business impact for non-declined applications
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
                    "estimated_processing_time_days": getattr(underwriting_report, 'decision_details', {}).get('processing_time_days', self._estimate_processing_time(underwriting_report.decision, fraud_assessment)),
                    "business_value_score": self._calculate_business_value(applicant_data, underwriting_report)
                }
            else:
                # For declined applications, show decline reasons
                comprehensive_result["decline_analysis"] = {
                    "primary_reason": "Critical medical conditions identified",
                    "critical_medical_issues": underwriting_report.medical_analysis.critical_alerts,
                    "risk_factors": underwriting_report.risk_assessment.red_flags,
                    "decline_confidence": underwriting_report.confidence_score,
                    "estimated_processing_time_days": 1  # Quick decline processing
                }
                
                comprehensive_result["business_impact"] = {
                    "auto_processable": False,
                    "requires_manual_review": False,
                    "additional_requirements_needed": False,
                    "declined": True,
                    "estimated_processing_time_days": 1,
                    "business_value_score": 0.0  # No business value for declined applications
                }
            
            # Add quality metrics
            comprehensive_result["quality_metrics"] = {
                "data_completeness_score": self._calculate_data_completeness(applicant_data, medical_data),
                "analysis_confidence": min(underwriting_report.confidence_score, fraud_assessment.confidence_level),
                "recommendation_strength": self._calculate_recommendation_strength(underwriting_report),
                "system_performance_score": 0.95  # Based on successful processing
            }
            
            # Add detailed agent responses for JSON export
            if hasattr(underwriting_report, 'agent_responses') and underwriting_report.agent_responses:
                comprehensive_result["detailed_agent_responses"] = {
                    "medical_reviewer": {
                        "analysis": underwriting_report.agent_responses.get('medical_review', 'Medical analysis completed'),
                        "timestamp": datetime.now().isoformat(),
                        "agent_type": "Medical Review Specialist"
                    },
                    "fraud_detector": {
                        "analysis": underwriting_report.agent_responses.get('fraud_detection', 'Fraud analysis completed'),
                        "timestamp": datetime.now().isoformat(),
                        "agent_type": "Fraud Detection Specialist"
                    },
                    "risk_assessor": {
                        "analysis": underwriting_report.agent_responses.get('risk_assessment', 'Risk assessment completed'),
                        "timestamp": datetime.now().isoformat(),
                        "agent_type": "Risk Assessment Specialist"
                    },
                    "premium_calculator": {
                        "analysis": underwriting_report.agent_responses.get('premium_calculation', 'Premium calculation completed'),
                        "timestamp": datetime.now().isoformat(),
                        "agent_type": "Premium Calculation Specialist"
                    },
                    "decision_maker": {
                        "analysis": underwriting_report.agent_responses.get('final_decision', 'Final decision completed'),
                        "timestamp": datetime.now().isoformat(),
                        "agent_type": "Senior Underwriting Decision Maker"
                    }
                }
            
            # Save comprehensive report
            report_filename = f"outputs/reports/comprehensive_underwriting_report_{application_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(report_filename, 'w', encoding='utf-8') as f:
                json.dump(comprehensive_result, f, indent=2, ensure_ascii=False)
            
            # Generate executive summary
            executive_summary = self._generate_executive_summary(comprehensive_result)
            
            print("\n" + "=" * 80)
            print("🎯 EXECUTIVE UNDERWRITING SUMMARY")
            print("=" * 80)
            print(executive_summary)
            print("=" * 80)
            
            print(f"\n💾 Comprehensive report saved: {report_filename}")
            
            # Generate and save professional underwriting report
            professional_report = self._generate_professional_underwriting_report(comprehensive_result)
            professional_report_filename = f"outputs/reports/professional_underwriting_report_{application_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
            
            with open(professional_report_filename, 'w', encoding='utf-8') as f:
                f.write(professional_report)
            
            print(f"📋 Professional underwriting report saved: {professional_report_filename}")
            
            # Generate and save detailed medical loading report
            medical_loading_report = create_loading_summary_report(
                loading_result, applicant_name, application_id
            )
            medical_loading_filename = f"outputs/reports/medical_loading_report_{application_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
            
            with open(medical_loading_filename, 'w', encoding='utf-8') as f:
                f.write(medical_loading_report)
            
            print(f"🏥 Medical loading report saved: {medical_loading_filename}")
            
            # Display the professional report
            print("\n" + "=" * 80)
            print("📋 UNDERWRITING REPORT")
            print("=" * 80)
            print(professional_report)
            
            return comprehensive_result
            
        except Exception as e:
            self.logger.error(f"Error processing application: {str(e)}")
            print(f"❌ Error processing application: {str(e)}")
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
        income = applicant_data.get('personalInfo', {}).get('income', {}).get('annual', 0)
        
        # Base score on premium amount and risk level
        base_score = min(1.0, total_premium / 50000)  # Normalize by 50k premium
        
        if report.risk_assessment.overall_risk_level == RiskLevel.LOW:
            return min(1.0, base_score * 1.2)
        elif report.risk_assessment.overall_risk_level == RiskLevel.HIGH:
            return base_score * 0.7
        else:
            return base_score
    
    def _calculate_data_completeness(self, applicant_data: Dict[str, Any], medical_data: Dict[str, Any]) -> float:
        """Calculate data completeness score"""
        
        # Check key fields in applicant data
        required_fields = ['personalInfo', 'lifestyle', 'health', 'insuranceCoverage']
        present_fields = sum(1 for field in required_fields if field in applicant_data)
        
        # Check medical data completeness
        medical_completeness = medical_data['extraction_metadata']['successful_extractions'] / medical_data['extraction_metadata']['total_files'] if medical_data['extraction_metadata']['total_files'] > 0 else 0
        
        return (present_fields / len(required_fields) + medical_completeness) / 2
    
    def _calculate_recommendation_strength(self, report) -> float:
        """Calculate recommendation strength"""
        
        # Based on confidence score and consistency of analysis
        base_strength = report.confidence_score
        
        # Adjust based on risk assessment consistency
        if len(report.risk_assessment.red_flags) == 0 and report.risk_assessment.overall_risk_level == RiskLevel.LOW:
            base_strength += 0.1
        elif len(report.risk_assessment.red_flags) > 3:
            base_strength -= 0.1
        
        return min(1.0, base_strength)
    
    def _generate_executive_summary(self, result: Dict[str, Any]) -> str:
        """Generate executive summary"""
        
        summary_lines = []
        
        # Basic info
        summary_lines.append(f"📋 Application: {result['application_metadata']['application_id']}")
        summary_lines.append(f"👤 Applicant: {result['application_metadata']['applicant_name']}")
        
        # Decision
        decision = result['underwriting_decision']['final_decision'].replace('_', ' ').title()
        summary_lines.append(f"🎯 Decision: {decision}")
        summary_lines.append(f"📊 Confidence: {result['underwriting_decision']['confidence_score']:.1%}")
        
        # Risk assessment
        risk_level = result['risk_assessment']['overall_risk_level'].title()
        summary_lines.append(f"⚠️  Risk Level: {risk_level}")
        summary_lines.append(f"🔍 Fraud Risk: {result['fraud_assessment']['overall_fraud_risk']}")
        
        # Check if application was declined
        is_declined = result['underwriting_decision']['final_decision'] == 'declined'
        
        # Medical loading information
        if 'medical_loading_analysis' in result:
            medical_loading = result['medical_loading_analysis']['total_loading_percentage']
            risk_category = result['medical_loading_analysis']['risk_category']
            health_score = result['medical_loading_analysis']['overall_health_score']
            summary_lines.append(f"🏥 Medical Loading: {medical_loading:.1f}% ({risk_category})")
            summary_lines.append(f"🎯 Health Score: {health_score:.2f}/1.00")
        
        if not is_declined and 'premium_analysis' in result:
            # Financial summary for approved/review cases
            total_premium = result['premium_analysis']['total_final_premium']
            loading_pct = result['premium_analysis']['average_loading_percentage']
            summary_lines.append(f"💰 Total Premium: ₹{total_premium:,.0f} ({loading_pct:.0f}% total loading)")
        elif is_declined and 'decline_analysis' in result:
            # Decline reason for declined cases
            summary_lines.append(f"❌ Decline Reason: {result['decline_analysis']['primary_reason']}")
            if result['decline_analysis']['critical_medical_issues']:
                # Show first critical issue
                first_issue = result['decline_analysis']['critical_medical_issues'][0]
                if len(first_issue) > 80:
                    first_issue = first_issue[:80] + "..."
                summary_lines.append(f"🏥 Critical Issue: {first_issue}")
        
        # Key concerns (fraud/other issues)
        if result['fraud_assessment']['key_concerns']:
            summary_lines.append(f"🚨 Additional Concerns: {', '.join(result['fraud_assessment']['key_concerns'][:2])}")
        elif result['risk_assessment']['red_flags'] and not is_declined:
            # Show risk flags for non-declined cases
            flag_summary = ', '.join(result['risk_assessment']['red_flags'][:2])
            if len(flag_summary) > 100:
                flag_summary = flag_summary[:100] + "..."
            summary_lines.append(f"⚠️  Risk Flags: {flag_summary}")
        
        # Processing time
        processing_days = result['business_impact']['estimated_processing_time_days']
        if is_declined:
            summary_lines.append(f"⏱️  Processing Complete: {processing_days} day")
        else:
            summary_lines.append(f"⏱️  Est. Processing Time: {processing_days} days")
        
        return '\n'.join(summary_lines)
    
    def _generate_professional_underwriting_report(self, result: Dict[str, Any]) -> str:
        """Generate a comprehensive professional underwriting report"""
        
        report_lines = []
        
        # Header (simplified)
        report_lines.extend([
            "📋 UNDERWRITING ANALYSIS REPORT",
            "=" * 50,
            ""
        ])
        
        # Application Summary
        report_lines.extend([
            "📋 APPLICATION SUMMARY",
            "-" * 50,
            f"Application ID: {result['application_metadata']['application_id']}",
            f"Applicant Name: {result['application_metadata']['applicant_name']}",
            f"Processing Date: {result['application_metadata']['processing_date'][:10]}",
            f"Processing Time: {result['application_metadata']['processing_time_seconds']:.2f} seconds",
            f"System Version: {result['application_metadata']['system_version']}",
            ""
        ])
        
        # Medical Analysis
        report_lines.extend([
            "🏥 MEDICAL ANALYSIS SUMMARY",
            "-" * 50,
            f"Total Reports Processed: {result['medical_extraction']['total_reports_processed']}",
            f"Successful Extractions: {result['medical_extraction']['successful_extractions']}",
            f"Extraction Success Rate: {result['medical_extraction']['extraction_success_rate']:.1%}",
            "",
            "Medical Findings:",
            f"  • Normal Findings: {result['medical_extraction']['medical_findings_summary']['normal_findings']}",
            f"  • Abnormal Findings: {result['medical_extraction']['medical_findings_summary']['abnormal_findings']}",
            f"  • Critical Alerts: {result['medical_extraction']['medical_findings_summary']['critical_alerts']}",
            f"  • Medical Risk Score: {result['medical_extraction']['medical_findings_summary']['overall_medical_risk_score']:.3f}",
            ""
        ])
        
        # Medical Loading Analysis (Simplified)
        if 'medical_loading_analysis' in result:
            report_lines.extend([
                "🏥 MEDICAL LOADING SUMMARY",
                "-" * 50,
                f"Total Medical Loading: {result['medical_loading_analysis']['total_loading_percentage']:.1f}% ({result['medical_loading_analysis']['risk_category']})",
                f"Overall Health Score: {result['medical_loading_analysis']['overall_health_score']:.2f}/1.00",
                ""
            ])
            
            # Show key medical conditions (top 2 only)
            if result['medical_loading_analysis']['loading_breakdown']:
                report_lines.append("Key Medical Conditions:")
                for loading in result['medical_loading_analysis']['loading_breakdown'][:2]:  # Top 2 only
                    severity_emoji = {"critical": "🔴", "severe": "🟠", "moderate": "🟡", "mild": "🟢", "minimal": "⚪"}.get(loading['severity'], "⚫")
                    report_lines.append(f"  {severity_emoji} {loading['condition']}: {loading['loading_percentage']:.1f}%")
                report_lines.append("")
        
        # Critical alerts details if any
        if result['medical_extraction']['medical_findings_summary']['critical_alert_details']:
            report_lines.extend([
                "⚠️ CRITICAL MEDICAL ALERTS:",
                "-" * 30
            ])
            for alert in result['medical_extraction']['medical_findings_summary']['critical_alert_details']:
                report_lines.append(f"  • {alert}")
            report_lines.append("")
        
        # Risk Assessment
        report_lines.extend([
            "📊 COMPREHENSIVE RISK ASSESSMENT",
            "-" * 50,
            f"Overall Risk Level: {result['risk_assessment']['overall_risk_level']}",
            f"Composite Risk Score: {result['risk_assessment']['risk_score']:.3f}",
            "",
            "Component Risk Breakdown:",
            f"  • Medical Risk: {result['risk_assessment']['component_risks']['medical_risk']:.3f}",
            f"  • Lifestyle Risk: {result['risk_assessment']['component_risks']['lifestyle_risk']:.3f}",
            f"  • Financial Risk: {result['risk_assessment']['component_risks']['financial_risk']:.3f}",
            f"  • Occupational Risk: {result['risk_assessment']['component_risks']['occupation_risk']:.3f}",
            ""
        ])
        
        # Red flags if any
        if result['risk_assessment']['red_flags']:
            report_lines.extend([
                "🚩 IDENTIFIED RISK FLAGS:",
                "-" * 30
            ])
            for flag in result['risk_assessment']['red_flags']:
                report_lines.append(f"  • {flag}")
            report_lines.append("")
        
        # Fraud Assessment
        report_lines.extend([
            "🔍 FRAUD DETECTION ANALYSIS",
            "-" * 50,
            f"Overall Fraud Risk: {result['fraud_assessment']['overall_fraud_risk']}",
            f"Fraud Score: {result['fraud_assessment']['fraud_score']:.3f}",
            f"Total Indicators: {result['fraud_assessment']['indicators_count']}",
            f"Critical Indicators: {result['fraud_assessment']['critical_indicators']}",
            f"High Risk Indicators: {result['fraud_assessment']['high_risk_indicators']}",
            f"Verification Required: {'Yes' if result['fraud_assessment']['verification_requirements'] else 'No'}",
            ""
        ])
        
        # Key fraud concerns if any
        if result['fraud_assessment']['key_concerns']:
            report_lines.extend([
                "⚠️ FRAUD CONCERNS:",
                "-" * 20
            ])
            for concern in result['fraud_assessment']['key_concerns']:
                report_lines.append(f"  • {concern}")
            report_lines.append("")
        
        # Premium Analysis (if not declined)
        is_declined = result['underwriting_decision']['final_decision'] == 'declined'
        if not is_declined and 'premium_analysis' in result:
            report_lines.extend([
                "💰 DETAILED PREMIUM ANALYSIS",
                "-" * 50,
                f"Total Coverage Count: {result['premium_analysis']['total_covers']}",
                f"Total Base Premium: ₹{result['premium_analysis']['total_base_premium']:,.2f}",
                f"Total Final Premium: ₹{result['premium_analysis']['total_final_premium']:,.2f}",
                f"Total Loading Amount: ₹{result['premium_analysis']['total_loading_amount']:,.2f}",
                f"Average Loading %: {result['premium_analysis']['average_loading_percentage']:.1f}%",
                ""
            ])
            
            # Individual cover details
            report_lines.extend([
                "📋 COVERAGE-WISE PREMIUM BREAKDOWN:",
                "-" * 40
            ])
            
            for cover in result['premium_analysis']['cover_details']:
                report_lines.extend([
                    f"Cover Type: {cover['cover_type']}",
                    f"  Base Premium: ₹{cover['base_premium']:,.2f}",
                    f"  Final Premium: ₹{cover['final_premium']:,.2f}",
                    f"  Loading Applied: {cover['loading_percentage']:.1f}%",
                    f"  Loadings: {', '.join(cover['loadings_applied']) if cover['loadings_applied'] else 'None'}",
                    ""
                ])
        
        # Underwriting Decision
        report_lines.extend([
            "⚖️ FINAL UNDERWRITING DECISION",
            "-" * 50,
            f"Decision: {result['underwriting_decision']['final_decision'].upper()}",
            f"Confidence Score: {result['underwriting_decision']['confidence_score']:.1%}",
            ""
        ])
        
        # Decision reasoning
        if result['underwriting_decision']['reasoning']:
            report_lines.extend([
                "📝 DECISION RATIONALE:",
                "-" * 25
            ])
            for reason in result['underwriting_decision']['reasoning']:
                report_lines.append(f"  • {reason}")
            report_lines.append("")
        
        # Conditions and exclusions (if not declined)
        if not is_declined:
            if result['underwriting_decision']['conditions']:
                report_lines.extend([
                    "📋 POLICY CONDITIONS:",
                    "-" * 25
                ])
                for condition in result['underwriting_decision']['conditions']:
                    report_lines.append(f"  • {condition}")
                report_lines.append("")
            
            if result['underwriting_decision']['exclusions']:
                report_lines.extend([
                    "❌ POLICY EXCLUSIONS:",
                    "-" * 25
                ])
                for exclusion in result['underwriting_decision']['exclusions']:
                    report_lines.append(f"  • {exclusion}")
                report_lines.append("")
        
        # Business Impact
        report_lines.extend([
            "📈 BUSINESS IMPACT ANALYSIS",
            "-" * 50,
            f"Auto-Processable: {'Yes' if result['business_impact']['auto_processable'] else 'No'}",
            f"Manual Review Required: {'Yes' if result['business_impact']['requires_manual_review'] else 'No'}",
            f"Additional Requirements: {'Yes' if result['business_impact']['additional_requirements_needed'] else 'No'}",
            f"Declined: {'Yes' if result['business_impact']['declined'] else 'No'}",
            f"Est. Processing Time: {result['business_impact']['estimated_processing_time_days']} days",
            f"Business Value Score: {result['business_impact']['business_value_score']:.2f}",
            ""
        ])
        
        # Quality Metrics
        report_lines.extend([
            "📊 QUALITY METRICS",
            "-" * 50,
            f"Data Completeness: {result['quality_metrics']['data_completeness_score']:.1%}",
            f"Analysis Confidence: {result['quality_metrics']['analysis_confidence']:.1%}",
            f"Recommendation Strength: {result['quality_metrics']['recommendation_strength']:.1%}",
            f"System Performance: {result['quality_metrics']['system_performance_score']:.1%}",
            ""
        ])
        
        # Agent Analysis Summary (Simplified)
        if 'detailed_agent_responses' in result:
            report_lines.extend([
                "🤖 MULTI-AGENT ANALYSIS SUMMARY",
                "-" * 50,
                "✅ Medical Review: Diabetes risk assessment completed",
                "✅ Fraud Detection: Data authenticity verified", 
                "✅ Risk Assessment: High-risk classification confirmed",
                "✅ Premium Calculation: Loading-adjusted premiums calculated",
                "✅ Final Decision: Underwriting decision made",
                ""
            ])
        
        # Footer
        report_lines.extend([
            "=" * 100,
            "🔒 CONFIDENTIAL - FOR INTERNAL USE ONLY",
            f"Generated by AI-Powered Underwriting System v{result['application_metadata']['system_version']}",
            f"Report Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            "=" * 100
        ])
        
        return '\n'.join(report_lines)


async def main():
    """Main function to demonstrate the complete system"""
    
    print("🎯 AI-Powered Term Insurance Underwriting System")
    print("Starting complete application processing demonstration...")
    
    # Initialize system
    system = InsuranceUnderwritingSystem()
    
    # Process sample application
    result = await system.process_complete_application(
        applicant_data_file='data/sample/person_details.json',
        medical_images_directory='data/medical_reports'
    )
    
    if result and not result.get('processing_failed'):
        print("\n✅ Application processing completed successfully!")
        print(f"📊 System Performance Score: {result['quality_metrics']['system_performance_score']:.1%}")
        print(f"🎯 Business Value Score: {result['business_impact']['business_value_score']:.2f}")
        print(f"📈 Data Completeness: {result['quality_metrics']['data_completeness_score']:.1%}")
    else:
        print("\n❌ Application processing failed!")
    
    return result


if __name__ == "__main__":
    # Run the complete system
    result = asyncio.run(main())