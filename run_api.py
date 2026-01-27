"""
API Server Runner
=================

Start the FastAPI server for the underwriting API.

Usage:
    python run_api.py
    
Or with uvicorn directly:
    uvicorn src.api.app:app --reload --host 0.0.0.0 --port 8000
"""

import sys
from pathlib import Path

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent / 'src'))

import uvicorn


def main():
    """Start the API server"""
    print("🚀 Starting Life Insurance Underwriting API Server")
    print("=" * 60)
    print("📍 API Documentation: http://localhost:8000/docs")
    print("📍 Alternative Docs: http://localhost:8000/redoc")
    print("📍 Health Check: http://localhost:8000/api/v1/underwriting/health")
    print("=" * 60)
    
    uvicorn.run(
        "api.app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )


if __name__ == "__main__":
    main()
