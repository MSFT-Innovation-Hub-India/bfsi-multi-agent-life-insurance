"""
AI-Powered Life Insurance Underwriting System - Modular Version
===============================================================

Main entry point using the modular orchestrator_v2 architecture.

Usage:
    python run_v2.py

This will process the sample application using the new modular system
with agent_configs, parsers, premium_calculator, and utils modules.
"""

import asyncio
import sys
from pathlib import Path

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent / 'src'))

from underwriting.core.main_system_v2 import InsuranceUnderwritingSystemV2


async def main():
    """Main function to run the modular underwriting system"""
    
    print("🎯 AI-Powered Term Insurance Underwriting System (Modular V2)")
    print("=" * 70)
    print("Starting complete application processing with modular architecture...")
    print()
    
    # Initialize modular system
    system = InsuranceUnderwritingSystemV2()
    
    # Process sample application
    result = await system.process_complete_application(
        applicant_data_file='data/sample/person_details.json',
        medical_images_directory='data/medical_images'
    )
    
    if result and not result.get('processing_failed'):
        print("\n✅ Application processing completed successfully!")
        print(f"📊 Decision: {result['underwriting_decision']['final_decision']}")
        print(f"🎯 Confidence: {result['underwriting_decision']['confidence_score']:.1%}")
        print(f"🏥 Medical Loading: {result['medical_loading_analysis']['total_loading_percentage']:.1f}%")
        
        if 'premium_analysis' in result:
            print(f"💰 Total Premium: ₹{result['premium_analysis']['total_final_premium']:,.0f}")
        
        print(f"\n🏗️  Architecture: Modular (orchestrator_v2)")
        print(f"📦 Version: {result['application_metadata']['system_version']}")
    else:
        print("\n❌ Application processing failed!")
        if result and result.get('error'):
            print(f"Error: {result['error']}")
    
    return result


if __name__ == "__main__":
    # Run the complete modular system
    result = asyncio.run(main())
