# 🏗️ System Architecture

Simple overview of how the system works.

---

## What's Inside

### Backend (Python)
- Reads medical reports
- 5 AI agents analyze data
- Calculates risk and premiums
- Generates reports

### Frontend (React)
- Dashboard to view results
- Shows agent workflows
- Displays reports

---

## How It Works

```
1. Upload application + medical images
        ↓
2. Extract data from images
        ↓
3. 5 AI agents analyze
        ↓
4. Calculate risk & premium
        ↓
5. Generate reports
        ↓
6. View in dashboard
```

---

## The 5 AI Agents

1. **Medical Reviewer** - Reads medical reports
2. **Fraud Detector** - Checks for fraud
3. **Risk Assessor** - Calculates risk
4. **Premium Calculator** - Calculates premium
5. **Decision Support** - Makes recommendation

---

## Tech Used

**Backend:**
- Python 3.9+
- Azure OpenAI (GPT-4)
- AutoGen (agent framework)

**Frontend:**
- React 19
- TypeScript
- TailwindCSS

---

## File Structure

```
Life-Insurance-Underwriting/
├── src/underwriting/          # Python backend
│   ├── core/                  # Main system
│   ├── agents/                # 5 AI agents
│   ├── analyzers/             # Medical & fraud
│   └── engines/               # Risk & premium
│
├── Life-Insurance-Underwriting/ # React frontend
│   └── src/components/        # UI components
│
├── data/                      # Input data
│   ├── sample/                # Sample files
│   └── medical_images/        # Medical images
│
├── outputs/reports/           # Generated reports
└── docs/                      # Documentation
```

---

## Data Flow

**Input → Processing → Output**

1. **Input**: Application JSON + medical images
2. **Processing**: AI agents analyze everything
3. **Output**: JSON reports + Dashboard view

---

## Security

- Medical data never saved to git
- Credentials in `.env` file
- Azure secure storage
- Complete audit trails

---

**That's it! Simple and straightforward.**
