#!/usr/bin/env python3
"""
Test script to re-extract all medical images using the improved general approach
"""

from structured_medical_analyzer import StructuredMedicalExtractor
import json
from datetime import datetime

def test_all_images():
    """Test extraction on all images in the reports directory"""
    
    print("🎯 Testing Improved Medical Data Extraction")
    print("=" * 60)
    
    # Initialize extractor
    extractor = StructuredMedicalExtractor()
    
    # Process all images
    result = extractor.process_all_images("reports")
    
    if result:
        print(f"\n✅ Extraction completed!")
        print(f"📊 Total files: {result['extraction_metadata']['total_files']}")
        print(f"✅ Successful: {result['extraction_metadata']['successful_extractions']}")
        print(f"❌ Failed: {result['extraction_metadata']['failed_extractions']}")
        
        # Save the new results
        output_filename = f"structured_medical_data_improved_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(output_filename, 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        
        print(f"💾 Results saved to: {output_filename}")
        
        # Show summary of extracted data
        print(f"\n📋 EXTRACTION SUMMARY:")
        print("=" * 40)
        
        for item in result['medical_data']:
            if item['extraction_successful']:
                image_name = item['image_name']
                structured = item.get('structured_data', {})
                doc_type = structured.get('documentInfo', {}).get('type', 'Unknown')
                lab_results = structured.get('labResults', {})
                
                print(f"\n📄 {image_name}")
                print(f"   Type: {doc_type}")
                
                # Count extracted values
                total_values = 0
                for category, tests in lab_results.items():
                    if isinstance(tests, dict):
                        for test_name, test_data in tests.items():
                            if isinstance(test_data, dict) and test_data.get('value') not in [None, '', 'null']:
                                total_values += 1
                
                print(f"   Values extracted: {total_values}")
                
                # Show a few key values
                shown_count = 0
                for category, tests in lab_results.items():
                    if isinstance(tests, dict) and shown_count < 3:
                        for test_name, test_data in tests.items():
                            if isinstance(test_data, dict) and test_data.get('value') not in [None, '', 'null'] and shown_count < 3:
                                value = test_data.get('value')
                                unit = test_data.get('unit', '')
                                print(f"   • {test_name}: {value} {unit}")
                                shown_count += 1
            else:
                print(f"\n❌ {item['image_name']}: Failed extraction")
        
        # Check if albumin.png now has proper values
        albumin_data = None
        for item in result['medical_data']:
            if item['image_name'] == 'albumin.png' and item['extraction_successful']:
                albumin_data = item.get('structured_data', {})
                break
        
        if albumin_data:
            print(f"\n🎯 ALBUMIN.PNG SPECIFIC RESULTS:")
            print("=" * 40)
            lab_results = albumin_data.get('labResults', {})
            for category, tests in lab_results.items():
                print(f"\n{category}:")
                if isinstance(tests, dict):
                    for test_name, test_data in tests.items():
                        if isinstance(test_data, dict):
                            value = test_data.get('value', 'N/A')
                            unit = test_data.get('unit', '')
                            ref_range = test_data.get('referenceRange', '')
                            print(f"  • {test_name}: {value} {unit} (Ref: {ref_range})")
        
        return result
    else:
        print("❌ Extraction failed!")
        return None

if __name__ == "__main__":
    result = test_all_images()