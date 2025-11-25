#!/usr/bin/env python3
"""
Structured Medical Data Extractor
Extracts medical data from images and returns structured JSON format
"""

import os
import base64
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List
from openai import AzureOpenAI
from underwriting.config import Config

# Initialize Azure OpenAI client from config
client = AzureOpenAI(
    api_version=Config.AZURE_OPENAI_VERSION,
    azure_endpoint=Config.AZURE_OPENAI_ENDPOINT,
    api_key=Config.AZURE_OPENAI_KEY,
)

class StructuredMedicalExtractor:
    """Extract structured medical data from images in JSON format"""
    
    def __init__(self):
        self.supported_formats = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif'}
    
    def encode_image(self, image_path: str) -> str:
        """Encode image to base64 string"""
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8')
    
    def validate_image(self, image_path: str) -> bool:
        """Validate if the image file exists and is supported"""
        if not os.path.exists(image_path):
            print(f"❌ Error: Image file not found: {image_path}")
            return False
        
        file_ext = os.path.splitext(image_path)[1].lower()
        if file_ext not in self.supported_formats:
            print(f"❌ Error: Unsupported file format: {file_ext}")
            return False
        
        return True
    
    # Removed document type identification - using general extraction approach
    

    
    def extract_structured_data(self, image_path: str) -> Dict[str, Any]:
        """Extract structured medical data from image using general AI extraction"""
        image_name = os.path.basename(image_path)
        print(f"🔍 Extracting structured data from: {image_name}")
        
        try:
            # Encode image to base64
            base64_image = self.encode_image(image_path)
            
            # General extraction prompt that can handle any medical document
            extraction_prompt = """
            You are an expert medical data extraction system. Analyze this medical report image and extract ALL visible medical data.
            
            Return ONLY a valid JSON object with the following structure:
            
            {
                "documentInfo": {
                    "type": "identify the type of medical report (e.g., CBC, Liver Function, Lipid Profile, etc.)",
                    "date": "test date if visible",
                    "labNumber": "lab/reference number if visible",
                    "facility": "hospital/lab name if visible"
                },
                "patientInfo": {
                    "name": "patient name if visible",
                    "age": "age if visible", 
                    "gender": "gender if visible",
                    "id": "patient ID if visible"
                },
                "labResults": {
                    "category_name": {
                        "test_name": {
                            "value": "actual numerical value or result",
                            "unit": "unit of measurement",
                            "referenceRange": "normal reference range if visible"
                        }
                    }
                },
                "clinicalFindings": {
                    "normalValues": ["list of tests with normal results"],
                    "abnormalValues": ["list of tests with abnormal results with values"],
                    "criticalAlerts": ["list of critical/high-risk findings if any"]
                }
            }
            
            CRITICAL EXTRACTION RULES:
            1. Extract EVERY visible test name, value, unit, and reference range
            2. Use descriptive category names based on what you see (e.g., "completeBloodCount", "liverFunction", "lipidProfile", "kidneyFunction", etc.)
            3. Include ALL numerical values, even if they seem minor
            4. Preserve exact values and units as shown in the image
            5. If a test shows "Present", "Negative", "Positive", etc., use that exact text as the value
            6. Group related tests under appropriate category names
            7. Return ONLY valid JSON - no markdown, explanations, or extra text
            8. Never use null for values that are clearly visible in the image
            9. Extract ratios, calculated values, and derived parameters if present
            10. Include any additional findings, interpretations, or remarks visible in the report
            """
            
            # Call Azure OpenAI Vision API with enhanced system prompt
            response = client.chat.completions.create(
                model=Config.DEPLOYMENT_NAME,
                messages=[
                    {
                        "role": "system",
                        "content": """You are an expert medical data extraction AI with deep knowledge of medical terminology, laboratory tests, and clinical values. 
                        Your task is to meticulously extract ALL visible medical data from any medical report image with 100% accuracy.
                        You excel at reading medical reports, lab results, diagnostic tests, and clinical documents.
                        Always extract complete numerical values, units, reference ranges, and any textual results.
                        Return only perfectly formatted JSON with no additional text or explanations."""
                    },
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": extraction_prompt
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=4096,
                temperature=0.0,  # Zero temperature for maximum precision
                top_p=0.95
            )
            
            # Get the structured result
            raw_response = response.choices[0].message.content.strip()
            
            # Clean the response to ensure it's valid JSON
            if raw_response.startswith('```json'):
                raw_response = raw_response.replace('```json', '').replace('```', '').strip()
            elif raw_response.startswith('```'):
                raw_response = raw_response.replace('```', '').strip()
            
            try:
                structured_data = json.loads(raw_response)
                print(f"✅ Successfully extracted structured data")
                return {
                    "image_path": image_path,
                    "image_name": image_name,
                    "extraction_timestamp": datetime.now().isoformat(),
                    "extraction_successful": True,
                    "structured_data": structured_data
                }
            except json.JSONDecodeError as e:
                print(f"❌ JSON parsing error: {str(e)}")
                return {
                    "image_path": image_path,
                    "image_name": image_name,
                    "extraction_timestamp": datetime.now().isoformat(),
                    "extraction_successful": False,
                    "error": f"JSON parsing error: {str(e)}",
                    "raw_response": raw_response
                }
            
        except Exception as e:
            print(f"❌ Error extracting data: {str(e)}")
            return {
                "image_path": image_path,
                "image_name": image_name,
                "extraction_timestamp": datetime.now().isoformat(),
                "extraction_successful": False,
                "error": str(e)
            }
    
    def process_all_images(self, directory_path: str = "tinsurance") -> Dict[str, Any]:
        """Process all PNG images and extract structured data"""
        
        print("🚀 Starting Structured Medical Data Extraction")
        print(f"📁 Scanning directory: {directory_path}")
        
        # Find all PNG files
        png_files = []
        if os.path.exists(directory_path):
            for file in os.listdir(directory_path):
                if file.lower().endswith('.png'):
                    png_files.append(os.path.join(directory_path, file))
        
        if not png_files:
            print("❌ No PNG files found in directory")
            return {}
        
        print(f"🔍 Found {len(png_files)} PNG files to process")
        
        # Process each file
        results = {
            "extraction_metadata": {
                "timestamp": datetime.now().isoformat(),
                "directory": directory_path,
                "total_files": len(png_files),
                "successful_extractions": 0,
                "failed_extractions": 0
            },
            "medical_data": []
        }
        
        for i, png_file in enumerate(png_files, 1):
            print(f"\n📋 Processing file {i}/{len(png_files)}: {os.path.basename(png_file)}")
            
            # Extract structured data
            extraction_result = self.extract_structured_data(png_file)
            
            if extraction_result.get('extraction_successful'):
                results["extraction_metadata"]["successful_extractions"] += 1
            else:
                results["extraction_metadata"]["failed_extractions"] += 1
            
            results["medical_data"].append(extraction_result)
        
        # Save results
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = f"structured_medical_data_{timestamp}.json"
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        
        print(f"\n💾 Structured data saved: {output_file}")
        
        # Print summary
        print("\n" + "=" * 60)
        print("STRUCTURED EXTRACTION SUMMARY")
        print("=" * 60)
        print(f"📊 Total files processed: {results['extraction_metadata']['total_files']}")
        print(f"✅ Successful extractions: {results['extraction_metadata']['successful_extractions']}")
        print(f"❌ Failed extractions: {results['extraction_metadata']['failed_extractions']}")
        print(f"📄 Output file: {output_file}")
        
        return results

def main():
    """Main function"""
    extractor = StructuredMedicalExtractor()
    results = extractor.process_all_images()
    
    if results:
        print(f"\n🎯 Structured extraction complete!")
        
        # Show sample extracted data
        for data in results.get("medical_data", []):
            if data.get("extraction_successful"):
                print(f"\n📋 Sample from {data['image_name']}:")
                structured = data.get("structured_data", {})
                lab_results = structured.get("labResults", {})
                
                # Show blood sugar if available
                if lab_results.get("bloodSugar"):
                    print("   Blood Sugar:", json.dumps(lab_results["bloodSugar"], indent=4))
                
                # Show CBC if available
                if lab_results.get("completeBloodCount"):
                    print("   CBC Sample:", json.dumps({k: v for k, v in list(lab_results["completeBloodCount"].items())[:2]}, indent=4))
                
                break
    else:
        print("\n❌ No files were processed.")

if __name__ == "__main__":
    main()