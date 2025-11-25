"""
AI-Powered Life Insurance Underwriting System
==============================================

Main entry point to run the complete underwriting system.

Usage:
    python run.py

This will process the sample application in data/sample/person_details.json
with medical reports from the tinsurance/ directory.
"""

import asyncio
import sys
from pathlib import Path

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent / 'src'))

from underwriting.core.main_system import InsuranceUnderwritingSystem


async def main():
    """Main function to run the underwriting system"""
    
    print("🎯 AI-Powered Term Insurance Underwriting System")
    print("=" * 70)
    print("Starting complete application processing...")
    print()
    
    # Initialize system
    system = InsuranceUnderwritingSystem()
    
    # Process sample application
    result = await system.process_complete_application(
        applicant_data_file='data/sample/person_details.json',
        medical_images_directory='data/medical_images'
    )
    
    if result and not result.get('processing_failed'):
        print("\n✅ Application processing completed successfully!")
        print(f"📊 Decision: {result['underwriting_decision']['final_decision']}")
        print(f"🎯 Confidence: {result['underwriting_decision']['confidence_score']:.1%}")
        
        if 'premium_analysis' in result:
            print(f"💰 Total Premium: ₹{result['premium_analysis']['total_final_premium']:,.0f}")
    else:
        print("\n❌ Application processing failed!")
        if result and result.get('error'):
            print(f"Error: {result['error']}")
    
    return result


if __name__ == "__main__":
    # Run the complete system
    result = asyncio.run(main())
