"""
Fraud Detection and Risk Validation Module
=========================================

Advanced fraud detection system using pattern recognition, anomaly detection,
and behavioral analysis for insurance applications.
"""

import json
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Any, Tuple, Optional
from dataclasses import dataclass
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import logging


@dataclass
class FraudIndicator:
    """Fraud indicator with severity and evidence"""
    indicator_type: str
    severity: str  # LOW, MEDIUM, HIGH, CRITICAL
    description: str
    evidence: List[str]
    risk_score: float
    recommendation: str


@dataclass 
class FraudAssessment:
    """Comprehensive fraud assessment result"""
    overall_fraud_risk: str  # LOW, MEDIUM, HIGH, CRITICAL
    fraud_score: float  # 0.0 to 1.0
    indicators: List[FraudIndicator]
    verification_required: List[str]
    investigation_notes: List[str]
    confidence_level: float


class MedicalFraudDetector:
    """Detect medical fraud and non-disclosure patterns"""
    
    def __init__(self):
        self.anomaly_detector = IsolationForest(contamination=0.1, random_state=42)
        self.scaler = StandardScaler()
        
        # Common fraud patterns
        self.fraud_patterns = {
            'inconsistent_medical_history': {
                'weight': 0.8,
                'indicators': ['conflicting_dates', 'impossible_values', 'missing_progression']
            },
            'suspicious_test_timing': {
                'weight': 0.7,
                'indicators': ['tests_just_before_application', 'perfect_timing', 'multiple_same_day']
            },
            'document_authenticity': {
                'weight': 0.9,
                'indicators': ['format_inconsistencies', 'unusual_lab_names', 'perfect_values']
            },
            'non_disclosure_patterns': {
                'weight': 0.85,
                'indicators': ['hidden_conditions', 'medication_gaps', 'family_history_omissions']
            }
        }
    
    def analyze_medical_consistency(self, medical_data: Dict[str, Any], 
                                  applicant_data: Dict[str, Any]) -> List[FraudIndicator]:
        """Analyze medical data for consistency and potential fraud"""
        
        indicators = []
        
        # Extract medical reports
        medical_reports = medical_data.get('medical_data', [])
        
        # Check 1: Date consistency
        date_indicators = self._check_date_consistency(medical_reports)
        indicators.extend(date_indicators)
        
        # Check 2: Value consistency
        value_indicators = self._check_value_consistency(medical_reports)
        indicators.extend(value_indicators)
        
        # Check 3: Document authenticity
        doc_indicators = self._check_document_authenticity(medical_reports)
        indicators.extend(doc_indicators)
        
        # Check 4: Cross-reference with application data
        cross_ref_indicators = self._cross_reference_application(medical_reports, applicant_data)
        indicators.extend(cross_ref_indicators)
        
        return indicators
    
    def _check_date_consistency(self, medical_reports: List[Dict[str, Any]]) -> List[FraudIndicator]:
        """Check for suspicious date patterns"""
        
        indicators = []
        test_dates = []
        
        for report in medical_reports:
            if report.get('extraction_successful'):
                doc_info = report.get('structured_data', {}).get('documentInfo', {})
                test_date = doc_info.get('date')
                if test_date:
                    test_dates.append(test_date)
        
        # Check if all tests were done very close to application date
        if len(test_dates) >= 2:
            # Parse dates (assuming format like "27/11/2023")
            parsed_dates = []
            for date_str in test_dates:
                try:
                    if '/' in date_str:
                        day, month, year = date_str.split('/')
                        parsed_date = datetime(int(year), int(month), int(day))
                        parsed_dates.append(parsed_date)
                except:
                    continue
            
            if len(parsed_dates) >= 2:
                date_range = max(parsed_dates) - min(parsed_dates)
                
                # Suspicious if all tests within 7 days
                if date_range.days <= 7:
                    indicators.append(FraudIndicator(
                        indicator_type="suspicious_test_timing",
                        severity="MEDIUM",
                        description="All medical tests completed within a very short timeframe",
                        evidence=[f"Test date range: {date_range.days} days", f"Test dates: {test_dates}"],
                        risk_score=0.6,
                        recommendation="Verify if tests were routine health check or specifically for insurance"
                    ))
        
        return indicators
    
    def _check_value_consistency(self, medical_reports: List[Dict[str, Any]]) -> List[FraudIndicator]:
        """Check for suspicious value patterns"""
        
        indicators = []
        
        # Collect all numerical values
        all_values = []
        value_contexts = []
        
        for report in medical_reports:
            if report.get('extraction_successful'):
                structured_data = report.get('structured_data', {})
                lab_results = structured_data.get('labResults', {})
                
                # Skip if lab_results is None or empty
                if not lab_results or not isinstance(lab_results, dict):
                    continue
                
                # Extract values from different sections
                for section_name, section_data in lab_results.items():
                    if isinstance(section_data, dict):
                        for test_name, test_data in section_data.items():
                            if isinstance(test_data, dict) and 'value' in test_data:
                                try:
                                    value = float(test_data['value'])
                                    all_values.append(value)
                                    value_contexts.append(f"{section_name}.{test_name}")
                                except:
                                    continue
        
        # Check for suspiciously perfect values
        if all_values:
            # Check if too many values are exactly at reference range boundaries
            boundary_values = 0
            for i, value in enumerate(all_values):
                # Check if value is suspiciously round or at common reference boundaries
                if value in [50, 100, 150, 200, 250, 300] or value % 10 == 0:
                    boundary_values += 1
            
            if boundary_values / len(all_values) > 0.7:  # More than 70% round values
                indicators.append(FraudIndicator(
                    indicator_type="suspicious_values",
                    severity="MEDIUM",
                    description="Unusually high proportion of round/boundary values in medical tests",
                    evidence=[f"Round values: {boundary_values}/{len(all_values)}", f"Contexts: {value_contexts[:5]}"],
                    risk_score=0.5,
                    recommendation="Manual review of original test reports recommended"
                ))
        
        return indicators
    
    def _check_document_authenticity(self, medical_reports: List[Dict[str, Any]]) -> List[FraudIndicator]:
        """Check document authenticity indicators"""
        
        indicators = []
        
        # Check for consistent facility names
        facilities = []
        lab_numbers = []
        
        for report in medical_reports:
            if report.get('extraction_successful'):
                doc_info = report.get('structured_data', {}).get('documentInfo', {})
                
                facility = doc_info.get('facility')
                lab_number = doc_info.get('labNumber')
                
                if facility:
                    facilities.append(facility)
                if lab_number:
                    lab_numbers.append(lab_number)
        
        # Check if all from same facility (could be suspicious if very diverse tests)
        if len(set(facilities)) == 1 and len(facilities) > 2:
            # Check if test types are very diverse for single facility
            test_types = set()
            for report in medical_reports:
                if report.get('extraction_successful'):
                    doc_type = report.get('structured_data', {}).get('documentInfo', {}).get('type')
                    if doc_type:
                        test_types.add(doc_type)
            
            if len(test_types) >= 4:  # Many different test types from single facility
                indicators.append(FraudIndicator(
                    indicator_type="document_pattern",
                    severity="LOW",
                    description="All diverse medical tests from single facility",
                    evidence=[f"Facility: {facilities[0]}", f"Test types: {list(test_types)}"],
                    risk_score=0.3,
                    recommendation="Verify facility capabilities for all test types"
                ))
        
        return indicators
    
    def _cross_reference_application(self, medical_reports: List[Dict[str, Any]], 
                                   applicant_data: Dict[str, Any]) -> List[FraudIndicator]:
        """Cross-reference medical data with application information"""
        
        indicators = []
        
        # Check age consistency
        app_age = applicant_data.get('personalInfo', {}).get('age')
        
        for report in medical_reports:
            if report.get('extraction_successful'):
                patient_info = report.get('structured_data', {}).get('patientInfo', {})
                medical_age = patient_info.get('age')
                
                if medical_age and app_age:
                    try:
                        medical_age_num = int(str(medical_age).split()[0])  # Extract number from "34 years"
                        age_diff = abs(medical_age_num - app_age)
                        
                        if age_diff > 2:  # More than 2 years difference
                            indicators.append(FraudIndicator(
                                indicator_type="age_inconsistency",
                                severity="HIGH",
                                description="Age mismatch between application and medical reports",
                                evidence=[f"Application age: {app_age}", f"Medical report age: {medical_age}"],
                                risk_score=0.8,
                                recommendation="Verify identity and age documentation"
                            ))
                    except:
                        continue
        
        # Check name consistency (simplified)
        app_name = applicant_data.get('personalInfo', {}).get('name', '').upper()
        
        for report in medical_reports:
            if report.get('extraction_successful'):
                patient_info = report.get('structured_data', {}).get('patientInfo', {})
                medical_name = patient_info.get('name', '').upper()
                
                if medical_name and app_name:
                    # Simple name matching (in practice, use fuzzy matching)
                    if medical_name not in app_name and app_name not in medical_name:
                        # Check if they share common parts
                        app_parts = set(app_name.split())
                        med_parts = set(medical_name.split())
                        common_parts = app_parts.intersection(med_parts)
                        
                        if len(common_parts) < 2:  # Less than 2 common name parts
                            indicators.append(FraudIndicator(
                                indicator_type="name_inconsistency",
                                severity="CRITICAL",
                                description="Name mismatch between application and medical reports",
                                evidence=[f"Application: {app_name}", f"Medical: {medical_name}"],
                                risk_score=0.9,
                                recommendation="Immediate identity verification required"
                            ))
        
        return indicators


class FinancialFraudDetector:
    """Detect financial fraud patterns"""
    
    def __init__(self):
        self.income_multiplier_limits = {
            'standard': 10,  # Standard income multiple
            'high_income': 15,  # For high-income applicants
            'very_high_income': 20  # For very high-income applicants
        }
    
    def analyze_financial_patterns(self, applicant_data: Dict[str, Any]) -> List[FraudIndicator]:
        """Analyze financial information for fraud patterns"""
        
        indicators = []
        
        personal_info = applicant_data.get('personalInfo', {})
        insurance_coverage = applicant_data.get('insuranceCoverage', {})
        
        annual_income = personal_info.get('income', {}).get('annual', 0)
        total_sum_assured = insurance_coverage.get('totalSumAssured', 0)
        
        # Check income to coverage ratio
        if annual_income > 0 and total_sum_assured > 0:
            income_multiple = total_sum_assured / annual_income
            
            # Determine appropriate limit based on income level
            if annual_income >= 5000000:  # Very high income (50L+)
                limit = self.income_multiplier_limits['very_high_income']
            elif annual_income >= 2000000:  # High income (20L+)
                limit = self.income_multiplier_limits['high_income']
            else:
                limit = self.income_multiplier_limits['standard']
            
            if income_multiple > limit:
                indicators.append(FraudIndicator(
                    indicator_type="excessive_coverage",
                    severity="HIGH",
                    description=f"Coverage amount exceeds {limit}x of annual income",
                    evidence=[f"Income: ₹{annual_income:,}", f"Coverage: ₹{total_sum_assured:,}", f"Multiple: {income_multiple:.1f}x"],
                    risk_score=0.7,
                    recommendation="Detailed income verification and financial need analysis required"
                ))
        
        # Check for round numbers (could indicate inflated income)
        if annual_income > 0:
            if annual_income % 100000 == 0 and annual_income >= 1000000:  # Round lakhs
                indicators.append(FraudIndicator(
                    indicator_type="round_income",
                    severity="LOW",
                    description="Income declared in round figures",
                    evidence=[f"Annual income: ₹{annual_income:,}"],
                    risk_score=0.2,
                    recommendation="Request detailed income documentation"
                ))
        
        return indicators


class ComprehensiveFraudDetector:
    """Main fraud detection orchestrator"""
    
    def __init__(self):
        self.medical_detector = MedicalFraudDetector()
        self.financial_detector = FinancialFraudDetector()
        
        # Risk score weights
        self.severity_weights = {
            'LOW': 0.2,
            'MEDIUM': 0.5,
            'HIGH': 0.8,
            'CRITICAL': 1.0
        }
    
    def comprehensive_fraud_analysis(self, applicant_data: Dict[str, Any], 
                                   medical_data: Dict[str, Any]) -> FraudAssessment:
        """Perform comprehensive fraud detection analysis"""
        
        print("🔍 Starting comprehensive fraud detection analysis...")
        
        all_indicators = []
        
        # Medical fraud detection
        print("🏥 Analyzing medical fraud patterns...")
        medical_indicators = self.medical_detector.analyze_medical_consistency(medical_data, applicant_data)
        all_indicators.extend(medical_indicators)
        
        # Financial fraud detection  
        print("💰 Analyzing financial fraud patterns...")
        financial_indicators = self.financial_detector.analyze_financial_patterns(applicant_data)
        all_indicators.extend(financial_indicators)
        
        # Calculate overall fraud score
        fraud_score = self._calculate_fraud_score(all_indicators)
        
        # Determine overall risk level
        overall_risk = self._determine_overall_risk(fraud_score, all_indicators)
        
        # Generate verification requirements
        verification_required = self._generate_verification_requirements(all_indicators)
        
        # Generate investigation notes
        investigation_notes = self._generate_investigation_notes(all_indicators)
        
        # Calculate confidence
        confidence = min(0.95, 0.7 + (len(all_indicators) * 0.05))
        
        assessment = FraudAssessment(
            overall_fraud_risk=overall_risk,
            fraud_score=fraud_score,
            indicators=all_indicators,
            verification_required=verification_required,
            investigation_notes=investigation_notes,
            confidence_level=confidence
        )
        
        print(f"✅ Fraud analysis completed. Risk level: {overall_risk}")
        
        return assessment
    
    def _calculate_fraud_score(self, indicators: List[FraudIndicator]) -> float:
        """Calculate overall fraud score"""
        
        if not indicators:
            return 0.0
        
        # Weighted average of indicator scores
        total_weighted_score = 0
        total_weight = 0
        
        for indicator in indicators:
            weight = self.severity_weights.get(indicator.severity, 0.5)
            total_weighted_score += indicator.risk_score * weight
            total_weight += weight
        
        if total_weight == 0:
            return 0.0
        
        return min(1.0, total_weighted_score / total_weight)
    
    def _determine_overall_risk(self, fraud_score: float, indicators: List[FraudIndicator]) -> str:
        """Determine overall fraud risk level"""
        
        # Check for critical indicators
        critical_indicators = [ind for ind in indicators if ind.severity == 'CRITICAL']
        if critical_indicators:
            return 'CRITICAL'
        
        # Check for high indicators
        high_indicators = [ind for ind in indicators if ind.severity == 'HIGH']
        if len(high_indicators) >= 2:
            return 'HIGH'
        
        # Based on fraud score
        if fraud_score >= 0.7:
            return 'HIGH'
        elif fraud_score >= 0.4:
            return 'MEDIUM'
        else:
            return 'LOW'
    
    def _generate_verification_requirements(self, indicators: List[FraudIndicator]) -> List[str]:
        """Generate specific verification requirements"""
        
        requirements = []
        
        # Check indicator types and add appropriate requirements
        indicator_types = [ind.indicator_type for ind in indicators]
        
        if 'age_inconsistency' in indicator_types or 'name_inconsistency' in indicator_types:
            requirements.append("Identity verification with original documents")
        
        if 'excessive_coverage' in indicator_types:
            requirements.extend([
                "Detailed income verification (Form 16, bank statements, IT returns)",
                "Financial need analysis and justification"
            ])
        
        if 'suspicious_test_timing' in indicator_types:
            requirements.append("Verify medical test authenticity with original lab reports")
        
        if 'document_pattern' in indicator_types:
            requirements.append("Independent medical examination from company-approved facility")
        
        # Default requirements for any fraud indicators
        if indicators:
            requirements.extend([
                "Enhanced due diligence process",
                "Supervisor approval required"
            ])
        
        return list(set(requirements))  # Remove duplicates
    
    def _generate_investigation_notes(self, indicators: List[FraudIndicator]) -> List[str]:
        """Generate investigation notes for underwriters"""
        
        notes = []
        
        if not indicators:
            notes.append("No significant fraud indicators detected in automated analysis")
            return notes
        
        # Summarize by severity
        severity_counts = {}
        for indicator in indicators:
            severity_counts[indicator.severity] = severity_counts.get(indicator.severity, 0) + 1
        
        notes.append(f"Fraud analysis identified {len(indicators)} potential risk indicators:")
        for severity, count in severity_counts.items():
            notes.append(f"  - {severity}: {count} indicators")
        
        # Highlight critical and high-severity issues
        critical_issues = [ind for ind in indicators if ind.severity in ['CRITICAL', 'HIGH']]
        if critical_issues:
            notes.append("PRIORITY ATTENTION REQUIRED:")
            for issue in critical_issues[:3]:  # Top 3 critical issues
                notes.append(f"  - {issue.description}")
        
        notes.append("Recommend manual underwriter review with enhanced scrutiny")
        
        return notes


# Example usage and testing
def test_fraud_detection():
    """Test the fraud detection system"""
    
    print("🧪 Testing Fraud Detection System")
    
    # Load sample data
    try:
        with open('person_details.json', 'r') as f:
            applicant_data = json.load(f)
        
        with open('structured_medical_data_20250926_124659.json', 'r') as f:
            medical_data = json.load(f)
        
        # Initialize fraud detector
        fraud_detector = ComprehensiveFraudDetector()
        
        # Run analysis
        assessment = fraud_detector.comprehensive_fraud_analysis(applicant_data, medical_data)
        
        # Print results
        print("\n" + "="*50)
        print("FRAUD DETECTION RESULTS")
        print("="*50)
        print(f"Overall Risk Level: {assessment.overall_fraud_risk}")
        print(f"Fraud Score: {assessment.fraud_score:.2f}")
        print(f"Indicators Found: {len(assessment.indicators)}")
        print(f"Confidence Level: {assessment.confidence_level:.1%}")
        
        if assessment.indicators:
            print("\nDetected Indicators:")
            for i, indicator in enumerate(assessment.indicators, 1):
                print(f"{i}. {indicator.severity}: {indicator.description}")
        
        if assessment.verification_required:
            print("\nVerification Required:")
            for req in assessment.verification_required:
                print(f"  - {req}")
        
        return assessment
        
    except FileNotFoundError as e:
        print(f"❌ Error: Sample data files not found - {e}")
        return None


if __name__ == "__main__":
    test_fraud_detection()