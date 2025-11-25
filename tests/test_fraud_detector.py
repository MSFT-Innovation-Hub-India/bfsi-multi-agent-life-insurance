#!/usr/bin/env python3
"""
Test script to verify the fraud detector works with the improved medical data
"""

import json
from fraud_detector import ComprehensiveFraudDetector

def test_fraud_detector():
    """Test fraud detector with improved medical data"""
    
    print("🔍 Testing Fraud Detector with Improved Medical Data")
    print("=" * 60)
    
    # Load the improved medical data
    try:
        with open('structured_medical_data_improved_20251001_123916.json', 'r') as f:
            medical_data = json.load(f)
        print("✅ Loaded improved medical data")
    except FileNotFoundError:
        print("❌ Improved medical data file not found")
        return False
    
    # Load applicant data
    try:
        with open('person_details.json', 'r') as f:
            applicant_data = json.load(f)
        print("✅ Loaded applicant data")
    except FileNotFoundError:
        print("❌ Applicant data file not found")
        return False
    
    # Initialize fraud detector
    fraud_detector = ComprehensiveFraudDetector()
    
    # Test fraud analysis
    try:
        print("\n🔍 Running comprehensive fraud analysis...")
        fraud_assessment = fraud_detector.comprehensive_fraud_analysis(applicant_data, medical_data)
        
        print("✅ Fraud analysis completed successfully!")
        
        # Display results
        print(f"\n📊 FRAUD ANALYSIS RESULTS:")
        print("=" * 40)
        print(f"Overall Fraud Risk: {fraud_assessment.overall_fraud_risk}")
        print(f"Fraud Score: {fraud_assessment.fraud_score:.3f}")
        print(f"Confidence Level: {fraud_assessment.confidence_level:.3f}")
        print(f"Total Indicators: {len(fraud_assessment.indicators)}")
        
        if fraud_assessment.indicators:
            print(f"\n🚨 FRAUD INDICATORS:")
            for indicator in fraud_assessment.indicators[:5]:  # Show first 5
                print(f"  • {indicator.severity}: {indicator.description}")
        
        if fraud_assessment.verification_required:
            print(f"\n✅ VERIFICATION REQUIRED:")
            for req in fraud_assessment.verification_required:
                print(f"  • {req}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error in fraud analysis: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_fraud_detector()
    if success:
        print("\n🎉 Fraud detector test completed successfully!")
    else:
        print("\n❌ Fraud detector test failed!")