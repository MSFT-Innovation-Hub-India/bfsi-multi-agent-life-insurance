# Underwriting API

## Overview

This API module provides RESTful and WebSocket endpoints for the AI-powered life insurance underwriting system. It enables realtime streaming of agent outputs for frontend showcase and demo purposes.

## Quick Start

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Start the API Server

```bash
python run_api.py
```

Or with uvicorn directly:

```bash
uvicorn src.api.app:app --reload --host 0.0.0.0 --port 8000
```

### Access the API

- **API Documentation**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/api/v1/underwriting/health

## API Endpoints

### Health Check
```
GET /api/v1/underwriting/health
```
Returns the health status of the API.

### Process Application (Synchronous)
```
POST /api/v1/underwriting/process
```
Process an underwriting application and return complete results with all agent outputs.

**Request Body:**
```json
{
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
```

### Process Application (Streaming via SSE)
```
POST /api/v1/underwriting/process/stream
```
Process an application with Server-Sent Events streaming. Events are emitted as each agent completes their analysis.

**Event Format:**
```json
{
  "event_id": "evt_20250127120000_0001",
  "timestamp": "2025-01-27T12:00:00.000000",
  "agent_name": "MedicalReviewer",
  "agent_role": "Medical Review Specialist",
  "status": "completed",
  "message": "Medical Review Specialist completed analysis",
  "analysis": "Full analysis text...",
  "metadata": {}
}
```

### WebSocket Streaming
```
WS /api/v1/underwriting/ws/{client_id}
```
Connect via WebSocket for realtime bidirectional communication.

**Send Message:**
```json
{
  "action": "process",
  "data": {
    "personalInfo": {...},
    "applicationDetails": {...},
    "insuranceCoverage": {...}
  }
}
```

### List Agents
```
GET /api/v1/underwriting/agents
```
Returns information about all agents in the underwriting workflow.

### Get Sample Data
```
GET /api/v1/underwriting/sample-data
```
Returns sample applicant data for testing.

### Run Demo
```
POST /api/v1/underwriting/demo
```
Runs a complete demo using sample data.

## Agent Workflow

The underwriting process uses the following multi-agent workflow:

1. **MedicalAnalyzer** (ML) - Analyzes medical data using ML models
2. **RiskAssessmentML** (ML) - Computes risk scores using ML
3. **MedicalReviewer** (AI Agent) - Expert medical analysis
4. **FraudDetector** (AI Agent) - Fraud detection and verification
5. **RiskAssessor** (AI Agent) - Comprehensive risk assessment
6. **PremiumCalculator** (AI Agent) - Premium calculations with loadings
7. **DecisionMaker** (AI Agent) - Final underwriting decision

## Frontend Integration

### SSE Example (JavaScript)

```javascript
const eventSource = new EventSource('/api/v1/underwriting/process/stream', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(applicationData)
});

eventSource.onmessage = (event) => {
  const agentEvent = JSON.parse(event.data);
  console.log(`${agentEvent.agent_name}: ${agentEvent.status}`);
  
  if (agentEvent.analysis) {
    updateUI(agentEvent);
  }
};

eventSource.onerror = (error) => {
  console.error('SSE Error:', error);
  eventSource.close();
};
```

### WebSocket Example (JavaScript)

```javascript
const ws = new WebSocket('ws://localhost:8000/api/v1/underwriting/ws/client123');

ws.onopen = () => {
  // Send processing request
  ws.send(JSON.stringify({
    action: 'process',
    data: applicationData
  }));
};

ws.onmessage = (event) => {
  const agentEvent = JSON.parse(event.data);
  console.log(`${agentEvent.agent_name}: ${agentEvent.message}`);
  
  if (agentEvent.status === 'completed') {
    displayAgentOutput(agentEvent);
  }
};

ws.onclose = () => {
  console.log('WebSocket closed');
};
```

## Response Models

### Agent Event
```typescript
interface AgentEvent {
  event_id: string;
  timestamp: string;
  agent_name: string;
  agent_role: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  message: string;
  analysis?: string;
  metadata: Record<string, any>;
}
```

### Underwriting Response
```typescript
interface UnderwritingResponse {
  workflow_id: string;
  application_id: string;
  applicant_name: string;
  status: string;
  processing_timestamp: string;
  events: AgentEvent[];
  agent_outputs: Record<string, AgentOutput>;
  final_decision: {
    decision: string;
    confidence_score: number;
    risk_level: string;
    total_premium: number;
    conditions: string[];
    exclusions: string[];
    reasoning: string[];
  };
}
```

## Environment Variables

The API uses the following environment variables (from the main underwriting system):

- `AZURE_OPENAI_ENDPOINT` - Azure OpenAI endpoint URL
- `AZURE_OPENAI_KEY` - Azure OpenAI API key
- `AZURE_OPENAI_VERSION` - Azure OpenAI API version
- `MODEL_NAME` - Model name to use

## Error Handling

All errors return a JSON response with the following format:

```json
{
  "error": "Error type",
  "detail": "Detailed error message"
}
```

## CORS

CORS is enabled for all origins by default. For production, configure specific allowed origins in `app.py`.
