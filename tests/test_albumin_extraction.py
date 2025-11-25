#!/usr/bin/env python3
"""
Test script to extract albumin.png specifically using the general extraction approach
"""

import os
import base64
import json
from datetime import datetime
from openai import AzureOpenAI

# Azure OpenAI Configuration
endpoint = os.getenv("AZURE_OPENAI_ENDPOINT", "https://aihack20255032333051.openai.azure.com/")
model_name = "gpt-4.1"
deployment = "gpt-4.1"
subscription_key = os.getenv("AZURE_OPENAI_KEY")
api_version = "2025-01-01-preview"

# Initialize Azure OpenAI client
client = AzureOpenAI(
    api_version=api_version,
    azure_endpoint=endpoint,
    api_key=subscription_key,
)

def encode_image(image_path: str) -> str:
    """Encode image to base64 string"""
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

def extract_albumin_data():
    """Extract data from albumin.png specifically"""
    
    image_path = "reports/albumin.png"
    
    if not os.path.exists(image_path):
        print(f"❌ File not found: {image_path}")
        return
    
    print(f"🔍 Extracting data from: {image_path}")
    
    # Encode image
    base64_image = encode_image(image_path)
    
    # General extraction prompt
    extraction_prompt = """
    You are an expert medical data extraction system. Analyze this medical report image and extract ALL visible medical data.
    
    Look carefully at this image and extract EVERY piece of medical information you can see, including:
    - Patient information (name, age, gender, ID)
    - Document information (date, lab number, facility)
    - ALL test names and their values
    - ALL numerical results with units
    - ALL reference ranges
    - Any ratios or calculated values
    - Any interpretations or remarks
    
    Pay special attention to:
    - Albumin values and units
    - Globulin values and units  
    - Albumin/Globulin ratio
    - Total protein if present
    - Any other liver function tests
    
    Return ONLY a valid JSON object with this structure:
    
    {
        "documentInfo": {
            "type": "describe what type of medical report this is",
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
            "abnormalValues": ["list of tests with abnormal results with specific values"],
            "criticalAlerts": ["list of critical/high-risk findings if any"]
        }
    }
    
    CRITICAL RULES:
    1. Extract EVERY visible value - do not use null for data that is clearly shown
    2. Read all numbers, decimals, and units exactly as they appear
    3. Include reference ranges in parentheses or after ranges if visible
    4. Group related tests logically (e.g., liver function, protein studies)
    5. Return ONLY valid JSON - no markdown, no explanations
    6. Be extremely precise with numerical values
    """
    
    try:
        # Call Azure OpenAI Vision API
        response = client.chat.completions.create(
            model=deployment,
            messages=[
                {
                    "role": "system",
                    "content": """You are an expert medical data extraction AI with perfect vision and deep knowledge of medical reports. 
                    You excel at reading medical documents, laboratory results, and clinical data with 100% accuracy.
                    You never miss visible data and always extract complete information from medical images.
                    Return only perfectly formatted JSON with all visible medical data."""
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
        
        # Get the response
        raw_response = response.choices[0].message.content.strip()
        
        # Clean the response
        if raw_response.startswith('```json'):
            raw_response = raw_response.replace('```json', '').replace('```', '').strip()
        elif raw_response.startswith('```'):
            raw_response = raw_response.replace('```', '').strip()
        
        print("🤖 Raw AI Response:")
        print("=" * 80)
        print(raw_response)
        print("=" * 80)
        
        # Parse JSON
        try:
            structured_data = json.loads(raw_response)
            print("✅ Successfully extracted structured data:")
            print(json.dumps(structured_data, indent=2, ensure_ascii=False))
            
            # Save to file
            output_file = f"albumin_extraction_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(structured_data, f, indent=2, ensure_ascii=False)
            
            print(f"\n💾 Results saved to: {output_file}")
            
            return structured_data
            
        except json.JSONDecodeError as e:
            print(f"❌ JSON parsing error: {str(e)}")
            print("Raw response that failed to parse:")
            print(raw_response)
            return None
            
    except Exception as e:
        print(f"❌ Error during extraction: {str(e)}")
        return None

if __name__ == "__main__":
    print("🎯 Testing Albumin.png Data Extraction")
    print("=" * 50)
    
    result = extract_albumin_data()
    
    if result:
        print("\n🎉 Extraction completed successfully!")
        
        # Show key findings
        if 'labResults' in result:
            print("\n📊 Key Lab Results Found:")
            for category, tests in result['labResults'].items():
                print(f"\n{category.upper()}:")
                for test_name, test_data in tests.items():
                    if isinstance(test_data, dict) and 'value' in test_data:
                        value = test_data.get('value', 'N/A')
                        unit = test_data.get('unit', '')
                        range_val = test_data.get('referenceRange', '')
                        print(f"  • {test_name}: {value} {unit} (Ref: {range_val})")
    else:
        print("\n❌ Extraction failed!")