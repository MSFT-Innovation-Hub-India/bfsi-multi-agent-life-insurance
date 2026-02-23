"""
Seed Cosmos DB with comprehensive underwriting reports.
=======================================================

Pushes the 3 static JSON reports (Menna T, Rahul V, Ananya R) plus
the dashboard summary data into Cosmos DB so the frontend can
retrieve everything from the API instead of static files.

Usage:
    python scripts/seed_cosmos_reports.py
"""

import json
import sys
from pathlib import Path
from datetime import datetime

# Add src to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'src'))

from azure.cosmos import CosmosClient
from azure.identity import DefaultAzureCredential

# ── Configuration ──────────────────────────────────────────────────
ENDPOINT = "https://fsiauto.documents.azure.com:443/"
DATABASE = "underwriting"
CONTAINER = "agent_results"

# ── Report files and their correct application IDs ─────────────────
REPORTS = [
    {
        "file": "Life-Insurance-Underwriting/src/comprehensive_underwriting_report_LI2025090001_20251002_003016.json",
        "application_id": "LI2025090001",  # Menna T
    },
    {
        "file": "Life-Insurance-Underwriting/src/comprehensive_underwriting_report_LI2025090001_20251002_003017.json",
        "application_id": "LI2025090004",  # Rahul V (mapped as 004 in dashboard)
    },
    {
        "file": "Life-Insurance-Underwriting/src/comprehensive_underwriting_report_LI2025090001_20251002_003018.json",
        "application_id": "LI2025090003",  # Ananya R
    },
]

ROOT = Path(__file__).resolve().parent.parent


def main():
    print("🚀 Seeding Cosmos DB with comprehensive underwriting reports")
    print("=" * 60)

    # Connect using DefaultAzureCredential (Azure CLI login)
    cred = DefaultAzureCredential()
    client = CosmosClient(ENDPOINT, credential=cred)
    container = client.get_database_client(DATABASE).get_container_client(CONTAINER)

    # Verify connection
    container.read()
    print(f"✅ Connected to {DATABASE}/{CONTAINER}\n")

    stored = 0
    for entry in REPORTS:
        filepath = ROOT / entry["file"]
        app_id = entry["application_id"]

        if not filepath.exists():
            print(f"❌ File not found: {filepath}")
            continue

        with open(filepath, "r", encoding="utf-8") as f:
            report = json.load(f)

        # Ensure application_id in the report matches our mapping
        report.setdefault("application_metadata", {})["application_id"] = app_id
        applicant = report.get("application_metadata", {}).get("applicant_name", "Unknown")

        # Check if report already exists for this application
        existing = list(container.query_items(
            query="SELECT c.id FROM c WHERE c.application_id = @app_id AND c.document_type = 'comprehensive_report'",
            parameters=[{"name": "@app_id", "value": app_id}],
        ))

        if existing:
            print(f"⏭️  {app_id} ({applicant}) — already exists ({len(existing)} docs), skipping")
            continue

        # Build document
        now = datetime.now()
        document = {
            "id": f"report_{app_id}_{now.strftime('%Y%m%d%H%M%S')}",
            "application_id": app_id,
            "document_type": "comprehensive_report",
            "created_at": now.isoformat(),
            "report": report,
            # Denormalized fields for fast queries
            "applicant_name": applicant,
            "final_decision": report.get("underwriting_decision", {}).get("final_decision", "pending"),
            "risk_category": report.get("medical_loading_analysis", {}).get("risk_category", ""),
            "total_final_premium": report.get("premium_analysis", {}).get("total_final_premium", 0),
        }

        result = container.create_item(body=document)
        print(f"✅ Stored {app_id} ({applicant}) → {result['id']}")
        stored += 1

    print(f"\n{'=' * 60}")
    print(f"Done! Stored {stored} new report(s) in Cosmos DB.")

    # Verify final state
    all_reports = list(container.query_items(
        query="SELECT c.id, c.application_id, c.applicant_name, c.final_decision, c.document_type FROM c WHERE c.document_type = 'comprehensive_report'",
        enable_cross_partition_query=True,
    ))
    print(f"\n📊 Total comprehensive reports in Cosmos DB: {len(all_reports)}")
    for r in all_reports:
        print(f"   {r['application_id']} | {r.get('applicant_name','')} | decision={r.get('final_decision','')}")


if __name__ == "__main__":
    main()
