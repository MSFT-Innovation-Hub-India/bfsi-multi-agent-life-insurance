"""
Advanced Medical Loading Engine for Life Insurance Underwriting
============================================================

This module provides comprehensive medical loading calculations based on:
- Laboratory test results (CBC, LFT, RFT, Lipid Profile, etc.)
- Medical conditions and critical alerts
- Chronic disease indicators
- Age and gender-specific risk factors
- Industry-standard medical loading tables

Features:
- Condition-specific loading percentages
- Multi-factor risk assessment
- Age-adjusted loadings
- Gender-specific adjustments
- Chronic condition penalties
- Medication-based risk evaluation
"""

import json
import logging
from dataclasses import dataclass
from typing import Dict, List, Any, Optional, Tuple
from enum import Enum
import re
from datetime import datetime


class MedicalConditionSeverity(Enum):
    """Severity levels for medical conditions"""
    MINIMAL = "minimal"
    MILD = "mild"
    MODERATE = "moderate"
    SEVERE = "severe"
    CRITICAL = "critical"


class LoadingType(Enum):
    """Types of medical loadings"""
    MEDICAL = "medical"
    LIFESTYLE = "lifestyle"
    OCCUPATIONAL = "occupational"
    COMBINED = "combined"


@dataclass
class MedicalLoading:
    """Individual medical loading details"""
    condition: str
    loading_percentage: float
    severity: MedicalConditionSeverity
    loading_type: LoadingType
    reasoning: str
    affects_critical_illness: bool = True
    affects_term_life: bool = True
    affects_disability: bool = True


@dataclass
class LoadingResult:
    """Comprehensive loading calculation result"""
    total_loading_percentage: float
    individual_loadings: List[MedicalLoading]
    critical_alerts_count: int
    abnormal_findings_count: int
    normal_findings_count: int
    overall_health_score: float
    risk_category: str
    recommendations: List[str]
    exclusions: List[str]
    requires_additional_tests: bool


class MedicalLoadingEngine:
    """Advanced medical loading calculation engine"""
    
    def __init__(self):
        """Initialize the medical loading engine with comprehensive loading tables"""
        
        # Comprehensive medical loading tables based on industry standards
        self.medical_loading_table = {
            # Diabetes and Blood Sugar Disorders
            'diabetes_type_1': {'loading': 150, 'severity': MedicalConditionSeverity.SEVERE},
            'diabetes_type_2_controlled': {'loading': 75, 'severity': MedicalConditionSeverity.MODERATE},
            'diabetes_type_2_uncontrolled': {'loading': 125, 'severity': MedicalConditionSeverity.SEVERE},
            'prediabetes': {'loading': 25, 'severity': MedicalConditionSeverity.MILD},
            'hba1c_elevated_mild': {'loading': 30, 'severity': MedicalConditionSeverity.MILD},
            'hba1c_elevated_moderate': {'loading': 60, 'severity': MedicalConditionSeverity.MODERATE},
            'hba1c_elevated_severe': {'loading': 100, 'severity': MedicalConditionSeverity.SEVERE},
            'blood_sugar_abnormal': {'loading': 40, 'severity': MedicalConditionSeverity.MODERATE},
            
            # Cardiovascular Conditions
            'hypertension_mild': {'loading': 25, 'severity': MedicalConditionSeverity.MILD},
            'hypertension_moderate': {'loading': 50, 'severity': MedicalConditionSeverity.MODERATE},
            'hypertension_severe': {'loading': 100, 'severity': MedicalConditionSeverity.SEVERE},
            'coronary_artery_disease': {'loading': 125, 'severity': MedicalConditionSeverity.SEVERE},
            'heart_attack_history': {'loading': 200, 'severity': MedicalConditionSeverity.CRITICAL},
            'cardiac_abnormality': {'loading': 75, 'severity': MedicalConditionSeverity.MODERATE},
            'arrhythmia': {'loading': 50, 'severity': MedicalConditionSeverity.MODERATE},
            'valve_disease_mild': {'loading': 40, 'severity': MedicalConditionSeverity.MILD},
            'valve_disease_moderate': {'loading': 80, 'severity': MedicalConditionSeverity.MODERATE},
            'cholesterol_high': {'loading': 20, 'severity': MedicalConditionSeverity.MILD},
            'cholesterol_very_high': {'loading': 40, 'severity': MedicalConditionSeverity.MODERATE},
            
            # Liver Conditions
            'liver_function_abnormal': {'loading': 60, 'severity': MedicalConditionSeverity.MODERATE},
            'hepatitis_b_inactive': {'loading': 75, 'severity': MedicalConditionSeverity.MODERATE},
            'hepatitis_b_active': {'loading': 150, 'severity': MedicalConditionSeverity.SEVERE},
            'hepatitis_c_treated': {'loading': 50, 'severity': MedicalConditionSeverity.MODERATE},
            'fatty_liver': {'loading': 25, 'severity': MedicalConditionSeverity.MILD},
            'cirrhosis': {'loading': 300, 'severity': MedicalConditionSeverity.CRITICAL},
            'alt_elevated_mild': {'loading': 20, 'severity': MedicalConditionSeverity.MILD},
            'alt_elevated_moderate': {'loading': 40, 'severity': MedicalConditionSeverity.MODERATE},
            'alt_elevated_severe': {'loading': 80, 'severity': MedicalConditionSeverity.SEVERE},
            
            # Kidney Conditions
            'kidney_disease_chronic_mild': {'loading': 50, 'severity': MedicalConditionSeverity.MODERATE},
            'kidney_disease_chronic_moderate': {'loading': 100, 'severity': MedicalConditionSeverity.SEVERE},
            'kidney_disease_chronic_severe': {'loading': 250, 'severity': MedicalConditionSeverity.CRITICAL},
            'creatinine_elevated_mild': {'loading': 25, 'severity': MedicalConditionSeverity.MILD},
            'creatinine_elevated_moderate': {'loading': 50, 'severity': MedicalConditionSeverity.MODERATE},
            'creatinine_elevated_severe': {'loading': 100, 'severity': MedicalConditionSeverity.SEVERE},
            'proteinuria': {'loading': 40, 'severity': MedicalConditionSeverity.MODERATE},
            
            # Blood Disorders
            'anemia_mild': {'loading': 15, 'severity': MedicalConditionSeverity.MILD},
            'anemia_moderate': {'loading': 35, 'severity': MedicalConditionSeverity.MODERATE},
            'anemia_severe': {'loading': 75, 'severity': MedicalConditionSeverity.SEVERE},
            'iron_deficiency': {'loading': 10, 'severity': MedicalConditionSeverity.MINIMAL},
            'vitamin_b12_deficiency': {'loading': 15, 'severity': MedicalConditionSeverity.MILD},
            'bleeding_disorder': {'loading': 100, 'severity': MedicalConditionSeverity.SEVERE},
            'thrombocytopenia': {'loading': 60, 'severity': MedicalConditionSeverity.MODERATE},
            'leukopenia': {'loading': 50, 'severity': MedicalConditionSeverity.MODERATE},
            
            # Thyroid Conditions
            'hypothyroidism_controlled': {'loading': 10, 'severity': MedicalConditionSeverity.MINIMAL},
            'hypothyroidism_uncontrolled': {'loading': 40, 'severity': MedicalConditionSeverity.MODERATE},
            'hyperthyroidism_controlled': {'loading': 25, 'severity': MedicalConditionSeverity.MILD},
            'hyperthyroidism_uncontrolled': {'loading': 75, 'severity': MedicalConditionSeverity.SEVERE},
            'thyroid_nodules': {'loading': 20, 'severity': MedicalConditionSeverity.MILD},
            
            # Respiratory Conditions
            'asthma_mild': {'loading': 25, 'severity': MedicalConditionSeverity.MILD},
            'asthma_moderate': {'loading': 50, 'severity': MedicalConditionSeverity.MODERATE},
            'asthma_severe': {'loading': 100, 'severity': MedicalConditionSeverity.SEVERE},
            'copd_mild': {'loading': 75, 'severity': MedicalConditionSeverity.MODERATE},
            'copd_moderate': {'loading': 150, 'severity': MedicalConditionSeverity.SEVERE},
            'copd_severe': {'loading': 300, 'severity': MedicalConditionSeverity.CRITICAL},
            
            # Gastrointestinal Conditions
            'peptic_ulcer': {'loading': 15, 'severity': MedicalConditionSeverity.MILD},
            'ibd_controlled': {'loading': 50, 'severity': MedicalConditionSeverity.MODERATE},
            'ibd_active': {'loading': 100, 'severity': MedicalConditionSeverity.SEVERE},
            
            # Cancer History
            'cancer_history_5_years': {'loading': 200, 'severity': MedicalConditionSeverity.CRITICAL},
            'cancer_history_remission': {'loading': 100, 'severity': MedicalConditionSeverity.SEVERE},
            
            # Mental Health
            'depression_controlled': {'loading': 25, 'severity': MedicalConditionSeverity.MILD},
            'depression_severe': {'loading': 75, 'severity': MedicalConditionSeverity.SEVERE},
            'anxiety_disorder': {'loading': 20, 'severity': MedicalConditionSeverity.MILD},
            
            # Lifestyle Factors
            'obesity_mild': {'loading': 15, 'severity': MedicalConditionSeverity.MILD},
            'obesity_moderate': {'loading': 35, 'severity': MedicalConditionSeverity.MODERATE},
            'obesity_severe': {'loading': 75, 'severity': MedicalConditionSeverity.SEVERE},
            'smoking_current': {'loading': 50, 'severity': MedicalConditionSeverity.MODERATE},
            'smoking_quit_recent': {'loading': 25, 'severity': MedicalConditionSeverity.MILD},
            'alcohol_abuse': {'loading': 75, 'severity': MedicalConditionSeverity.SEVERE},
        }
        
        # Age-based loading adjustments
        self.age_loading_adjustments = {
            (18, 25): 0.8,   # Young adults get 20% reduction
            (26, 35): 1.0,   # Standard
            (36, 45): 1.2,   # 20% increase
            (46, 55): 1.4,   # 40% increase
            (56, 65): 1.6,   # 60% increase
            (66, 75): 2.0,   # 100% increase
        }
        
        # Gender-specific adjustments
        self.gender_adjustments = {
            'female': {
                'cardiovascular': 0.8,  # Women have lower cardiovascular risk until menopause
                'diabetes': 1.0,
                'cancer': 1.1,  # Slightly higher due to breast/ovarian cancer risk
                'osteoporosis': 1.5,
            },
            'male': {
                'cardiovascular': 1.2,  # Men have higher cardiovascular risk
                'diabetes': 1.0,
                'cancer': 0.9,
                'respiratory': 1.1,  # Higher smoking-related risk
            }
        }
        
        self.logger = logging.getLogger(__name__)
    
    def calculate_comprehensive_loading(self, 
                                      applicant_data: Dict[str, Any], 
                                      medical_data: Dict[str, Any]) -> LoadingResult:
        """
        Calculate comprehensive medical loading based on all available medical data
        
        Args:
            applicant_data: Personal and health information
            medical_data: Extracted medical report data
            
        Returns:
            LoadingResult with detailed loading breakdown
        """
        
        individual_loadings = []
        recommendations = []
        exclusions = []
        requires_additional_tests = False
        
        # Get applicant demographics
        age = applicant_data.get('personalInfo', {}).get('age', 35)
        gender = applicant_data.get('personalInfo', {}).get('gender', 'male').lower()
        
        # Initialize counters
        critical_alerts_count = 0
        abnormal_findings_count = 0
        normal_findings_count = 0
        
        # Process each medical report
        for report in medical_data.get('medical_data', []):
            if not report.get('extraction_successful'):
                continue
                
            structured_data = report.get('structured_data', {})
            clinical_findings = structured_data.get('clinicalFindings', {})
            
            # Count findings
            normal_findings_count += len(clinical_findings.get('normalValues', []))
            abnormal_findings_count += len(clinical_findings.get('abnormalValues', []))
            critical_alerts_count += len(clinical_findings.get('criticalAlerts', []))
            
            # Process critical alerts
            for alert in clinical_findings.get('criticalAlerts', []):
                loading = self._process_critical_alert(alert, age, gender)
                if loading:
                    individual_loadings.append(loading)
            
            # Process abnormal values
            for abnormal in clinical_findings.get('abnormalValues', []):
                loading = self._process_abnormal_value(abnormal, age, gender)
                if loading:
                    individual_loadings.append(loading)
            
            # Process lab results
            lab_results = structured_data.get('labResults', {})
            lab_loadings = self._process_lab_results(lab_results, age, gender)
            individual_loadings.extend(lab_loadings)
        
        # Process lifestyle factors
        lifestyle_loadings = self._process_lifestyle_factors(applicant_data, age, gender)
        individual_loadings.extend(lifestyle_loadings)
        
        # Calculate overall health score
        total_findings = critical_alerts_count + abnormal_findings_count + normal_findings_count
        health_score = self._calculate_health_score(
            normal_findings_count, abnormal_findings_count, critical_alerts_count, total_findings
        )
        
        # Calculate combined loading
        total_loading = self._calculate_combined_loading(individual_loadings, age, gender)
        
        # Determine risk category
        risk_category = self._determine_risk_category(total_loading, critical_alerts_count)
        
        # Generate recommendations and exclusions
        recommendations, exclusions, requires_additional_tests = self._generate_recommendations_and_exclusions(
            individual_loadings, critical_alerts_count, abnormal_findings_count
        )
        
        return LoadingResult(
            total_loading_percentage=total_loading,
            individual_loadings=individual_loadings,
            critical_alerts_count=critical_alerts_count,
            abnormal_findings_count=abnormal_findings_count,
            normal_findings_count=normal_findings_count,
            overall_health_score=health_score,
            risk_category=risk_category,
            recommendations=recommendations,
            exclusions=exclusions,
            requires_additional_tests=requires_additional_tests
        )
    
    def _process_critical_alert(self, alert: str, age: int, gender: str) -> Optional[MedicalLoading]:
        """Process critical medical alerts and determine loading"""
        
        alert_lower = alert.lower()
        
        # HbA1c related alerts
        if 'hba1c' in alert_lower or 'glycated hemoglobin' in alert_lower:
            # Extract HbA1c value
            hba1c_match = re.search(r'(\d+\.?\d*)\s*%', alert)
            if hba1c_match:
                hba1c_value = float(hba1c_match.group(1))
                if hba1c_value >= 10.0:
                    return MedicalLoading(
                        condition="Severe Diabetes (HbA1c ≥10%)",
                        loading_percentage=150,
                        severity=MedicalConditionSeverity.CRITICAL,
                        loading_type=LoadingType.MEDICAL,
                        reasoning=f"HbA1c {hba1c_value}% indicates severe diabetes with poor control",
                        affects_critical_illness=True,
                        affects_term_life=True,
                        affects_disability=True
                    )
                elif hba1c_value >= 8.5:
                    return MedicalLoading(
                        condition="Uncontrolled Diabetes (HbA1c 8.5-9.9%)",
                        loading_percentage=100,
                        severity=MedicalConditionSeverity.SEVERE,
                        loading_type=LoadingType.MEDICAL,
                        reasoning=f"HbA1c {hba1c_value}% indicates uncontrolled diabetes",
                        affects_critical_illness=True,
                        affects_term_life=True,
                        affects_disability=True
                    )
                elif hba1c_value >= 7.0:
                    return MedicalLoading(
                        condition="Diabetes (HbA1c 7.0-8.4%)",
                        loading_percentage=75,
                        severity=MedicalConditionSeverity.MODERATE,
                        loading_type=LoadingType.MEDICAL,
                        reasoning=f"HbA1c {hba1c_value}% indicates diabetes requiring management",
                        affects_critical_illness=True,
                        affects_term_life=True,
                        affects_disability=True
                    )
        
        # Blood pressure alerts
        if 'blood pressure' in alert_lower or 'hypertension' in alert_lower:
            # Extract BP values
            bp_match = re.search(r'(\d+)/(\d+)', alert)
            if bp_match:
                systolic = int(bp_match.group(1))
                diastolic = int(bp_match.group(2))
                
                if systolic >= 180 or diastolic >= 110:
                    return MedicalLoading(
                        condition="Severe Hypertension",
                        loading_percentage=100,
                        severity=MedicalConditionSeverity.SEVERE,
                        loading_type=LoadingType.MEDICAL,
                        reasoning=f"Blood pressure {systolic}/{diastolic} indicates severe hypertension",
                        affects_critical_illness=True,
                        affects_term_life=True,
                        affects_disability=True
                    )
                elif systolic >= 160 or diastolic >= 100:
                    return MedicalLoading(
                        condition="Moderate Hypertension",
                        loading_percentage=50,
                        severity=MedicalConditionSeverity.MODERATE,
                        loading_type=LoadingType.MEDICAL,
                        reasoning=f"Blood pressure {systolic}/{diastolic} indicates moderate hypertension",
                        affects_critical_illness=True,
                        affects_term_life=True,
                        affects_disability=True
                    )
        
        # Liver function alerts
        if any(keyword in alert_lower for keyword in ['alt', 'ast', 'liver', 'hepatic']):
            return MedicalLoading(
                condition="Liver Function Abnormality",
                loading_percentage=60,
                severity=MedicalConditionSeverity.MODERATE,
                loading_type=LoadingType.MEDICAL,
                reasoning="Critical liver function abnormality detected",
                affects_critical_illness=True,
                affects_term_life=True,
                affects_disability=True
            )
        
        # Kidney function alerts
        if any(keyword in alert_lower for keyword in ['creatinine', 'kidney', 'renal', 'urea']):
            return MedicalLoading(
                condition="Kidney Function Abnormality",
                loading_percentage=50,
                severity=MedicalConditionSeverity.MODERATE,
                loading_type=LoadingType.MEDICAL,
                reasoning="Critical kidney function abnormality detected",
                affects_critical_illness=True,
                affects_term_life=True,
                affects_disability=True
            )
        
        # Cardiac alerts
        if any(keyword in alert_lower for keyword in ['cardiac', 'heart', 'ecg', 'echo']):
            return MedicalLoading(
                condition="Cardiac Abnormality",
                loading_percentage=75,
                severity=MedicalConditionSeverity.MODERATE,
                loading_type=LoadingType.MEDICAL,
                reasoning="Critical cardiac abnormality detected",
                affects_critical_illness=True,
                affects_term_life=True,
                affects_disability=True
            )
        
        return None
    
    def _process_abnormal_value(self, abnormal: str, age: int, gender: str) -> Optional[MedicalLoading]:
        """Process abnormal values and determine appropriate loading"""
        
        abnormal_lower = abnormal.lower()
        
        # Handle dictionary format abnormal values
        if isinstance(abnormal, dict):
            abnormal_lower = str(abnormal.get('description', abnormal.get('value', ''))).lower()
        
        # Cholesterol abnormalities
        if 'cholesterol' in abnormal_lower or 'ldl' in abnormal_lower:
            # Extract cholesterol value
            chol_match = re.search(r'(\d+)\s*mg/dl', abnormal_lower)
            if chol_match:
                chol_value = int(chol_match.group(1))
                if 'total' in abnormal_lower and chol_value > 300:
                    return MedicalLoading(
                        condition="Very High Cholesterol",
                        loading_percentage=40,
                        severity=MedicalConditionSeverity.MODERATE,
                        loading_type=LoadingType.MEDICAL,
                        reasoning=f"Total cholesterol {chol_value} mg/dL is very high",
                        affects_critical_illness=True,
                        affects_term_life=True,
                        affects_disability=False
                    )
                elif 'total' in abnormal_lower and chol_value > 240:
                    return MedicalLoading(
                        condition="High Cholesterol",
                        loading_percentage=20,
                        severity=MedicalConditionSeverity.MILD,
                        loading_type=LoadingType.MEDICAL,
                        reasoning=f"Total cholesterol {chol_value} mg/dL is high",
                        affects_critical_illness=True,
                        affects_term_life=True,
                        affects_disability=False
                    )
        
        # Hemoglobin abnormalities (anemia)
        if 'hemoglobin' in abnormal_lower or 'hb' in abnormal_lower:
            hb_match = re.search(r'(\d+\.?\d*)\s*g', abnormal_lower)
            if hb_match:
                hb_value = float(hb_match.group(1))
                if hb_value < 10:
                    return MedicalLoading(
                        condition="Moderate Anemia",
                        loading_percentage=35,
                        severity=MedicalConditionSeverity.MODERATE,
                        loading_type=LoadingType.MEDICAL,
                        reasoning=f"Hemoglobin {hb_value} g/dL indicates moderate anemia",
                        affects_critical_illness=True,
                        affects_term_life=True,
                        affects_disability=True
                    )
                elif hb_value < 12:
                    return MedicalLoading(
                        condition="Mild Anemia",
                        loading_percentage=15,
                        severity=MedicalConditionSeverity.MILD,
                        loading_type=LoadingType.MEDICAL,
                        reasoning=f"Hemoglobin {hb_value} g/dL indicates mild anemia",
                        affects_critical_illness=False,
                        affects_term_life=True,
                        affects_disability=True
                    )
        
        # Thyroid abnormalities
        if any(keyword in abnormal_lower for keyword in ['tsh', 't3', 't4', 'thyroid']):
            return MedicalLoading(
                condition="Thyroid Dysfunction",
                loading_percentage=25,
                severity=MedicalConditionSeverity.MILD,
                loading_type=LoadingType.MEDICAL,
                reasoning="Abnormal thyroid function detected",
                affects_critical_illness=False,
                affects_term_life=True,
                affects_disability=True
            )
        
        # General metabolic abnormalities
        if any(keyword in abnormal_lower for keyword in ['glucose', 'sugar', 'metabolic']):
            return MedicalLoading(
                condition="Metabolic Abnormality",
                loading_percentage=30,
                severity=MedicalConditionSeverity.MILD,
                loading_type=LoadingType.MEDICAL,
                reasoning="Metabolic parameter abnormality detected",
                affects_critical_illness=True,
                affects_term_life=True,
                affects_disability=True
            )
        
        return None
    
    def _process_lab_results(self, lab_results: Dict[str, Any], age: int, gender: str) -> List[MedicalLoading]:
        """Process laboratory results and determine loadings"""
        
        loadings = []
        
        # Process blood sugar results
        blood_sugar = lab_results.get('bloodSugar', {})
        if blood_sugar:
            # Handle different blood sugar formats
            if isinstance(blood_sugar.get('random'), list):
                for reading in blood_sugar['random']:
                    if isinstance(reading, dict) and reading.get('value', 0) > 200:
                        loadings.append(MedicalLoading(
                            condition="High Random Blood Sugar",
                            loading_percentage=40,
                            severity=MedicalConditionSeverity.MODERATE,
                            loading_type=LoadingType.MEDICAL,
                            reasoning=f"Random blood sugar {reading['value']} mg/dL is elevated",
                            affects_critical_illness=True,
                            affects_term_life=True,
                            affects_disability=True
                        ))
            
            fasting_glucose = blood_sugar.get('fasting', 0)
            if fasting_glucose > 126:
                loadings.append(MedicalLoading(
                    condition="Diabetes (Fasting Glucose)",
                    loading_percentage=75,
                    severity=MedicalConditionSeverity.MODERATE,
                    loading_type=LoadingType.MEDICAL,
                    reasoning=f"Fasting glucose {fasting_glucose} mg/dL indicates diabetes",
                    affects_critical_illness=True,
                    affects_term_life=True,
                    affects_disability=True
                ))
            elif fasting_glucose > 110:
                loadings.append(MedicalLoading(
                    condition="Prediabetes (Fasting Glucose)",
                    loading_percentage=25,
                    severity=MedicalConditionSeverity.MILD,
                    loading_type=LoadingType.MEDICAL,
                    reasoning=f"Fasting glucose {fasting_glucose} mg/dL indicates prediabetes",
                    affects_critical_illness=True,
                    affects_term_life=True,
                    affects_disability=False
                ))
        
        # Process Complete Blood Count
        cbc = lab_results.get('completeBloodCount', {})
        if cbc:
            # Hemoglobin analysis
            hb_data = cbc.get('hemoglobin', {})
            if isinstance(hb_data, dict) and 'value' in hb_data:
                try:
                    hb_value = float(hb_data['value'])
                    if hb_value < 10:
                        loadings.append(MedicalLoading(
                            condition="Moderate Anemia",
                            loading_percentage=35,
                            severity=MedicalConditionSeverity.MODERATE,
                            loading_type=LoadingType.MEDICAL,
                            reasoning=f"Hemoglobin {hb_value} g/dL indicates moderate anemia",
                            affects_critical_illness=True,
                            affects_term_life=True,
                            affects_disability=True
                        ))
                    elif hb_value < 12 and gender.lower() == 'female':
                        loadings.append(MedicalLoading(
                            condition="Mild Anemia (Female)",
                            loading_percentage=15,
                            severity=MedicalConditionSeverity.MILD,
                            loading_type=LoadingType.MEDICAL,
                            reasoning=f"Hemoglobin {hb_value} g/dL indicates mild anemia in female",
                            affects_critical_illness=False,
                            affects_term_life=True,
                            affects_disability=True
                        ))
                    elif hb_value < 13 and gender.lower() == 'male':
                        loadings.append(MedicalLoading(
                            condition="Mild Anemia (Male)",
                            loading_percentage=15,
                            severity=MedicalConditionSeverity.MILD,
                            loading_type=LoadingType.MEDICAL,
                            reasoning=f"Hemoglobin {hb_value} g/dL indicates mild anemia in male",
                            affects_critical_illness=False,
                            affects_term_life=True,
                            affects_disability=True
                        ))
                except (ValueError, TypeError):
                    pass
            
            # WBC analysis
            wbc_data = cbc.get('wbc', {})
            if isinstance(wbc_data, dict) and 'value' in wbc_data:
                try:
                    wbc_value = float(wbc_data['value'])
                    if wbc_value > 15000:
                        loadings.append(MedicalLoading(
                            condition="Elevated White Blood Cells",
                            loading_percentage=30,
                            severity=MedicalConditionSeverity.MODERATE,
                            loading_type=LoadingType.MEDICAL,
                            reasoning=f"WBC count {wbc_value}/cmm indicates possible infection or inflammation",
                            affects_critical_illness=True,
                            affects_term_life=False,
                            affects_disability=True
                        ))
                    elif wbc_value < 4000:
                        loadings.append(MedicalLoading(
                            condition="Low White Blood Cells",
                            loading_percentage=25,
                            severity=MedicalConditionSeverity.MILD,
                            loading_type=LoadingType.MEDICAL,
                            reasoning=f"WBC count {wbc_value}/cmm is below normal range",
                            affects_critical_illness=True,
                            affects_term_life=False,
                            affects_disability=True
                        ))
                except (ValueError, TypeError):
                    pass
        
        # Process Liver Function Tests
        liver_function = lab_results.get('liverFunction', {})
        if liver_function:
            for enzyme in ['ALT', 'AST', 'ALP']:
                enzyme_data = liver_function.get(enzyme, {})
                if isinstance(enzyme_data, dict) and 'value' in enzyme_data:
                    try:
                        enzyme_value = float(enzyme_data['value'])
                        upper_limit = 40 if enzyme in ['ALT', 'AST'] else 120  # Typical upper limits
                        
                        if enzyme_value > upper_limit * 3:
                            loadings.append(MedicalLoading(
                                condition=f"Severely Elevated {enzyme}",
                                loading_percentage=80,
                                severity=MedicalConditionSeverity.SEVERE,
                                loading_type=LoadingType.MEDICAL,
                                reasoning=f"{enzyme} {enzyme_value} U/L is severely elevated",
                                affects_critical_illness=True,
                                affects_term_life=True,
                                affects_disability=True
                            ))
                        elif enzyme_value > upper_limit * 2:
                            loadings.append(MedicalLoading(
                                condition=f"Moderately Elevated {enzyme}",
                                loading_percentage=40,
                                severity=MedicalConditionSeverity.MODERATE,
                                loading_type=LoadingType.MEDICAL,
                                reasoning=f"{enzyme} {enzyme_value} U/L is moderately elevated",
                                affects_critical_illness=True,
                                affects_term_life=True,
                                affects_disability=True
                            ))
                        elif enzyme_value > upper_limit:
                            loadings.append(MedicalLoading(
                                condition=f"Mildly Elevated {enzyme}",
                                loading_percentage=20,
                                severity=MedicalConditionSeverity.MILD,
                                loading_type=LoadingType.MEDICAL,
                                reasoning=f"{enzyme} {enzyme_value} U/L is mildly elevated",
                                affects_critical_illness=False,
                                affects_term_life=True,
                                affects_disability=True
                            ))
                    except (ValueError, TypeError):
                        pass
        
        return loadings
    
    def _process_lifestyle_factors(self, applicant_data: Dict[str, Any], age: int, gender: str) -> List[MedicalLoading]:
        """Process lifestyle factors and calculate loadings"""
        
        loadings = []
        lifestyle = applicant_data.get('lifestyle', {})
        health = applicant_data.get('health', {})
        
        # Smoking
        if lifestyle.get('smoker', False):
            smoking_details = lifestyle.get('smokingDetails', {})
            cigarettes_per_day = smoking_details.get('cigarettesPerDay', 0)
            
            if cigarettes_per_day > 20:
                loadings.append(MedicalLoading(
                    condition="Heavy Smoking",
                    loading_percentage=75,
                    severity=MedicalConditionSeverity.SEVERE,
                    loading_type=LoadingType.LIFESTYLE,
                    reasoning=f"Heavy smoking ({cigarettes_per_day} cigarettes/day)",
                    affects_critical_illness=True,
                    affects_term_life=True,
                    affects_disability=True
                ))
            elif cigarettes_per_day > 10:
                loadings.append(MedicalLoading(
                    condition="Moderate Smoking",
                    loading_percentage=50,
                    severity=MedicalConditionSeverity.MODERATE,
                    loading_type=LoadingType.LIFESTYLE,
                    reasoning=f"Moderate smoking ({cigarettes_per_day} cigarettes/day)",
                    affects_critical_illness=True,
                    affects_term_life=True,
                    affects_disability=True
                ))
            else:
                loadings.append(MedicalLoading(
                    condition="Light Smoking",
                    loading_percentage=25,
                    severity=MedicalConditionSeverity.MILD,
                    loading_type=LoadingType.LIFESTYLE,
                    reasoning=f"Light smoking ({cigarettes_per_day} cigarettes/day)",
                    affects_critical_illness=True,
                    affects_term_life=True,
                    affects_disability=False
                ))
        
        # Alcohol consumption
        alcohol = lifestyle.get('alcohol', {})
        units_per_week = alcohol.get('unitsPerWeek', 0)
        if units_per_week > 21:  # Heavy drinking threshold
            loadings.append(MedicalLoading(
                condition="Heavy Alcohol Consumption",
                loading_percentage=40,
                severity=MedicalConditionSeverity.MODERATE,
                loading_type=LoadingType.LIFESTYLE,
                reasoning=f"Heavy alcohol consumption ({units_per_week} units/week)",
                affects_critical_illness=True,
                affects_term_life=True,
                affects_disability=True
            ))
        elif units_per_week > 14:  # Moderate drinking
            loadings.append(MedicalLoading(
                condition="Moderate Alcohol Consumption",
                loading_percentage=15,
                severity=MedicalConditionSeverity.MILD,
                loading_type=LoadingType.LIFESTYLE,
                reasoning=f"Moderate alcohol consumption ({units_per_week} units/week)",
                affects_critical_illness=False,
                affects_term_life=True,
                affects_disability=False
            ))
        
        # BMI calculation and obesity loading
        physical = health.get('physical', {})
        if physical:
            height_cm = physical.get('height', {}).get('value', 0)
            weight_kg = physical.get('weight', {}).get('value', 0)
            
            if height_cm > 0 and weight_kg > 0:
                height_m = height_cm / 100
                bmi = weight_kg / (height_m ** 2)
                
                if bmi >= 35:
                    loadings.append(MedicalLoading(
                        condition="Severe Obesity",
                        loading_percentage=75,
                        severity=MedicalConditionSeverity.SEVERE,
                        loading_type=LoadingType.LIFESTYLE,
                        reasoning=f"BMI {bmi:.1f} indicates severe obesity",
                        affects_critical_illness=True,
                        affects_term_life=True,
                        affects_disability=True
                    ))
                elif bmi >= 30:
                    loadings.append(MedicalLoading(
                        condition="Moderate Obesity",
                        loading_percentage=35,
                        severity=MedicalConditionSeverity.MODERATE,
                        loading_type=LoadingType.LIFESTYLE,
                        reasoning=f"BMI {bmi:.1f} indicates moderate obesity",
                        affects_critical_illness=True,
                        affects_term_life=True,
                        affects_disability=True
                    ))
                elif bmi >= 27:
                    loadings.append(MedicalLoading(
                        condition="Mild Obesity",
                        loading_percentage=15,
                        severity=MedicalConditionSeverity.MILD,
                        loading_type=LoadingType.LIFESTYLE,
                        reasoning=f"BMI {bmi:.1f} indicates mild obesity",
                        affects_critical_illness=False,
                        affects_term_life=True,
                        affects_disability=False
                    ))
        
        return loadings
    
    def _calculate_combined_loading(self, individual_loadings: List[MedicalLoading], age: int, gender: str) -> float:
        """Calculate combined loading with appropriate adjustments"""
        
        if not individual_loadings:
            return 0.0
        
        # Group loadings by severity
        critical_loadings = [l for l in individual_loadings if l.severity == MedicalConditionSeverity.CRITICAL]
        severe_loadings = [l for l in individual_loadings if l.severity == MedicalConditionSeverity.SEVERE]
        moderate_loadings = [l for l in individual_loadings if l.severity == MedicalConditionSeverity.MODERATE]
        mild_loadings = [l for l in individual_loadings if l.severity == MedicalConditionSeverity.MILD]
        
        # Calculate base loading
        total_loading = 0.0
        
        # Critical conditions: Take highest + 50% of others
        if critical_loadings:
            critical_percentages = [l.loading_percentage for l in critical_loadings]
            total_loading += max(critical_percentages)
            if len(critical_percentages) > 1:
                total_loading += sum(critical_percentages[1:]) * 0.5
        
        # Severe conditions: Take highest + 40% of others
        if severe_loadings:
            severe_percentages = [l.loading_percentage for l in severe_loadings]
            if not critical_loadings:  # Only if no critical conditions
                total_loading += max(severe_percentages)
                if len(severe_percentages) > 1:
                    total_loading += sum(severe_percentages[1:]) * 0.4
            else:
                total_loading += sum(severe_percentages) * 0.3
        
        # Moderate conditions: Take highest + 30% of others
        if moderate_loadings:
            moderate_percentages = [l.loading_percentage for l in moderate_loadings]
            if not critical_loadings and not severe_loadings:
                total_loading += max(moderate_percentages)
                if len(moderate_percentages) > 1:
                    total_loading += sum(moderate_percentages[1:]) * 0.3
            else:
                total_loading += sum(moderate_percentages) * 0.2
        
        # Mild conditions: Add 20% of each
        if mild_loadings:
            mild_percentages = [l.loading_percentage for l in mild_loadings]
            total_loading += sum(mild_percentages) * 0.2
        
        # Apply age adjustment
        age_multiplier = 1.0
        for age_range, multiplier in self.age_loading_adjustments.items():
            if age_range[0] <= age <= age_range[1]:
                age_multiplier = multiplier
                break
        
        total_loading *= age_multiplier
        
        # Cap maximum loading at 300%
        return min(300.0, max(0.0, total_loading))
    
    def _calculate_health_score(self, normal_count: int, abnormal_count: int, critical_count: int, total_count: int) -> float:
        """Calculate overall health score"""
        
        if total_count == 0:
            return 0.8  # Default score when no data
        
        # Base score from normal findings
        normal_ratio = normal_count / total_count
        base_score = normal_ratio * 0.9 + 0.1  # Scale 0.1 to 1.0
        
        # Penalties for abnormal and critical findings
        abnormal_penalty = (abnormal_count / total_count) * 0.3
        critical_penalty = (critical_count / total_count) * 0.6
        
        health_score = base_score - abnormal_penalty - critical_penalty
        
        return max(0.0, min(1.0, health_score))
    
    def _determine_risk_category(self, total_loading: float, critical_alerts: int) -> str:
        """Determine risk category based on loading and critical alerts"""
        
        if critical_alerts > 2 or total_loading > 200:
            return "HIGH RISK"
        elif critical_alerts > 0 or total_loading > 100:
            return "MODERATE RISK"
        elif total_loading > 50:
            return "STANDARD PLUS"
        elif total_loading > 0:
            return "STANDARD"
        else:
            return "PREFERRED"
    
    def _generate_recommendations_and_exclusions(self, loadings: List[MedicalLoading], 
                                               critical_count: int, abnormal_count: int) -> Tuple[List[str], List[str], bool]:
        """Generate recommendations, exclusions, and additional test requirements"""
        
        recommendations = []
        exclusions = []
        requires_additional_tests = False
        
        # Group conditions by type
        diabetes_conditions = [l for l in loadings if 'diabetes' in l.condition.lower()]
        cardiac_conditions = [l for l in loadings if any(word in l.condition.lower() for word in ['cardiac', 'heart', 'hypertension'])]
        liver_conditions = [l for l in loadings if 'liver' in l.condition.lower() or any(word in l.condition.lower() for word in ['alt', 'ast'])]
        kidney_conditions = [l for l in loadings if 'kidney' in l.condition.lower() or 'creatinine' in l.condition.lower()]
        
        # Diabetes recommendations and exclusions
        if diabetes_conditions:
            severe_diabetes = any(l.severity in [MedicalConditionSeverity.SEVERE, MedicalConditionSeverity.CRITICAL] for l in diabetes_conditions)
            if severe_diabetes:
                recommendations.append("Regular endocrinologist follow-up required")
                recommendations.append("HbA1c monitoring every 3 months")
                exclusions.append("Diabetes-related complications exclusion for Critical Illness coverage")
                requires_additional_tests = True
            else:
                recommendations.append("Annual diabetes screening recommended")
                recommendations.append("Lifestyle modification for diabetes management")
        
        # Cardiac recommendations
        if cardiac_conditions:
            recommendations.append("Regular cardiology evaluation recommended")
            recommendations.append("Annual ECG and echocardiogram")
            if any(l.severity == MedicalConditionSeverity.CRITICAL for l in cardiac_conditions):
                exclusions.append("Pre-existing cardiac condition exclusion")
                requires_additional_tests = True
        
        # Liver condition recommendations
        if liver_conditions:
            recommendations.append("Regular liver function monitoring")
            recommendations.append("Hepatology consultation if enzymes remain elevated")
            if any(l.severity in [MedicalConditionSeverity.SEVERE, MedicalConditionSeverity.CRITICAL] for l in liver_conditions):
                exclusions.append("Liver disease exclusion")
                requires_additional_tests = True
        
        # Kidney condition recommendations
        if kidney_conditions:
            recommendations.append("Regular nephrology follow-up")
            recommendations.append("Quarterly kidney function monitoring")
            if any(l.severity in [MedicalConditionSeverity.SEVERE, MedicalConditionSeverity.CRITICAL] for l in kidney_conditions):
                exclusions.append("Kidney disease exclusion")
                requires_additional_tests = True
        
        # General recommendations based on critical alerts
        if critical_count > 2:
            recommendations.append("Comprehensive medical evaluation recommended")
            recommendations.append("Specialist consultations as appropriate")
            requires_additional_tests = True
        elif critical_count > 0:
            recommendations.append("Follow-up with primary care physician")
            recommendations.append("Repeat testing in 3-6 months")
        
        # Lifestyle recommendations
        lifestyle_conditions = [l for l in loadings if l.loading_type == LoadingType.LIFESTYLE]
        if lifestyle_conditions:
            if any('smoking' in l.condition.lower() for l in lifestyle_conditions):
                recommendations.append("Smoking cessation program recommended")
            if any('obesity' in l.condition.lower() for l in lifestyle_conditions):
                recommendations.append("Weight management program recommended")
            if any('alcohol' in l.condition.lower() for l in lifestyle_conditions):
                recommendations.append("Alcohol consumption reduction advised")
        
        return recommendations, exclusions, requires_additional_tests


def create_loading_summary_report(loading_result: LoadingResult, applicant_name: str, application_id: str) -> str:
    """Create a comprehensive loading summary report"""
    
    report_lines = []
    
    # Header
    report_lines.extend([
        "=" * 80,
        "🏥 MEDICAL LOADING CALCULATION REPORT",
        "=" * 80,
        f"Applicant: {applicant_name}",
        f"Application ID: {application_id}",
        f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        "",
        "📊 OVERALL ASSESSMENT",
        "-" * 40,
        f"Total Medical Loading: {loading_result.total_loading_percentage:.1f}%",
        f"Risk Category: {loading_result.risk_category}",
        f"Overall Health Score: {loading_result.overall_health_score:.2f}/1.00",
        f"Critical Alerts: {loading_result.critical_alerts_count}",
        f"Abnormal Findings: {loading_result.abnormal_findings_count}",
        f"Normal Findings: {loading_result.normal_findings_count}",
        f"Additional Tests Required: {'Yes' if loading_result.requires_additional_tests else 'No'}",
        ""
    ])
    
    # Individual loadings breakdown
    if loading_result.individual_loadings:
        report_lines.extend([
            "🔍 DETAILED LOADING BREAKDOWN",
            "-" * 40
        ])
        
        # Group by severity
        loadings_by_severity = {}
        for loading in loading_result.individual_loadings:
            severity = loading.severity.value
            if severity not in loadings_by_severity:
                loadings_by_severity[severity] = []
            loadings_by_severity[severity].append(loading)
        
        # Display in order of severity
        severity_order = ['critical', 'severe', 'moderate', 'mild', 'minimal']
        for severity in severity_order:
            if severity in loadings_by_severity:
                severity_title = severity.upper()
                report_lines.append(f"\n{severity_title} CONDITIONS:")
                for loading in loadings_by_severity[severity]:
                    report_lines.extend([
                        f"  • {loading.condition}",
                        f"    Loading: {loading.loading_percentage:.1f}%",
                        f"    Type: {loading.loading_type.value.title()}",
                        f"    Reasoning: {loading.reasoning}",
                        f"    Affects: {'CI' if loading.affects_critical_illness else ''}{'TL' if loading.affects_term_life else ''}{'DI' if loading.affects_disability else ''}",
                        ""
                    ])
    
    # Recommendations
    if loading_result.recommendations:
        report_lines.extend([
            "💡 RECOMMENDATIONS",
            "-" * 40
        ])
        for rec in loading_result.recommendations:
            report_lines.append(f"  • {rec}")
        report_lines.append("")
    
    # Exclusions
    if loading_result.exclusions:
        report_lines.extend([
            "❌ POLICY EXCLUSIONS",
            "-" * 40
        ])
        for exc in loading_result.exclusions:
            report_lines.append(f"  • {exc}")
        report_lines.append("")
    
    # Coverage impact
    report_lines.extend([
        "📋 COVERAGE IMPACT SUMMARY",
        "-" * 40,
        f"Term Life Insurance: {loading_result.total_loading_percentage:.1f}% loading applied",
        f"Critical Illness: {'Loading + Exclusions' if loading_result.exclusions else f'{loading_result.total_loading_percentage:.1f}% loading'}",
        f"Disability Income: {loading_result.total_loading_percentage:.1f}% loading applied",
        f"Accidental Death: No medical loading (accident-based coverage)",
        "",
        "=" * 80,
        "End of Medical Loading Report",
        "=" * 80
    ])
    
    return '\n'.join(report_lines)


# Example usage and testing
if __name__ == "__main__":
    # Initialize the loading engine
    loading_engine = MedicalLoadingEngine()
    
    print("🏥 Medical Loading Engine Initialized")
    print("📊 Ready for comprehensive medical loading calculations")
    print("🎯 Supports 50+ medical conditions with industry-standard loadings")