# 🛡️ AI-Powered Life Insurance Underwriting Assistant

[![Python 3.9+](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/downloads/)
[![React 19](https://img.shields.io/badge/react-19-61dafb.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.9-blue.svg)](https://www.typescriptlang.org/)

A smart AI assistant that helps insurance underwriters work faster. The system uses 5 AI agents and Azure OpenAI to read medical documents, check for fraud, assess risks, and calculate premiums.

**⚠️ Important:** This tool assists underwriters. All recommendations need professional review.

---

## ✨ What It Does

- 🏥 Reads medical reports automatically
- 🤖 5 AI agents analyze applications
- 🔍 Detects fraud patterns
- 📊 Assesses risks
- 💰 Calculates premiums
- 📋 Generates detailed reports
- 💻 Dashboard to view results

---

## 🚀 Quick Start

### Prerequisites
- Python 3.9+ | Node.js 18+ | Azure OpenAI API (GPT-4)

### Installation

```bash
# Clone repository
git clone https://github.com/MSFT-Innovation-Hub-India/bfsi-multi-agent-life-insurance.git
cd bfsi-multi-agent-life-insurance

# Install Python dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your Azure OpenAI credentials

# Install frontend dependencies
cd Life-Insurance-Underwriting
npm install
```

### Run the System

There are three ways to run the backend depending on your use case:

| Script | What it does |
|--------|--------------|
| `run.py` | CLI — original v1 architecture |
| `run_v2.py` | CLI — modular v2 architecture (recommended) |
| `run_api.py` | Starts a FastAPI HTTP server (port 8000) |

---

#### Option 1: CLI — Process a Single Application (Recommended)

```bash
# Modular v2 (recommended)
python run_v2.py

# Original v1
python run.py
```

Processes `data/sample/person_details.json` + images in `data/medical_images/`.  
Outputs: underwriting decision, confidence score, medical loading %, and premium to console.  
Report saved to `outputs/reports/`.

#### Option 2: API Server (for frontend / REST clients)

```bash
python run_api.py
```

Starts a FastAPI server at **http://localhost:8000**

| URL | Description |
|-----|-------------|
| http://localhost:8000/docs | Swagger UI |
| http://localhost:8000/redoc | ReDoc |
| http://localhost:8000/api/v1/underwriting/health | Health check |
| http://localhost:8000/api/v1/underwriting/process | Process application (POST) |

#### Option 3: Frontend Dashboard

```bash
cd Life-Insurance-Underwriting
npm run dev
```

Opens at **http://localhost:3001** — requires the API server (`run_api.py`) to be running.

---

## 📖 Documentation

| Guide | Description |
|-------|-------------|
| **[Installation](docs/INSTALLATION.md)** | Complete setup instructions |
| **[Usage](docs/USAGE.md)** | How to run and use the system |
| **[Architecture](docs/ARCHITECTURE.md)** | Technical design and structure |

---

## 🤖 How It Works

### 5 AI Agents Work Together

1. **Medical Reviewer** - Analyzes medical reports, calculates loading
2. **Fraud Detector** - Identifies potential fraud patterns
3. **Risk Assessor** - Evaluates multi-factor risk scores
4. **Premium Calculator** - Calculates premiums with loadings
5. **Decision Support** - Provides final recommendations

### Processing Flow

```
Input → Extract Medical Data → AI Agents Analyze → 
Risk & Fraud Detection → Premium Calculation → Reports Generated → 
Underwriter Reviews & Approves
```

## 📊 Output

Each application generates:
- **JSON Report** - Complete analysis data
- **Text Report** - Human-readable summary
- **Loading Report** - Medical conditions breakdown
- **Dashboard View** - Interactive visualization

---

## 🛠️ Tech Stack

**Backend:** Python 3.9+ • Azure OpenAI • AutoGen

**Frontend:** React 19 • TypeScript • Vite • TailwindCSS

---

## 📁 Project Structure

```
Life-Insurance-Underwriting/
├── src/underwriting/              # Python backend
│   ├── core/                      # Main orchestrator
│   ├── agents/                    # Multi-agent system
│   ├── analyzers/                 # Medical & fraud analysis
│   └── engines/                   # Risk & loading engines
│
├── Life-Insurance-Underwriting/   # React frontend
│   └── src/components/            # UI components
│
├── data/                          # Input data
│   ├── sample/                    # Sample applications
│   └── medical_images/            # Medical reports
│
├── outputs/reports/               # Generated reports
├── docs/                          # Documentation
├── .env.example                   # Environment template
└── requirements.txt               # Dependencies
```

---

## ☁️ Deployment

### Azure Container Apps (Recommended)

Deploy the backend API and frontend as containerized microservices on Azure Container Apps.

#### Prerequisites

- [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli) installed and logged in
- An Azure subscription
- Azure OpenAI resource with GPT-4 deployed

#### 1. Set Up Environment Variables

```bash
RESOURCE_GROUP="rg-liu-underwriting"
LOCATION="eastus"
ENVIRONMENT="liu-env"
ACR_NAME="liuacr$(openssl rand -hex 4)"
BACKEND_APP="liu-backend"
FRONTEND_APP="liu-frontend"
```

#### 2. Create Azure Resources

```bash
# Create resource group
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create Azure Container Registry
az acr create --resource-group $RESOURCE_GROUP --name $ACR_NAME --sku Basic --admin-enabled true

# Create Container Apps environment
az containerapp env create \
  --name $ENVIRONMENT \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION
```

#### 3. Build & Push Container Images

```bash
# Build and push backend image
az acr build --registry $ACR_NAME --image liu-backend:latest .

# Build and push frontend image
az acr build --registry $ACR_NAME --image liu-frontend:latest ./Life-Insurance-Underwriting
```

#### 4. Deploy Backend API

> The backend container runs `run_api.py` (FastAPI server on port 8000).  
> The `Dockerfile` in the root starts it with: `CMD ["python", "run_api.py"]`

```bash
ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --query loginServer -o tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query passwords[0].value -o tsv)

az containerapp create \
  --name $BACKEND_APP \
  --resource-group $RESOURCE_GROUP \
  --environment $ENVIRONMENT \
  --image "$ACR_LOGIN_SERVER/liu-backend:latest" \
  --registry-server $ACR_LOGIN_SERVER \
  --registry-username $ACR_NAME \
  --registry-password $ACR_PASSWORD \
  --target-port 8000 \
  --ingress external \
  --min-replicas 1 \
  --max-replicas 3 \
  --cpu 1.0 \
  --memory 2.0Gi \
  --env-vars \
    AZURE_OPENAI_ENDPOINT="https://your-openai.openai.azure.com/" \
    AZURE_OPENAI_KEY="your-key" \
    AZURE_OPENAI_VERSION="2024-10-21" \
    AZURE_OPENAI_MODEL="gpt-4" \
    AZURE_OPENAI_DEPLOYMENT="gpt-4"
```

#### 5. Deploy Frontend

```bash
BACKEND_URL=$(az containerapp show --name $BACKEND_APP --resource-group $RESOURCE_GROUP --query properties.configuration.ingress.fqdn -o tsv)

az containerapp create \
  --name $FRONTEND_APP \
  --resource-group $RESOURCE_GROUP \
  --environment $ENVIRONMENT \
  --image "$ACR_LOGIN_SERVER/liu-frontend:latest" \
  --registry-server $ACR_LOGIN_SERVER \
  --registry-username $ACR_NAME \
  --registry-password $ACR_PASSWORD \
  --target-port 80 \
  --ingress external \
  --min-replicas 1 \
  --max-replicas 3 \
  --env-vars \
    VITE_API_BASE_URL="https://$BACKEND_URL"
```

#### 6. Verify Deployment

```bash
# Get the deployed URLs
echo "Backend:  https://$(az containerapp show --name $BACKEND_APP --resource-group $RESOURCE_GROUP --query properties.configuration.ingress.fqdn -o tsv)"
echo "Frontend: https://$(az containerapp show --name $FRONTEND_APP --resource-group $RESOURCE_GROUP --query properties.configuration.ingress.fqdn -o tsv)"

# Test backend health
curl https://<backend-fqdn>/api/v1/underwriting/health
```

### Azure App Service

See [AZURE_DEPLOYMENT.md](AZURE_DEPLOYMENT.md) for step-by-step App Service deployment via the Azure Portal.

---

## 🔌 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/docs` | GET | Interactive API documentation (Swagger) |
| `/api/v1/underwriting/health` | GET | Health check |
| `/api/v1/underwriting/process` | POST | Process an underwriting application |
| `/api/v1/underwriting/process/stream` | POST | Stream agent outputs via SSE |
| `/api/v1/underwriting/ws/{client_id}` | WS | WebSocket for realtime updates |
| `/api/v1/underwriting/agents` | GET | List available AI agents |
| `/api/v1/underwriting/demo` | POST | Run demo with sample data |

---

## ⚠️ Important Disclaimer

### This System:
- ✅ **Provides recommendations** - not final decisions
- ✅ **Assists professionals** - doesn't replace them
- ✅ **Requires review** - by licensed underwriters
- ✅ **Supports decisions** - with detailed analysis

**Final Authority:** Licensed underwriting professionals retain full responsibility for all underwriting decisions.

---

## 🤝 Contributing

Contributions welcome! Fork the repo, create a branch, and submit a PR.

