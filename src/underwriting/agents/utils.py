"""
Utility Functions Module
========================

Common utility functions used across the underwriting system.
"""

from typing import List, Any, Dict


class UnderwritingUtils:
    """Utility functions for underwriting operations"""
    
    @staticmethod
    def safe_join(items: List, separator: str = ', ') -> str:
        """
        Safely join list items, converting to strings if needed
        
        Args:
            items: List of items to join
            separator: String to use between items
            
        Returns:
            Joined string or "None" if empty
        """
        if not items:
            return "None"
        
        try:
            str_items = [str(item) for item in items if item is not None]
            return separator.join(str_items) if str_items else "None"
        except Exception:
            return "Data not available"
    
    @staticmethod
    def calculate_bmi(applicant_data: Dict[str, Any]) -> str:
        """
        Calculate BMI from height and weight
        
        Args:
            applicant_data: Applicant information dictionary
            
        Returns:
            BMI string with category (e.g., "24.5 (Normal)")
        """
        try:
            physical = applicant_data.get('health', {}).get('physical', {})
            height_cm = physical.get('height', {}).get('value', 0)
            weight_kg = physical.get('weight', {}).get('value', 0)
            
            if height_cm > 0 and weight_kg > 0:
                height_m = height_cm / 100
                bmi = round(weight_kg / (height_m ** 2), 1)
                
                # Determine category
                if bmi < 18.5:
                    category = "Underweight"
                elif bmi < 25:
                    category = "Normal"
                elif bmi < 30:
                    category = "Overweight"
                else:
                    category = "Obese"
                
                return f"{bmi} ({category})"
            else:
                return "Unknown (height/weight missing)"
        except Exception:
            return "Unknown (calculation error)"
    
    @staticmethod
    def format_coverage_details(covers_requested: List[Dict]) -> str:
        """
        Format coverage details into readable string
        
        Args:
            covers_requested: List of coverage dictionaries
            
        Returns:
            Formatted string with coverage details
        """
        if not covers_requested:
            return "- No coverage details available"
        
        coverage_lines = []
        for cover in covers_requested:
            cover_type = cover.get('coverType', 'Unknown')
            sum_assured = cover.get('sumAssured', 0)
            term = cover.get('term', 'Unknown')
            coverage_lines.append(f"- {cover_type}: ₹{sum_assured:,} for {term} years")
        
        return '\n'.join(coverage_lines)
    
    @staticmethod
    def calculate_confidence_score(final_decision, risk_assessment, medical_findings) -> float:
        """
        Calculate confidence score for underwriting decision
        
        Args:
            final_decision: UnderwritingDecision enum
            risk_assessment: RiskAssessment object
            medical_findings: MedicalFindings object
            
        Returns:
            Confidence score between 0.5 and 1.0
        """
        from underwriting.engines.underwriter import UnderwritingDecision
        
        base_confidence = 0.85
        
        # Adjust based on decision type
        decision_confidence = {
            UnderwritingDecision.AUTO_APPROVED: 0.95,
            UnderwritingDecision.MANUAL_REVIEW: 0.80,
            UnderwritingDecision.ADDITIONAL_REQUIREMENTS: 0.70,
            UnderwritingDecision.DECLINED: 0.90
        }
        base_confidence = decision_confidence.get(final_decision, 0.85)
        
        # Adjust based on medical findings
        if len(medical_findings.critical_alerts) > 0:
            base_confidence += 0.05
        elif len(medical_findings.abnormal_values) == 0:
            base_confidence += 0.05
        elif len(medical_findings.abnormal_values) > 3:
            base_confidence -= 0.10
        
        # Adjust based on risk score consistency
        if risk_assessment.risk_score > 0.8 and final_decision == UnderwritingDecision.AUTO_APPROVED:
            base_confidence += 0.05
        elif risk_assessment.risk_score < 0.3 and final_decision == UnderwritingDecision.DECLINED:
            base_confidence += 0.05
        
        return min(1.0, max(0.5, base_confidence))
    
    @staticmethod
    def generate_conditions(risk_assessment) -> List[str]:
        """
        Generate policy conditions based on risk assessment
        
        Args:
            risk_assessment: RiskAssessment object
            
        Returns:
            List of policy conditions
        """
        conditions = []
        
        if risk_assessment.medical_risk > 0.3:
            conditions.append("Annual medical check-up required")
        
        if risk_assessment.lifestyle_risk > 0.2:
            conditions.append("Lifestyle modification counseling recommended")
        
        if risk_assessment.red_flags:
            conditions.append("Additional medical examinations may be required during policy term")
        
        return conditions
    
    @staticmethod
    def generate_exclusions(medical_findings) -> List[str]:
        """
        Generate policy exclusions based on medical findings
        
        Args:
            medical_findings: MedicalFindings object
            
        Returns:
            List of policy exclusions
        """
        exclusions = ["Standard suicide clause", "War and terrorism exclusion"]
        
        if medical_findings.critical_alerts:
            for alert in medical_findings.critical_alerts:
                if "cardiac" in alert.lower() or "heart" in alert.lower():
                    exclusions.append("Pre-existing cardiac conditions exclusion for 4 years")
                if "diabetes" in alert.lower():
                    exclusions.append("Diabetes-related complications exclusion for 2 years")
        
        return exclusions
