"""
Application Entry Point for Azure App Service
==============================================

This file sets up the Python path correctly and imports the FastAPI app.
Used by gunicorn in Azure App Service.
"""

import sys
from pathlib import Path

# Add src directory to Python path so imports like 'from underwriting.config' work
src_path = Path(__file__).parent / 'src'
sys.path.insert(0, str(src_path))

# Now import the FastAPI app
from api.app import app

# Export app for gunicorn
__all__ = ['app']
