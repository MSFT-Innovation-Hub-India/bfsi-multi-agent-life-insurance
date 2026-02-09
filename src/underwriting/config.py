"""
Configuration Management
=======================
Centralizes all configuration settings and loads from environment variables.
Supports both API key and Managed Identity authentication.
"""

import os
from pathlib import Path
from typing import Dict, Any, Optional
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


def get_azure_credential():
    """Get Azure credential for Managed Identity authentication"""
    try:
        from azure.identity import DefaultAzureCredential, get_bearer_token_provider
        credential = DefaultAzureCredential()
        return credential
    except ImportError:
        print("⚠️ azure-identity not installed. Managed Identity not available.")
        return None


class Config:
    """System configuration loaded from environment variables"""
    
    # Azure OpenAI Configuration
    AZURE_OPENAI_ENDPOINT = os.getenv(
        'AZURE_OPENAI_ENDPOINT',
        'https://your-resource-name.openai.azure.com/'
    )
    AZURE_OPENAI_KEY = os.getenv('AZURE_OPENAI_KEY', '')  # Optional if using Managed Identity
    AZURE_OPENAI_VERSION = os.getenv('AZURE_OPENAI_VERSION', '2025-01-01-preview')
    MODEL_NAME = os.getenv('AZURE_OPENAI_MODEL', 'gpt-4.1')
    DEPLOYMENT_NAME = os.getenv('AZURE_OPENAI_DEPLOYMENT', 'gpt-4.1')
    
    # Use Managed Identity if no API key is provided
    USE_MANAGED_IDENTITY = os.getenv('USE_MANAGED_IDENTITY', 'true').lower() == 'true'
    
    # Azure Cosmos DB Configuration (for storing agent results)
    AZURE_COSMOS_ENDPOINT = os.getenv('AZURE_COSMOS_ENDPOINT', '')
    AZURE_COSMOS_KEY = os.getenv('AZURE_COSMOS_KEY', '')
    AZURE_COSMOS_DATABASE = os.getenv('AZURE_COSMOS_DATABASE', 'underwriting')
    AZURE_COSMOS_CONTAINER = os.getenv('AZURE_COSMOS_CONTAINER', 'agent_results')
    
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
    
    # Cached credential and token provider
    _credential = None
    _token_provider = None
    
    @classmethod
    def validate(cls) -> bool:
        """Validate that required configuration is present"""
        # Skip API key validation if using Managed Identity
        if not cls.USE_MANAGED_IDENTITY and not cls.AZURE_OPENAI_KEY:
            raise ValueError("AZURE_OPENAI_KEY environment variable is required (or set USE_MANAGED_IDENTITY=true)")
        if not cls.AZURE_OPENAI_ENDPOINT or 'your-resource-name' in cls.AZURE_OPENAI_ENDPOINT:
            raise ValueError("AZURE_OPENAI_ENDPOINT environment variable is required")
        return True
    
    @classmethod
    def get_token_provider(cls):
        """Get Azure AD token provider for Managed Identity authentication"""
        if cls._token_provider is None:
            try:
                from azure.identity import DefaultAzureCredential, get_bearer_token_provider
                cls._credential = DefaultAzureCredential()
                cls._token_provider = get_bearer_token_provider(
                    cls._credential, 
                    "https://cognitiveservices.azure.com/.default"
                )
            except ImportError:
                raise ImportError("azure-identity package required for Managed Identity. Install with: pip install azure-identity")
        return cls._token_provider
    
    @classmethod
    def get_azure_openai_config(cls) -> Dict[str, Any]:
        """Get Azure OpenAI configuration as a dictionary"""
        config = {
            "api_type": "azure",
            "azure_endpoint": cls.AZURE_OPENAI_ENDPOINT,
            "api_version": cls.AZURE_OPENAI_VERSION,
            "model": cls.MODEL_NAME,
            "deployment": cls.DEPLOYMENT_NAME
        }
        
        # Use Managed Identity if enabled and no API key provided
        if cls.USE_MANAGED_IDENTITY and not cls.AZURE_OPENAI_KEY:
            config["azure_ad_token_provider"] = cls.get_token_provider()
        else:
            config["api_key"] = cls.AZURE_OPENAI_KEY
            
        return config
    
    @classmethod
    def get_cosmos_config(cls) -> Dict[str, Any]:
        """Get Azure Cosmos DB configuration as a dictionary"""
        return {
            "endpoint": cls.AZURE_COSMOS_ENDPOINT,
            "key": cls.AZURE_COSMOS_KEY,
            "database": cls.AZURE_COSMOS_DATABASE,
            "container": cls.AZURE_COSMOS_CONTAINER
        }
    
    @classmethod
    def is_cosmos_configured(cls) -> bool:
        """Check if Cosmos DB is configured (either key or managed identity)"""
        return bool(cls.AZURE_COSMOS_ENDPOINT)
    
    @classmethod
    def uses_managed_identity(cls) -> bool:
        """Check if using Managed Identity for authentication"""
        return cls.USE_MANAGED_IDENTITY and not cls.AZURE_OPENAI_KEY


# Validate configuration on import
try:
    Config.validate()
except ValueError as e:
    print(f"⚠️ Configuration Warning: {e}")
    print("💡 Please create a .env file with required values (see .env.example)")
