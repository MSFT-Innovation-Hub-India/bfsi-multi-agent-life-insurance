# Azure App Service Deployment Guide

## Prerequisites

- Azure subscription
- Your code zipped or in a Git repository

---

## Step-by-Step Portal Deployment

### Step 1: Create App Service

1. Go to [Azure Portal](https://portal.azure.com)
2. Click **"Create a resource"** → Search **"Web App"** → Click **Create**
3. Fill in the details:
   - **Subscription**: Select your subscription
   - **Resource Group**: Create new or use existing
   - **Name**: `liu-underwriting-api` (must be globally unique)
   - **Publish**: **Code**
   - **Runtime stack**: **Python 3.11**
   - **Operating System**: **Linux**
   - **Region**: Choose nearest region
   - **Pricing Plan**: Select B1 or higher (Free/F1 doesn't support always-on)

4. Click **Review + Create** → **Create**

---

### Step 2: Configure Application Settings

After the App Service is created:

1. Go to your App Service → **Settings** → **Configuration**

2. Under **Application settings**, click **"+ New application setting"** and add:

   | Name | Value |
   |------|-------|
   | `AZURE_OPENAI_ENDPOINT` | `https://your-openai.openai.azure.com/` |
   | `AZURE_OPENAI_KEY` | `your-azure-openai-api-key` |
   | `AZURE_OPENAI_VERSION` | `2024-02-15-preview` |
   | `MODEL_NAME` | `gpt-4` |
   | `SCM_DO_BUILD_DURING_DEPLOYMENT` | `true` |

3. Under **General settings**:
   - **Startup Command**: 
     ```
     gunicorn --bind=0.0.0.0:8000 --timeout 600 --workers 4 --worker-class uvicorn.workers.UvicornWorker src.api.app:app
     ```
   - **Always On**: Enable (requires B1 or higher)

4. Click **Save**

---

### Step 3: Deploy Your Code

#### Option A: Deploy via ZIP (Easiest)

1. Zip your project folder (include all files at root level):
   ```
   LIU.zip
   ├── requirements.txt
   ├── run_api.py
   ├── src/
   │   ├── __init__.py
   │   ├── api/
   │   │   ├── __init__.py
   │   │   ├── app.py
   │   │   ├── routes.py
   │   │   └── streaming_orchestrator.py
   │   └── underwriting/
   ├── data/
   └── ...
   ```

2. In Azure Portal:
   - Go to your App Service → **Deployment Center**
   - Under **Settings**, choose **Local Git** or **GitHub** or use **FTPS**
   
   **For ZIP deploy:**
   - Go to **Advanced Tools** (Kudu) → Click **Go →**
   - In Kudu, go to **Tools** → **Zip Push Deploy**
   - Drag and drop your ZIP file

#### Option B: Deploy via GitHub

1. Go to **Deployment Center** in your App Service
2. Select **GitHub** as source
3. Authorize and select your repository
4. Choose branch (e.g., `main`)
5. Click **Save**

#### Option C: Deploy via VS Code

1. Install **Azure App Service** extension in VS Code
2. Sign in to Azure
3. Right-click your project → **Deploy to Web App**
4. Select your App Service

---

### Step 4: Verify Deployment

After deployment completes:

1. Go to your App Service **Overview**
2. Click the **URL** (e.g., `https://liu-underwriting-api.azurewebsites.net`)
3. Test these endpoints:
   - **Root**: `https://your-app.azurewebsites.net/`
   - **Health**: `https://your-app.azurewebsites.net/api/v1/underwriting/health`
   - **Docs**: `https://your-app.azurewebsites.net/docs`

---

## Troubleshooting

### Check Logs

1. Go to App Service → **Monitoring** → **Log stream**
2. Or go to **Diagnose and solve problems**

### Common Issues

| Issue | Solution |
|-------|----------|
| 500 Error | Check logs, ensure all env variables are set |
| Module not found | Ensure `requirements.txt` is at root level |
| Timeout | Increase timeout in startup command |
| WebSocket not working | Enable WebSocket in App Service Configuration → General settings |

### Enable WebSockets

1. Go to **Configuration** → **General settings**
2. Set **Web sockets** to **On**
3. Save and restart

---

## CORS Configuration (If Needed)

Your frontend URL needs to be allowed. Update [src/api/app.py](src/api/app.py) for production:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-frontend-domain.com",
        "https://your-frontend.azurewebsites.net"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Scaling

For production workloads:
1. Go to **Scale up (App Service plan)** to increase resources
2. Go to **Scale out** to add more instances
3. Consider **B2** or **P1v2** for better performance

---

## Estimated Costs

| Plan | Monthly Cost (Approx) |
|------|----------------------|
| B1 (Basic) | ~$13 USD |
| B2 (Basic) | ~$26 USD |
| P1v2 (Premium) | ~$81 USD |

---

## Your API Endpoints After Deployment

| Endpoint | URL |
|----------|-----|
| API Docs | `https://your-app.azurewebsites.net/docs` |
| Health Check | `https://your-app.azurewebsites.net/api/v1/underwriting/health` |
| Process Application | `https://your-app.azurewebsites.net/api/v1/underwriting/process` |
| Stream (SSE) | `https://your-app.azurewebsites.net/api/v1/underwriting/process/stream` |
| WebSocket | `wss://your-app.azurewebsites.net/api/v1/underwriting/ws/{client_id}` |
