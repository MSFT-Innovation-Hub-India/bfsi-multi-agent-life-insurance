"""Quick script to verify data in Cosmos DB"""
from azure.cosmos import CosmosClient
from azure.identity import DefaultAzureCredential

cred = DefaultAzureCredential()
client = CosmosClient("https://fsiauto.documents.azure.com:443/", credential=cred)
container = client.get_database_client("underwriting").get_container_client("agent_results")

items = list(container.query_items(
    "SELECT c.id, c.application_id, c.document_type, c.created_at, c.applicant_name FROM c ORDER BY c.created_at DESC",
    enable_cross_partition_query=True,
    max_item_count=10
))

print(f"\n{'='*60}")
print(f"Found {len(items)} documents in Cosmos DB")
print(f"{'='*60}")
for i in items:
    print(f"  - {i['id']} | type={i.get('document_type')} | app={i.get('application_id')} | {i.get('created_at','')}")
print(f"{'='*60}")
