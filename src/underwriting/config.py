"""
Configuration Management
=======================
Centralizes all configuration settings and loads from environment variables
"""

import os
from pathlib import Path
from typing import Dict, Any
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Config:
    """System configuration loaded from environment variables"""
    
    # Azure OpenAI Configuration
    AZURE_OPENAI_ENDPOINT = os.getenv(
        'AZURE_OPENAI_ENDPOINT',
        'https://your-resource-name.openai.azure.com/'
    )
    AZURE_OPENAI_KEY = os.getenv('AZURE_OPENAI_KEY', '')
    AZURE_OPENAI_VERSION = os.getenv('AZURE_OPENAI_VERSION', '2025-01-01-preview')
    MODEL_NAME = os.getenv('AZURE_OPENAI_MODEL', 'gpt-4.1')
    DEPLOYMENT_NAME = os.getenv('AZURE_OPENAI_DEPLOYMENT', 'gpt-4.1')
    
    # Risk thresholds
    AUTO_APPROVAL_THRESHOLD = float(os.getenv('AUTO_APPROVAL_THRESHOLD', '0.7'))
    HIGH_RISK_THRESHOLD = float(os.getenv('HIGH_RISK_THRESHOLD', '0.3'))
    
    # Premium calculation factors
    BASE_PREMIUM_RATES = {
        "Term Life Insurance": 0.0012,  # 0.12% of sum assured
        "Critical Illness": 0.0008,     # 0.08% of sum assured
        "Accidental Death Benefit": 0.0002,  # 0.02% of sum assured
        "Disability Income": 0.0015     # 0.15% of annual benefit
    }
    
    # Logging
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    
    @classmethod
    def validate(cls) -> bool:
        """Validate that required configuration is present"""
        if not cls.AZURE_OPENAI_KEY:
            raise ValueError("AZURE_OPENAI_KEY environment variable is required")
        if not cls.AZURE_OPENAI_ENDPOINT or 'your-resource-name' in cls.AZURE_OPENAI_ENDPOINT:
            raise ValueError("AZURE_OPENAI_ENDPOINT environment variable is required")
        return True
    
    @classmethod
    def get_azure_openai_config(cls) -> Dict[str, Any]:
        """Get Azure OpenAI configuration as a dictionary"""
        return {
            "api_type": "azure",
            "azure_endpoint": cls.AZURE_OPENAI_ENDPOINT,
            "api_key": cls.AZURE_OPENAI_KEY,
            "api_version": cls.AZURE_OPENAI_VERSION,
            "model": cls.MODEL_NAME,
            "deployment": cls.DEPLOYMENT_NAME
        }


# Validate configuration on import
try:
    Config.validate()
except ValueError as e:
    print(f"⚠️ Configuration Warning: {e}")
    print("💡 Please create a .env file with required values (see .env.example)")
