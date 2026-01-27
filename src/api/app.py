"""
FastAPI Application for Underwriting API
=========================================

Main application entry point for the FastAPI server.
Provides realtime APIs for underwriting showcase.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from api.routes import router as underwriting_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    logger.info("🚀 Starting Underwriting API Server...")
    yield
    logger.info("🛑 Shutting down Underwriting API Server...")


# Create FastAPI application
app = FastAPI(
    title="Life Insurance Underwriting API",
    description="""
    AI-Powered Life Insurance Underwriting System API
    
    This API provides endpoints for:
    - Processing underwriting applications with multi-agent AI analysis
    - Realtime streaming of agent outputs via SSE and WebSocket
    - Demo and testing endpoints for showcase
    
    ## Features
    
    - **Multi-Agent Processing**: Uses specialized AI agents for medical review, 
      fraud detection, risk assessment, premium calculation, and decision making
    - **Realtime Streaming**: Stream agent outputs as they complete using SSE or WebSocket
    - **Comprehensive Analysis**: Full underwriting report with conditions and exclusions
    """,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(underwriting_router)


@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "name": "Life Insurance Underwriting API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "endpoints": {
            "health": "/api/v1/underwriting/health",
            "process": "/api/v1/underwriting/process",
            "stream": "/api/v1/underwriting/process/stream",
            "websocket": "/api/v1/underwriting/ws/{client_id}",
            "agents": "/api/v1/underwriting/agents",
            "demo": "/api/v1/underwriting/demo",
            "sample_data": "/api/v1/underwriting/sample-data"
        }
    }


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc)
        }
    )


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
