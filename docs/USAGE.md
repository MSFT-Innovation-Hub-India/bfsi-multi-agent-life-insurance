# 🚀 Usage

How to run the system.

---

## Run It

### Backend (Process Applications)

```bash
python run.py
```

### Frontend (View Dashboard)

```bash
cd Life-Insurance-Underwriting
npm run dev
```

Opens at **http://localhost:3001**

---

## Process Your Own Application

### 1. Create Application JSON

Save as `data/sample/my_app.json`:

```json
{
  "personalInfo": {
    "name": "John Doe",
    "age": 35,
    "gender": "Male"
  },
  "insuranceCoverage": {
    "termLife": {
      "sumAssured": 10000000
    }
  },
  "applicationDetails": {
    "applicationNumber": "LI2025001"
  }
}
```

### 2. Add Medical Images

Put images in `data/medical_images/`:
- Blood reports
- X-rays
- ECG reports

Formats: PNG, JPG, PDF

### 3. Run Processing

```python
import asyncio
from src.underwriting.core.main_system import InsuranceUnderwritingSystem

async def process():
    system = InsuranceUnderwritingSystem()
    result = await system.process_complete_application(
        applicant_data_file='data/sample/my_app.json',
        medical_images_directory='data/medical_images'
    )
    print(f"Decision: {result['underwriting_decision']['final_decision']}")

asyncio.run(process())
```

---

## What You Get

### Reports Generated

All in `outputs/reports/`:

1. **JSON Report** - Complete data
2. **Text Report** - Easy to read summary
3. **Loading Report** - Medical condition details

### Dashboard View

Open **http://localhost:3001** to see:
- All applications
- Agent workflows
- Detailed analysis
- Risk breakdowns

---

## Quick Commands

### Backend
```bash
# Run system
python run.py

# Quick demo
python quick_start.py

# Run tests
pytest
```

### Frontend
```bash
# Dev mode
npm run dev

# Build
npm run build
```

---

## Recommendations

| Loading | Recommendation | Time |
|---------|---------------|------|
| 0-50% | ✅ Approve | 1 day |
| 51-150% | 📋 Review | 3 days |
| 151-250% | 📝 More Info | 7 days |
| >250% | ⚠️ High Risk | 2 days |

*Underwriters make final decisions*

---

## Problems?

**No data in dashboard**
```bash
# Run backend first
python run.py
```

**Port in use**
```bash
# Change port in vite.config.ts
```

**Azure API error**
```bash
# Check .env file
cat .env
```

---

**That's it! Start processing applications.**
