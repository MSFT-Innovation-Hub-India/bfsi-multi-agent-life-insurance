"""
Quick Start Guide for AI-Powered Term Insurance Underwriting System
================================================================

This script demonstrates how to get started with the system quickly.
"""

import asyncio
import json
import sys
from datetime import datetime
from pathlib import Path

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent / 'src'))

# Import the main system
from underwriting.core.main_system import InsuranceUnderwritingSystem


async def quick_demo():
    """Quick demonstration of the system capabilities"""
    
    print("🎯 AI-Powered Term Insurance Underwriting System - Quick Start")
    print("=" * 70)
    
    # Step 1: Initialize the system
    print("🚀 Initializing system...")
    system = InsuranceUnderwritingSystem()
    
    # Step 2: Check if sample data exists
    import os
    if not os.path.exists('data/sample/person_details.json'):
        print("❌ Sample data not found. Please ensure data/sample/person_details.json exists.")
        return
    
    if not os.path.exists('reports') or not any(f.endswith(('.png', '.jpg', '.jpeg')) for f in os.listdir('reports')):
        print("❌ Medical images not found. Please ensure reports/ directory has medical images.")
        return
    
    # Step 3: Process the application
    print("\n📋 Processing sample application...")
    result = await system.process_complete_application(
        applicant_data_file='data/sample/person_details.json',
        medical_images_directory='reports'
    )
    
    # Step 4: Display key results
    if result and not result.get('processing_failed'):
        print("\n✅ Processing completed successfully!")
        
        # Key metrics
        decision = result['underwriting_decision']['final_decision']
        confidence = result['underwriting_decision']['confidence_score']
        risk_level = result['risk_assessment']['overall_risk_level']
        fraud_risk = result['fraud_assessment']['overall_fraud_risk']
        total_premium = result['premium_analysis']['total_final_premium']
        
        print(f"\n📊 KEY RESULTS:")
        print(f"   Decision: {decision.replace('_', ' ').title()}")
        print(f"   Confidence: {confidence:.1%}")
        print(f"   Risk Level: {risk_level.title()}")
        print(f"   Fraud Risk: {fraud_risk}")
        print(f"   Total Premium: ₹{total_premium:,.0f}")
        
        # Show covers
        print(f"\n💼 COVERAGE BREAKDOWN:")
        for cover in result['premium_analysis']['cover_details']:
            print(f"   {cover['cover_type']}: ₹{cover['final_premium']:,.0f} ({cover['loading_percentage']:.0f}% loading)")
        
        # Show any concerns
        if result['fraud_assessment']['key_concerns']:
            print(f"\n⚠️  KEY CONCERNS:")
            for concern in result['fraud_assessment']['key_concerns']:
                print(f"   - {concern}")
        
        print(f"\n⏱️  Processing completed in {result['application_metadata']['processing_time_seconds']:.1f} seconds")
        
    else:
        print("❌ Processing failed!")
    
    return result


def test_individual_components():
    """Test individual system components"""
    
    print("\n🧪 Testing Individual Components")
    print("=" * 40)
    
    # Test 1: Medical Data Extraction
    print("🏥 Testing medical data extraction...")
    try:
        from underwriting.analyzers.medical_extractor import StructuredMedicalExtractor
        extractor = StructuredMedicalExtractor()
        
        # Test with one image
        import os
        if os.path.exists('reports'):
            images = [f for f in os.listdir('reports') if f.endswith('.png')]
            if images:
                test_image = os.path.join('reports', images[0])
                result = extractor.extract_structured_data(test_image)
                print(f"   ✅ Medical extraction test passed for {images[0]}")
            else:
                print("   ⚠️  No PNG images found for testing")
        else:
            print("   ⚠️  reports directory not found")
    except Exception as e:
        print(f"   ❌ Medical extraction test failed: {e}")
    
    # Test 2: Fraud Detection
    print("\n🔍 Testing fraud detection...")
    try:
        from underwriting.analyzers.fraud_detector import ComprehensiveFraudDetector
        
        with open('data/sample/person_details.json', 'r') as f:
            applicant_data = json.load(f)
        
        # Create minimal medical data for testing
        test_medical_data = {
            'medical_data': [{
                'extraction_successful': True,
                'structured_data': {
                    'documentInfo': {'date': '27/11/2023', 'facility': 'Test Lab'},
                    'patientInfo': {'name': 'Test Patient', 'age': '34'},
                    'clinicalFindings': {'normalValues': ['test'], 'abnormalValues': [], 'criticalAlerts': []}
                }
            }]
        }
        
        detector = ComprehensiveFraudDetector()
        assessment = detector.comprehensive_fraud_analysis(applicant_data, test_medical_data)
        print(f"   ✅ Fraud detection test passed - Risk: {assessment.overall_fraud_risk}")
    except Exception as e:
        print(f"   ❌ Fraud detection test failed: {e}")
    
    # Test 3: ML Risk Assessment
    print("\n📊 Testing ML risk assessment...")
    try:
        from underwriting.engines.underwriter import RiskAssessmentML, MedicalDataAnalyzer, MedicalFindings
        
        risk_assessor = RiskAssessmentML()
        
        # Create test medical findings
        test_findings = MedicalFindings(
            normal_values=['test'],
            abnormal_values=[],
            critical_alerts=[],
            risk_score=0.8,
            concerns=[]
        )
        
        with open('data/sample/person_details.json', 'r') as f:
            applicant_data = json.load(f)
        
        assessment = risk_assessor.assess_risk(applicant_data, test_findings)
        print(f"   ✅ ML risk assessment test passed - Risk: {assessment.overall_risk_level.value}")
    except Exception as e:
        print(f"   ❌ ML risk assessment test failed: {e}")


def show_system_info():
    """Show system information and requirements"""
    
    print("\n📋 SYSTEM INFORMATION")
    print("=" * 30)
    
    # Check Python version
    import sys
    print(f"Python Version: {sys.version}")
    
    # Check key dependencies
    dependencies = [
        'openai', 'autogen-agentchat', 'scikit-learn', 
        'pandas', 'numpy', 'pydantic'
    ]
    
    print("\n📦 Key Dependencies:")
    for dep in dependencies:
        try:
            __import__(dep.replace('-', '_'))
            print(f"   ✅ {dep}")
        except ImportError:
            print(f"   ❌ {dep} (not installed)")
    
    # Check data files
    print("\n📄 Data Files:")
    import os
    
    required_files = ['data/sample/person_details.json', 'requirements.txt']
    for file in required_files:
        if os.path.exists(file):
            print(f"   ✅ {file}")
        else:
            print(f"   ❌ {file} (missing)")
    
    # Check directories
    if os.path.exists('reports'):
        image_count = len([f for f in os.listdir('reports') if f.endswith(('.png', '.jpg', '.jpeg'))])
        print(f"   ✅ reports/ ({image_count} medical images)")
    else:
        print(f"   ❌ reports/ (missing)")


async def main():
    """Main function"""
    
    # Show system info
    show_system_info()
    
    # Test individual components
    test_individual_components()
    
    # Run quick demo
    print("\n" + "=" * 70)
    result = await quick_demo()
    
    print("\n🎯 NEXT STEPS:")
    print("=" * 15)
    print("1. Check the generated report in the reports/ directory")
    print("2. Review the comprehensive analysis and decision reasoning")
    print("3. Customize thresholds and rules in Config class")
    print("4. Add your own applicant data and medical images")
    print("5. Integrate with your existing insurance systems")
    
    print("\n📚 For detailed documentation, see README.md")
    print("🔧 For customization, check the configuration options in each module")


if __name__ == "__main__":
    asyncio.run(main())