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
git clone https://github.com/Kushikote/Life-Insurance-Underwriting.git
cd Life-Insurance-Underwriting

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

**Backend (Process Applications):**
```bash
python run.py
```

**Frontend (View Dashboard):**
```bash
cd Life-Insurance-Underwriting
npm run dev
```

Opens at **http://localhost:3001**

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

