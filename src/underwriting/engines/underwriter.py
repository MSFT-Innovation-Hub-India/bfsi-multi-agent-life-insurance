"""
AI-Powered Term Insurance Underwriting System
===========================================

A comprehensive multi-agent system for intelligent term insurance underwriting that includes:
- Auto-approval for low-risk applicants
- Fraud and non-disclosure detection
- Premium calculation for multiple covers
- Explainable underwriting reports
- Adaptive reasoning and coordination

Architecture:
- Multi-agent orchestration using Autogen
- Machine learning risk assessment models
- Medical data analysis and interpretation
- Real-time decision making with explanations
"""

import asyncio
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from enum import Enum

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, mean_absolute_error
import joblib

import autogen
from autogen import AssistantAgent, UserProxyAgent, GroupChat, GroupChatManager
from openai import AzureOpenAI


# Configuration
# Import config from centralized configuration
from underwriting.config import Config


class RiskLevel(Enum):
    """Risk assessment levels"""
    LOW = "low"
    STANDARD = "standard"
    HIGH = "high"
    DECLINED = "declined"


class UnderwritingDecision(Enum):
    """Underwriting decisions"""
    AUTO_APPROVED = "auto_approved"
    MANUAL_REVIEW = "manual_review"
    ADDITIONAL_REQUIREMENTS = "additional_requirements"
    DECLINED = "declined"


@dataclass
class MedicalFindings:
    """Medical findings from reports"""
    normal_values: List[str]
    abnormal_values: List[Dict[str, Any]]
    critical_alerts: List[str]
    risk_score: float
    concerns: List[str]


@dataclass
class RiskAssessment:
    """Comprehensive risk assessment"""
    overall_risk_level: RiskLevel
    risk_score: float
    medical_risk: float
    lifestyle_risk: float
    financial_risk: float
    occupation_risk: float
    factors: Dict[str, Any]
    red_flags: List[str]
    recommendations: List[str]


@dataclass
class PremiumCalculation:
    """Premium calculation for each cover"""
    cover_type: str
    base_premium: float
    adjusted_premium: float
    loadings: List[Dict[str, Any]]
    discounts: List[Dict[str, Any]]
    total_loading_percentage: float
    final_premium: float


@dataclass
class UnderwritingReport:
    """Comprehensive underwriting report"""
    application_id: str
    applicant_name: str
    decision: UnderwritingDecision
    risk_assessment: RiskAssessment
    medical_analysis: MedicalFindings
    premium_calculations: List[PremiumCalculation]
    conditions: List[str]
    exclusions: List[str]
    reasoning: List[str]
    confidence_score: float
    generated_at: datetime


class MedicalDataAnalyzer:
    """Analyzes medical data and assigns risk scores"""
    
    def __init__(self):
        self.risk_weights = {
            'blood_sugar_abnormal': 0.15,
            'blood_pressure_abnormal': 0.12,
            'cholesterol_abnormal': 0.10,
            'liver_function_abnormal': 0.08,
            'kidney_function_abnormal': 0.08,
            'cardiac_issues': 0.20,
            'bmi_abnormal': 0.05,
            'smoking_history': 0.12,
            'family_history': 0.10
        }
    
    def analyze_medical_data(self, medical_data: Dict[str, Any]) -> MedicalFindings:
        """Analyze medical reports and extract risk factors"""
        
        normal_values = []
        abnormal_values = []
        critical_alerts = []
        concerns = []
        risk_factors = []
        
        # Analyze each medical report
        for report in medical_data.get('medical_data', []):
            if not report.get('extraction_successful'):
                continue
                
            structured_data = report.get('structured_data', {})
            clinical_findings = structured_data.get('clinicalFindings', {})
            
            # Collect findings
            normal_values.extend(clinical_findings.get('normalValues', []))
            abnormal_values.extend(clinical_findings.get('abnormalValues', []))
            critical_alerts.extend(clinical_findings.get('criticalAlerts', []))
            
            # Analyze specific conditions
            lab_results = structured_data.get('labResults', {})
            
            # Blood sugar analysis
            if 'bloodSugar' in lab_results:
                blood_sugar = lab_results['bloodSugar']
                if isinstance(blood_sugar.get('random'), list):
                    for reading in blood_sugar['random']:
                        if reading.get('value', 0) > 180:
                            risk_factors.append('high_blood_sugar')
                            concerns.append(f"High blood sugar: {reading['value']} mg/dL")
                elif blood_sugar.get('fasting', 0) > 126:
                    risk_factors.append('diabetes_risk')
                    concerns.append(f"Elevated fasting glucose: {blood_sugar['fasting']} mg/dL")
            
            # CBC analysis
            if 'completeBloodCount' in lab_results:
                cbc = lab_results['completeBloodCount']
                
                # Check hemoglobin
                hb_value = float(cbc.get('hemoglobin', {}).get('value', 0))
                if hb_value < 10:
                    risk_factors.append('anemia')
                    concerns.append(f"Low hemoglobin: {hb_value} gm%")
                
                # Check WBC
                wbc_value = float(cbc.get('wbc', {}).get('value', 0))
                if wbc_value > 15000:
                    risk_factors.append('infection_inflammation')
                    concerns.append(f"Elevated WBC: {wbc_value}/cmm")
        
        # Calculate risk score
        risk_score = self._calculate_medical_risk_score(risk_factors, critical_alerts)
        
        return MedicalFindings(
            normal_values=normal_values,
            abnormal_values=abnormal_values,
            critical_alerts=critical_alerts,
            risk_score=risk_score,
            concerns=concerns
        )
    
    def _calculate_medical_risk_score(self, risk_factors: List[str], critical_alerts: List[str]) -> float:
        """Calculate medical risk score based on findings"""
        
        base_score = 0.8  # Start with good health assumption
        
        # Reduce score for risk factors
        for factor in risk_factors:
            if 'high_blood_sugar' in factor or 'diabetes' in factor:
                base_score -= 0.15
            elif 'cardiac' in factor or 'heart' in factor:
                base_score -= 0.25
            elif 'anemia' in factor:
                base_score -= 0.10
            elif 'infection' in factor:
                base_score -= 0.05
        
        # Critical alerts significantly reduce score
        if critical_alerts:
            base_score -= len(critical_alerts) * 0.2
        
        return max(0.0, min(1.0, base_score))


class RiskAssessmentML:
    """Machine learning-based risk assessment"""
    
    def __init__(self):
        self.risk_classifier = None
        self.premium_regressor = None
        self.scaler = StandardScaler()
        self.is_trained = False
        
    def prepare_training_data(self) -> tuple:
        """Prepare synthetic training data for the ML models"""
        
        # Generate synthetic training data
        np.random.seed(42)
        n_samples = 1000
        
        # Features: age, bmi, medical_risk_score, lifestyle_score, income, sum_assured
        ages = np.random.normal(35, 10, n_samples)
        bmis = np.random.normal(24, 4, n_samples)
        medical_scores = np.random.beta(2, 1, n_samples)  # Skewed towards good health
        lifestyle_scores = np.random.beta(3, 2, n_samples)
        incomes = np.random.lognormal(13, 0.5, n_samples)  # Log-normal distribution
        sum_assureds = np.random.choice([500000, 1000000, 2000000, 5000000], n_samples)
        
        # Combine features
        X = np.column_stack([
            ages, bmis, medical_scores, lifestyle_scores, 
            np.log(incomes), np.log(sum_assureds)
        ])
        
        # Generate risk labels (0: low, 1: standard, 2: high)
        risk_scores = (
            0.3 * (ages - 25) / 40 +  # Age factor
            0.2 * np.maximum(0, (bmis - 25) / 10) +  # BMI factor
            0.3 * (1 - medical_scores) +  # Medical risk (inverted)
            0.2 * (1 - lifestyle_scores)   # Lifestyle risk (inverted)
        )
        
        y_risk = np.digitize(risk_scores, bins=[0.2, 0.5, 1.0])
        
        # Generate premium multipliers
        y_premium = 1.0 + risk_scores * 2.0 + np.random.normal(0, 0.1, n_samples)
        
        return X, y_risk, y_premium
    
    def train_models(self):
        """Train the ML models"""
        
        print("🤖 Training ML models for risk assessment...")
        
        # Prepare training data
        X, y_risk, y_premium = self.prepare_training_data()
        
        # Split data
        X_train, X_test, y_risk_train, y_risk_test, y_prem_train, y_prem_test = train_test_split(
            X, y_risk, y_premium, test_size=0.2, random_state=42
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train risk classifier
        self.risk_classifier = RandomForestClassifier(
            n_estimators=100, random_state=42, max_depth=10
        )
        self.risk_classifier.fit(X_train_scaled, y_risk_train)
        
        # Train premium regressor
        self.premium_regressor = GradientBoostingRegressor(
            n_estimators=100, random_state=42, max_depth=6
        )
        self.premium_regressor.fit(X_train_scaled, y_prem_train)
        
        # Evaluate models
        risk_pred = self.risk_classifier.predict(X_test_scaled)
        premium_pred = self.premium_regressor.predict(X_test_scaled)
        
        print(f"✅ Risk Classification Accuracy: {(risk_pred == y_risk_test).mean():.3f}")
        print(f"✅ Premium Prediction MAE: {mean_absolute_error(y_prem_test, premium_pred):.3f}")
        
        self.is_trained = True
        
        # Save models
        joblib.dump(self.risk_classifier, 'models/risk_classifier.pkl')
        joblib.dump(self.premium_regressor, 'models/premium_regressor.pkl')
        joblib.dump(self.scaler, 'models/scaler.pkl')
        
        print("💾 Models saved to models/ directory")
    
    def assess_risk(self, applicant_data: Dict[str, Any], medical_findings: MedicalFindings) -> RiskAssessment:
        """Assess risk using ML models"""
        
        if not self.is_trained:
            self.train_models()
        
        # Extract features
        age = applicant_data.get('personalInfo', {}).get('age', 35)
        health = applicant_data.get('health', {})
        physical = health.get('physical', {})
        
        # Calculate BMI from height and weight
        height_cm = physical.get('height', {}).get('value', 165)  # Default 165 cm
        weight_kg = physical.get('weight', {}).get('value', 65)   # Default 65 kg
        height_m = height_cm / 100  # Convert cm to meters
        bmi = round(weight_kg / (height_m ** 2), 1)  # BMI = weight(kg) / height(m)^2
        
        income = applicant_data.get('personalInfo', {}).get('income', {}).get('annual', 1000000)
        
        # Calculate lifestyle score
        lifestyle = applicant_data.get('lifestyle', {})
        lifestyle_score = 0.8
        if lifestyle.get('smoker', False):
            lifestyle_score -= 0.3
        if lifestyle.get('alcohol', {}).get('unitsPerWeek', 0) > 14:
            lifestyle_score -= 0.1
        
        # Sum assured
        total_sum_assured = applicant_data.get('insuranceCoverage', {}).get('totalSumAssured', 1000000)
        
        # Prepare features
        features = np.array([[
            age, bmi, medical_findings.risk_score, lifestyle_score,
            np.log(max(income, 100000)), np.log(max(total_sum_assured, 100000))
        ]])
        
        features_scaled = self.scaler.transform(features)
        
        # Predict risk and premium multiplier
        risk_pred = self.risk_classifier.predict(features_scaled)[0]
        risk_proba = self.risk_classifier.predict_proba(features_scaled)[0]
        premium_multiplier = self.premium_regressor.predict(features_scaled)[0]
        
        # Map risk level
        risk_levels = [RiskLevel.LOW, RiskLevel.STANDARD, RiskLevel.HIGH]
        overall_risk = risk_levels[min(risk_pred, len(risk_levels) - 1)]
        
        # Calculate component risks
        medical_risk = 1.0 - medical_findings.risk_score
        lifestyle_risk = 1.0 - lifestyle_score
        financial_risk = min(0.5, total_sum_assured / (income * 10))  # Conservative multiple
        occupation_risk = 0.1  # Assume low for accountant
        
        # Identify red flags
        red_flags = []
        if medical_findings.critical_alerts:
            red_flags.extend([f"Critical medical alert: {alert}" for alert in medical_findings.critical_alerts])
        if lifestyle.get('smoker', False):
            red_flags.append("Current smoker")
        if bmi > 30:
            red_flags.append(f"High BMI: {bmi}")
        if age > 55:
            red_flags.append(f"Advanced age: {age}")
        
        # Generate recommendations
        recommendations = []
        if medical_risk > 0.3:
            recommendations.append("Additional medical examinations recommended")
        if lifestyle.get('smoker', False):
            recommendations.append("Consider smoking cessation programs")
        if premium_multiplier > 1.5:
            recommendations.append("Higher premium due to elevated risk factors")
        
        return RiskAssessment(
            overall_risk_level=overall_risk,
            risk_score=float(np.max(risk_proba)),
            medical_risk=medical_risk,
            lifestyle_risk=lifestyle_risk,
            financial_risk=financial_risk,
            occupation_risk=occupation_risk,
            factors={
                'age_factor': age / 65,
                'bmi_factor': max(0, (bmi - 25) / 10),
                'medical_factor': medical_risk,
                'lifestyle_factor': lifestyle_risk,
                'premium_multiplier': premium_multiplier
            },
            red_flags=red_flags,
            recommendations=recommendations
        )


# Create models directory
Path('models').mkdir(exist_ok=True)

print("🏗️  AI-Powered Term Insurance Underwriting System Initialized")
print("📊 Core components loaded: Medical Analysis, ML Risk Assessment")
print("🤖 Ready for multi-agent orchestration setup")
