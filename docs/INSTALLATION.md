# 📦 Installation

Quick setup guide.

---

## What You Need

- Python 3.9+
- Node.js 18+
- Azure OpenAI API access

---

## Setup Steps

### 1. Get the Code

```bash
git clone https://github.com/MSFT-Innovation-Hub-India/bfsi-multi-agent-life-insurance.git
cd bfsi-multi-agent-life-insurance
```

### 2. Install Python Packages

```bash
pip install -r requirements.txt
```

### 3. Setup Environment

```bash
# Copy template
cp .env.example .env

# Edit .env and add your Azure credentials
```

Your `.env` should have:
```env
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_KEY=your-api-key
AZURE_OPENAI_VERSION=2024-10-21
AZURE_OPENAI_MODEL=gpt-4
AZURE_OPENAI_DEPLOYMENT=gpt-4
```

### 4. Install Frontend

```bash
cd Life-Insurance-Underwriting
npm install
```

---

## Test It Works

### Test Backend

```bash
python -c "from src.underwriting.core.main_system import InsuranceUnderwritingSystem; print('Works!')"
```

### Test Frontend

```bash
cd Life-Insurance-Underwriting
npm run build
```

---

## Common Problems

**"Module not found"**
```bash
pip install -r requirements.txt --force-reinstall
```

**"npm errors"**
```bash
cd Life-Insurance-Underwriting
npm install --legacy-peer-deps
```

**"No Azure credentials"**
- Check `.env` file exists
- Make sure all variables are filled
- No quotes around values

---

**Done! See [USAGE.md](USAGE.md) to run the system.**
