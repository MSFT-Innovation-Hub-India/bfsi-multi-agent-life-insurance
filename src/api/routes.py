"""
FastAPI Routes for Underwriting API
====================================

RESTful and WebSocket endpoints for realtime underwriting showcase.
Agent results are stored in Cosmos DB for analysis tracking.
UI retrieval remains unchanged (uses existing JSON/blob sources).
"""

import asyncio
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional, List

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel, Field

from .streaming_orchestrator import StreamingOrchestrator, AgentEvent, AgentStatus
from .cosmos_storage import get_cosmos_storage

logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api/v1/underwriting", tags=["underwriting"])

# Global orchestrator instance (lazy initialization)
_orchestrator: Optional[StreamingOrchestrator] = None


def get_orchestrator() -> StreamingOrchestrator:
    """Get or create the streaming orchestrator instance"""
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = StreamingOrchestrator()
    return _orchestrator


# ============================================================================
# Pydantic Models for API
# ============================================================================

class PersonalInfo(BaseModel):
    """Personal information model"""
    name: str = Field(..., description="Applicant's full name")
    age: int = Field(..., ge=18, le=80, description="Applicant's age")
    gender: str = Field(..., description="Applicant's gender")
    occupation: Optional[str] = None
    income: Optional[Dict[str, Any]] = None


class InsuranceCoverage(BaseModel):
    """Insurance coverage request model"""
    totalSumAssured: int = Field(..., description="Total sum assured")
    coversRequested: List[Dict[str, Any]] = Field(default_factory=list)


class ApplicationDetails(BaseModel):
    """Application details model"""
    applicationNumber: str = Field(..., description="Unique application number")
    applicationDate: Optional[str] = None


class UnderwritingRequest(BaseModel):
    """Complete underwriting request model"""
    personalInfo: PersonalInfo
    applicationDetails: ApplicationDetails
    insuranceCoverage: InsuranceCoverage
    lifestyle: Optional[Dict[str, Any]] = None
    health: Optional[Dict[str, Any]] = None
    medicalData: Optional[Dict[str, Any]] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "personalInfo": {
                    "name": "John Doe",
                    "age": 35,
                    "gender": "Male",
                    "occupation": "Software Engineer",
                    "income": {"annual": 1500000}
                },
                "applicationDetails": {
                    "applicationNumber": "APP2025001"
                },
                "insuranceCoverage": {
                    "totalSumAssured": 5000000,
                    "coversRequested": [
                        {"coverType": "Term Life Insurance", "sumAssured": 5000000, "term": 20}
                    ]
                }
            }
        }


class AgentOutputResponse(BaseModel):
    """Response model for agent outputs"""
    agent_name: str
    agent_role: str
    status: str
    analysis: Optional[str]
    timestamp: str
    metadata: Dict[str, Any] = Field(default_factory=dict)


class UnderwritingResponse(BaseModel):
    """Complete underwriting response model"""
    workflow_id: str
    application_id: str
    applicant_name: str
    status: str
    processing_timestamp: str
    events: List[Dict[str, Any]]
    agent_outputs: Dict[str, Any]
    final_decision: Optional[Dict[str, Any]]


class WorkflowStatusResponse(BaseModel):
    """Workflow status response"""
    workflow_id: str
    status: str
    current_agent: Optional[str]
    completed_agents: List[str]
    progress_percentage: float


# ============================================================================
# REST API Endpoints
# ============================================================================

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "underwriting-api",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }


@router.post("/process", response_model=UnderwritingResponse)
async def process_application(request: UnderwritingRequest):
    """
    Process an underwriting application and return complete results.
    
    This endpoint processes the application synchronously and returns
    all agent outputs along with the final decision.
    
    Results are stored in Cosmos DB for tracking (UI retrieval unaffected).
    """
    try:
        orchestrator = get_orchestrator()
        cosmos_storage = get_cosmos_storage()
        
        # Convert request to dict format expected by orchestrator
        applicant_data = {
            "personalInfo": request.personalInfo.model_dump(),
            "applicationDetails": request.applicationDetails.model_dump(),
            "insuranceCoverage": request.insuranceCoverage.model_dump(),
            "lifestyle": request.lifestyle or {},
            "health": request.health or {}
        }
        
        medical_data = request.medicalData or {"medical_data": {}}
        
        # Process application
        result = await orchestrator.process_application(applicant_data, medical_data)
        
        # Store workflow result in Cosmos DB (non-blocking, doesn't affect response)
        application_id = request.applicationDetails.applicationNumber
        if cosmos_storage.is_available:
            try:
                await cosmos_storage.store_workflow_result(application_id, result)
                logger.info(f"✅ Stored workflow result in Cosmos DB for {application_id}")
            except Exception as e:
                logger.warning(f"⚠️ Failed to store in Cosmos DB (non-critical): {e}")
        
        return UnderwritingResponse(**result)
        
    except Exception as e:
        logger.error(f"Error processing application: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/process/stream")
async def process_application_stream(request: UnderwritingRequest):
    """
    Process an underwriting application with Server-Sent Events (SSE) streaming.
    
    Returns a stream of events as each agent completes their analysis,
    enabling realtime updates in the frontend.
    
    Each agent result is stored in Cosmos DB as it completes.
    UI retrieval remains unchanged.
    """
    try:
        orchestrator = get_orchestrator()
        cosmos_storage = get_cosmos_storage()
        
        # Convert request to dict format
        applicant_data = {
            "personalInfo": request.personalInfo.model_dump(),
            "applicationDetails": request.applicationDetails.model_dump(),
            "insuranceCoverage": request.insuranceCoverage.model_dump(),
            "lifestyle": request.lifestyle or {},
            "health": request.health or {}
        }
        
        medical_data = request.medicalData or {"medical_data": {}}
        application_id = request.applicationDetails.applicationNumber
        
        async def event_generator():
            """Generate SSE events and store agent results in Cosmos"""
            collected_events = []
            try:
                async for event in orchestrator.process_application_streaming(
                    applicant_data, medical_data
                ):
                    # Format as SSE
                    event_data = event.to_json()
                    yield f"data: {event_data}\n\n"
                    
                    # Store agent result in Cosmos DB (non-blocking)
                    if cosmos_storage.is_available and event.status == AgentStatus.COMPLETED:
                        try:
                            await cosmos_storage.store_agent_result(
                                application_id=application_id,
                                agent_name=event.agent_name,
                                agent_role=event.agent_role,
                                analysis=event.analysis or "",
                                status=event.status.value,
                                metadata=event.metadata
                            )
                        except Exception as e:
                            logger.warning(f"⚠️ Failed to store agent result: {e}")
                    
                    collected_events.append(event.to_dict())
                
                # Store complete workflow result at the end
                if cosmos_storage.is_available and collected_events:
                    try:
                        workflow_result = {
                            "workflow_id": collected_events[0].get("metadata", {}).get("workflow_id"),
                            "application_id": application_id,
                            "applicant_name": applicant_data.get("personalInfo", {}).get("name", "Unknown"),
                            "status": "completed",
                            "processing_timestamp": datetime.now().isoformat(),
                            "events": collected_events,
                            "agent_outputs": {},
                            "final_decision": None
                        }
                        await cosmos_storage.store_workflow_result(application_id, workflow_result)
                    except Exception as e:
                        logger.warning(f"⚠️ Failed to store workflow result: {e}")
                    
                # Send completion event
                yield f"data: {json.dumps({'type': 'complete', 'timestamp': datetime.now().isoformat()})}\n\n"
                
            except Exception as e:
                error_event = {
                    "type": "error",
                    "message": str(e),
                    "timestamp": datetime.now().isoformat()
                }
                yield f"data: {json.dumps(error_event)}\n\n"
        
        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"
            }
        )
        
    except Exception as e:
        logger.error(f"Error starting stream: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/process/file")
async def process_application_from_file(
    applicant_data_file: str = "data/sample/person_details.json",
    medical_images_directory: str = "data/medical_images"
):
    """
    Process an underwriting application using files.
    
    This endpoint loads applicant data from a JSON file and processes
    medical images from a directory, similar to the CLI usage.
    """
    try:
        orchestrator = get_orchestrator()
        
        # Load applicant data
        applicant_path = Path(applicant_data_file)
        if not applicant_path.exists():
            raise HTTPException(status_code=404, detail=f"Applicant data file not found: {applicant_data_file}")
        
        with open(applicant_path, 'r') as f:
            applicant_data = json.load(f)
        
        # For file-based processing, we'd typically use the medical extractor
        # For now, use empty medical data (the full system handles extraction)
        medical_data = {"medical_data": {}}
        
        # Process application
        result = await orchestrator.process_application(applicant_data, medical_data)
        
        return JSONResponse(content=result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing file: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/agents")
async def list_agents():
    """
    List all available agents in the underwriting workflow.
    
    Returns information about each agent including their role and
    position in the workflow.
    """
    agents = [
        {
            "key": "medical_analyzer",
            "name": "MedicalAnalyzer",
            "role": "ML Medical Data Analyzer",
            "description": "Analyzes medical data using ML models to identify findings",
            "order": 1
        },
        {
            "key": "risk_ml",
            "name": "RiskAssessmentML",
            "role": "ML Risk Assessment Engine",
            "description": "Computes risk scores using machine learning models",
            "order": 2
        },
        {
            "key": "medical_reviewer",
            "name": "MedicalReviewer",
            "role": "Medical Review Specialist",
            "description": "Expert medical analysis enhancing ML predictions",
            "order": 3
        },
        {
            "key": "fraud_detector",
            "name": "FraudDetector",
            "role": "Fraud Detection Specialist",
            "description": "Verifies data authenticity and identifies fraud risks",
            "order": 4
        },
        {
            "key": "risk_assessor",
            "name": "RiskAssessor",
            "role": "Risk Assessment Specialist",
            "description": "Comprehensive multi-factor risk assessment",
            "order": 5
        },
        {
            "key": "premium_calculator",
            "name": "PremiumCalculator",
            "role": "Premium Calculation Specialist",
            "description": "Calculates premiums with medical loadings",
            "order": 6
        },
        {
            "key": "decision_maker",
            "name": "DecisionMaker",
            "role": "Senior Underwriting Decision Maker",
            "description": "Makes final underwriting decision",
            "order": 7
        }
    ]
    
    return {
        "agents": agents,
        "workflow": "medical_analyzer → risk_ml → medical_reviewer → fraud_detector → risk_assessor → premium_calculator → decision_maker",
        "total_agents": len(agents)
    }


# ============================================================================
# WebSocket Endpoint for Realtime Streaming
# ============================================================================

class ConnectionManager:
    """Manages WebSocket connections"""
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        logger.info(f"WebSocket connected: {client_id}")
    
    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]
            logger.info(f"WebSocket disconnected: {client_id}")
    
    async def send_event(self, client_id: str, event: AgentEvent):
        if client_id in self.active_connections:
            await self.active_connections[client_id].send_json(event.to_dict())
    
    async def broadcast(self, event: AgentEvent):
        for client_id, connection in self.active_connections.items():
            try:
                await connection.send_json(event.to_dict())
            except Exception as e:
                logger.error(f"Error sending to {client_id}: {e}")


# Global connection manager
connection_manager = ConnectionManager()


@router.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """
    WebSocket endpoint for realtime underwriting updates.
    
    Connect to this endpoint and send a JSON message with applicant data
    to start processing. Events will be streamed as each agent completes.
    
    Agent results are stored in Cosmos DB as they complete.
    
    Message format:
    {
        "action": "process",
        "data": {
            "personalInfo": {...},
            "applicationDetails": {...},
            "insuranceCoverage": {...}
        }
    }
    """
    await connection_manager.connect(websocket, client_id)
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_json()
            
            action = data.get("action")
            
            if action == "process":
                # Process underwriting request
                applicant_data = data.get("data", {})
                medical_data = data.get("medicalData", {"medical_data": {}})
                application_id = applicant_data.get("applicationDetails", {}).get("applicationNumber", "APP001")
                
                orchestrator = get_orchestrator()
                cosmos_storage = get_cosmos_storage()
                
                collected_events = []
                
                # Stream events to client and store in Cosmos
                async for event in orchestrator.process_application_streaming(
                    applicant_data, medical_data
                ):
                    await connection_manager.send_event(client_id, event)
                    collected_events.append(event.to_dict())
                    
                    # Store completed agent results in Cosmos DB
                    if cosmos_storage.is_available and event.status == AgentStatus.COMPLETED:
                        try:
                            await cosmos_storage.store_agent_result(
                                application_id=application_id,
                                agent_name=event.agent_name,
                                agent_role=event.agent_role,
                                analysis=event.analysis or "",
                                status=event.status.value,
                                metadata=event.metadata
                            )
                        except Exception as e:
                            logger.warning(f"⚠️ Failed to store agent result: {e}")
                
                # Store complete workflow result
                if cosmos_storage.is_available and collected_events:
                    try:
                        workflow_result = {
                            "workflow_id": collected_events[0].get("metadata", {}).get("workflow_id"),
                            "application_id": application_id,
                            "applicant_name": applicant_data.get("personalInfo", {}).get("name", "Unknown"),
                            "status": "completed",
                            "processing_timestamp": datetime.now().isoformat(),
                            "events": collected_events,
                            "agent_outputs": {},
                            "final_decision": None
                        }
                        await cosmos_storage.store_workflow_result(application_id, workflow_result)
                    except Exception as e:
                        logger.warning(f"⚠️ Failed to store workflow result: {e}")
                
                # Send completion message
                await websocket.send_json({
                    "type": "workflow_complete",
                    "timestamp": datetime.now().isoformat()
                })
                
            elif action == "ping":
                await websocket.send_json({
                    "type": "pong",
                    "timestamp": datetime.now().isoformat()
                })
                
            else:
                await websocket.send_json({
                    "type": "error",
                    "message": f"Unknown action: {action}"
                })
                
    except WebSocketDisconnect:
        connection_manager.disconnect(client_id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}", exc_info=True)
        connection_manager.disconnect(client_id)


# ============================================================================
# Sample Data Endpoint for Testing
# ============================================================================

@router.get("/sample-data")
async def get_sample_data():
    """
    Get sample applicant data for testing the API.
    
    Returns a complete sample request that can be used to test
    the underwriting endpoints.
    """
    return {
        "personalInfo": {
            "name": "Rajesh Kumar",
            "age": 45,
            "gender": "Male",
            "occupation": "IT Professional",
            "income": {
                "annual": 1800000,
                "currency": "INR"
            }
        },
        "applicationDetails": {
            "applicationNumber": "LI2025090001",
            "applicationDate": datetime.now().isoformat()
        },
        "insuranceCoverage": {
            "totalSumAssured": 8000000,
            "coversRequested": [
                {
                    "coverType": "Term Life Insurance",
                    "sumAssured": 5000000,
                    "term": 20
                },
                {
                    "coverType": "Critical Illness",
                    "sumAssured": 2000000,
                    "term": 20
                },
                {
                    "coverType": "Accidental Death Benefit",
                    "sumAssured": 1000000,
                    "term": 20
                }
            ]
        },
        "lifestyle": {
            "smoker": False,
            "alcohol": {
                "frequency": "Social",
                "type": "Occasional"
            },
            "exercise": {
                "frequency": "Regular",
                "type": "Gym"
            }
        },
        "health": {
            "physical": {
                "height": {"value": 175, "unit": "cm"},
                "weight": {"value": 78, "unit": "kg"}
            },
            "existingConditions": [],
            "familyHistory": []
        },
        "medicalData": {
            "medical_data": {
                "blood_tests": {
                    "hemoglobin": {"value": 14.2, "unit": "g/dL", "normal_range": "13.5-17.5"},
                    "glucose_fasting": {"value": 105, "unit": "mg/dL", "normal_range": "70-100"},
                    "hba1c": {"value": 6.2, "unit": "%", "normal_range": "4.0-5.6"}
                },
                "lipid_profile": {
                    "total_cholesterol": {"value": 210, "unit": "mg/dL", "normal_range": "<200"},
                    "ldl": {"value": 130, "unit": "mg/dL", "normal_range": "<100"},
                    "hdl": {"value": 45, "unit": "mg/dL", "normal_range": ">40"}
                }
            }
        }
    }


@router.post("/demo")
async def run_demo():
    """
    Run a complete demo of the underwriting process.
    
    Uses sample data to demonstrate the full workflow and returns
    all agent outputs along with the final decision.
    
    Results are stored in Cosmos DB for tracking.
    """
    try:
        # Get sample data
        sample_data = await get_sample_data()
        
        orchestrator = get_orchestrator()
        cosmos_storage = get_cosmos_storage()
        
        # Process sample application
        result = await orchestrator.process_application(
            applicant_data={
                "personalInfo": sample_data["personalInfo"],
                "applicationDetails": sample_data["applicationDetails"],
                "insuranceCoverage": sample_data["insuranceCoverage"],
                "lifestyle": sample_data.get("lifestyle", {}),
                "health": sample_data.get("health", {})
            },
            medical_data=sample_data.get("medicalData", {"medical_data": {}})
        )
        
        # Store demo result in Cosmos DB
        application_id = sample_data["applicationDetails"]["applicationNumber"]
        if cosmos_storage.is_available:
            try:
                await cosmos_storage.store_workflow_result(application_id, result)
                logger.info(f"✅ Stored demo result in Cosmos DB for {application_id}")
            except Exception as e:
                logger.warning(f"⚠️ Failed to store demo result (non-critical): {e}")
        
        return JSONResponse(content=result)
        
    except Exception as e:
        logger.error(f"Demo error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Cosmos DB Retrieval Endpoints (for frontend)
# ============================================================================

@router.get("/reports")
async def list_reports():
    """
    List all underwriting reports stored in Cosmos DB.
    Returns summary data for the applications list page.
    """
    try:
        cosmos_storage = get_cosmos_storage()
        if not cosmos_storage.is_available:
            raise HTTPException(status_code=503, detail="Cosmos DB not available")

        reports = await cosmos_storage.get_all_reports()
        return {"reports": reports, "total": len(reports)}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing reports: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/reports/{application_id}")
async def get_reports_for_application(application_id: str):
    """
    Get all reports for a specific application ID.
    """
    try:
        cosmos_storage = get_cosmos_storage()
        if not cosmos_storage.is_available:
            raise HTTPException(status_code=503, detail="Cosmos DB not available")

        reports = await cosmos_storage.get_reports_by_application(application_id)
        if not reports:
            raise HTTPException(status_code=404, detail=f"No reports found for {application_id}")

        # Return the full report data from the first (most recent) match
        report_data = reports[0].get("report", reports[0])
        return report_data

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting report for {application_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/reports/{application_id}/all")
async def get_all_reports_for_application(application_id: str):
    """
    Get all report versions for a specific application ID.
    """
    try:
        cosmos_storage = get_cosmos_storage()
        if not cosmos_storage.is_available:
            raise HTTPException(status_code=503, detail="Cosmos DB not available")

        reports = await cosmos_storage.get_reports_by_application(application_id)
        return {"reports": reports, "total": len(reports)}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting reports for {application_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dashboard-data")
async def get_dashboard_data():
    """
    Get complete dashboard data from Cosmos DB.
    Returns applications list with summary statistics — replaces the static JSON.
    """
    try:
        cosmos_storage = get_cosmos_storage()
        if not cosmos_storage.is_available:
            raise HTTPException(status_code=503, detail="Cosmos DB not available")

        reports = await cosmos_storage.get_all_reports()

        # Build applications list from reports
        applications = []
        total_premium = 0
        total_accepted = 0
        total_additional = 0
        total_declined = 0
        total_pending = 0
        processing_times = []

        for r in reports:
            app_meta = r.get("application_metadata", {})
            decision = r.get("final_decision", "pending")
            premium = r.get("total_final_premium", 0) or 0
            risk = r.get("risk_category", "MEDIUM RISK")
            proc_time = app_meta.get("processing_time_seconds", 0) or 0

            total_premium += premium
            if proc_time:
                processing_times.append(proc_time)

            if decision == "accepted":
                total_accepted += 1
            elif decision in ("additional_requirements", "manual_review"):
                total_additional += 1
            elif decision == "declined":
                total_declined += 1
            else:
                total_pending += 1

            # Build full report structure for each application
            full_reports = await cosmos_storage.get_reports_by_application(
                r.get("application_id", "")
            )
            if full_reports:
                app_data = full_reports[0].get("report", {})
                applications.append(app_data)
            else:
                applications.append({
                    "application_metadata": app_meta,
                })

        total = len(reports)
        avg_time = sum(processing_times) / len(processing_times) if processing_times else 0

        return {
            "applications": applications,
            "summary": {
                "totalApplications": total,
                "totalAccepted": total_accepted,
                "totalAdditionalRequirements": total_additional,
                "totalDeclined": total_declined,
                "totalPending": total_pending,
                "totalPremiumValue": total_premium,
                "averageProcessingTime": avg_time,
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error building dashboard data: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
