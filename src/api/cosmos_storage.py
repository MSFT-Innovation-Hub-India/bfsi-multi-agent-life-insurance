"""
Cosmos DB Storage Service
=========================

Service for storing and retrieving underwriting agent results in Azure Cosmos DB.
The UI retrieval remains unchanged - this only handles API-side storage.

Supports both Managed Identity (DefaultAzureCredential) and key-based authentication.
"""

import logging
import os
from datetime import datetime
from typing import Dict, Any, Optional, List
from azure.cosmos import CosmosClient, PartitionKey, exceptions
from azure.identity import DefaultAzureCredential

logger = logging.getLogger(__name__)


class CosmosStorageService:
    """
    Service for storing underwriting results in Azure Cosmos DB.
    
    This service handles:
    - Storing complete underwriting workflow results
    - Storing individual agent analysis results
    - Retrieving results by application ID
    
    Authentication:
    - Uses Managed Identity (DefaultAzureCredential) by default
    - Falls back to key-based auth if AZURE_COSMOS_KEY is set
    
    Note: UI retrieval is NOT affected by this service. The UI continues
    to load data from its existing sources (JSON files/blob storage).
    """
    
    def __init__(self):
        """Initialize Cosmos DB connection"""
        self.endpoint = os.getenv('AZURE_COSMOS_ENDPOINT', 'https://fsiauto.documents.azure.com:443/')
        self.key = os.getenv('AZURE_COSMOS_KEY', '')  # Optional - uses managed identity if not set
        self.database_name = os.getenv('AZURE_COSMOS_DATABASE', 'underwriting')
        self.container_name = os.getenv('AZURE_COSMOS_CONTAINER', 'agent_results')
        
        self.client: Optional[CosmosClient] = None
        self.database = None
        self.container = None
        self._initialized = False
        
        # Try to initialize connection
        if self.endpoint:
            self._initialize_connection()
        else:
            logger.warning(
                "⚠️ Cosmos DB endpoint not configured. "
                "Set AZURE_COSMOS_ENDPOINT environment variable. "
                "Agent results will NOT be stored in Cosmos DB."
            )
    
    def _initialize_connection(self):
        """Initialize connection to Cosmos DB using Managed Identity or key"""
        try:
            if self.key:
                # Use key-based authentication
                logger.info("🔑 Using key-based authentication for Cosmos DB")
                self.client = CosmosClient(self.endpoint, self.key)
            else:
                # Use Managed Identity (DefaultAzureCredential)
                logger.info("🔐 Using Managed Identity for Cosmos DB authentication")
                credential = DefaultAzureCredential()
                self.client = CosmosClient(self.endpoint, credential=credential)
            
            # Get existing database (don't try to create - requires control plane permissions)
            self.database = self.client.get_database_client(self.database_name)
            
            # Get existing container (don't try to create - requires control plane permissions)
            self.container = self.database.get_container_client(self.container_name)
            
            # Verify connection by reading container properties
            self.container.read()
            
            self._initialized = True
            logger.info(f"✅ Cosmos DB initialized: {self.database_name}/{self.container_name}")
            
        except exceptions.CosmosResourceNotFoundError as e:
            logger.error(f"❌ Cosmos DB database or container not found. Please create them first: {e}")
            logger.info(f"💡 Run: az cosmosdb sql database create --account-name <account> --resource-group <rg> --name {self.database_name}")
            logger.info(f"💡 Run: az cosmosdb sql container create --account-name <account> --resource-group <rg> --database-name {self.database_name} --name {self.container_name} --partition-key-path /application_id")
            self._initialized = False
        except exceptions.CosmosHttpResponseError as e:
            logger.error(f"❌ Failed to initialize Cosmos DB: {e}")
            self._initialized = False
        except Exception as e:
            logger.error(f"❌ Unexpected error initializing Cosmos DB: {e}")
            self._initialized = False
    
    @property
    def is_available(self) -> bool:
        """Check if Cosmos DB storage is available"""
        return self._initialized and self.container is not None
    
    async def store_workflow_result(
        self,
        application_id: str,
        workflow_result: Dict[str, Any]
    ) -> Optional[str]:
        """
        Store complete workflow result in Cosmos DB.
        
        Args:
            application_id: The application ID (used as partition key)
            workflow_result: Complete workflow result from the orchestrator
            
        Returns:
            Document ID if successful, None if storage is unavailable or failed
        """
        if not self.is_available:
            logger.warning("Cosmos DB not available, skipping storage")
            return None
        
        try:
            # Create document
            document = {
                "id": f"{application_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}",
                "application_id": application_id,
                "document_type": "workflow_result",
                "created_at": datetime.now().isoformat(),
                "workflow_id": workflow_result.get("workflow_id"),
                "applicant_name": workflow_result.get("applicant_name"),
                "status": workflow_result.get("status"),
                "processing_timestamp": workflow_result.get("processing_timestamp"),
                "events": workflow_result.get("events", []),
                "agent_outputs": workflow_result.get("agent_outputs", {}),
                "final_decision": workflow_result.get("final_decision"),
            }
            
            # Store in Cosmos DB
            result = self.container.create_item(body=document)
            
            logger.info(f"✅ Stored workflow result for {application_id}: {result['id']}")
            return result['id']
            
        except exceptions.CosmosHttpResponseError as e:
            logger.error(f"❌ Failed to store workflow result: {e}")
            return None
        except Exception as e:
            logger.error(f"❌ Unexpected error storing workflow result: {e}")
            return None
    
    async def store_agent_result(
        self,
        application_id: str,
        agent_name: str,
        agent_role: str,
        analysis: str,
        status: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Optional[str]:
        """
        Store individual agent analysis result in Cosmos DB.
        
        Args:
            application_id: The application ID (partition key)
            agent_name: Name of the agent
            agent_role: Role/type of the agent
            analysis: The agent's analysis text
            status: Agent status (completed, error, etc.)
            metadata: Additional metadata
            
        Returns:
            Document ID if successful, None if storage is unavailable or failed
        """
        if not self.is_available:
            logger.warning("Cosmos DB not available, skipping agent result storage")
            return None
        
        try:
            # Create document
            document = {
                "id": f"{application_id}_{agent_name}_{datetime.now().strftime('%Y%m%d%H%M%S')}",
                "application_id": application_id,
                "document_type": "agent_result",
                "agent_name": agent_name,
                "agent_role": agent_role,
                "analysis": analysis,
                "status": status,
                "timestamp": datetime.now().isoformat(),
                "metadata": metadata or {}
            }
            
            # Store in Cosmos DB
            result = self.container.create_item(body=document)
            
            logger.info(f"✅ Stored agent result for {application_id}/{agent_name}: {result['id']}")
            return result['id']
            
        except exceptions.CosmosHttpResponseError as e:
            logger.error(f"❌ Failed to store agent result: {e}")
            return None
        except Exception as e:
            logger.error(f"❌ Unexpected error storing agent result: {e}")
            return None
    
    async def get_workflow_results(
        self,
        application_id: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Retrieve workflow results for an application.
        
        Note: This is for API/backend use only. The UI continues to use
        its existing data retrieval mechanism.
        
        Args:
            application_id: The application ID to query
            limit: Maximum number of results to return
            
        Returns:
            List of workflow result documents
        """
        if not self.is_available:
            logger.warning("Cosmos DB not available")
            return []
        
        try:
            query = (
                "SELECT * FROM c WHERE c.application_id = @app_id "
                "AND c.document_type = 'workflow_result' "
                "ORDER BY c.created_at DESC"
            )
            
            items = list(self.container.query_items(
                query=query,
                parameters=[{"name": "@app_id", "value": application_id}],
                max_item_count=limit
            ))
            
            return items
            
        except exceptions.CosmosHttpResponseError as e:
            logger.error(f"❌ Failed to query workflow results: {e}")
            return []
        except Exception as e:
            logger.error(f"❌ Unexpected error querying workflow results: {e}")
            return []
    
    async def get_agent_results(
        self,
        application_id: str,
        agent_name: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieve agent results for an application.
        
        Note: This is for API/backend use only. The UI continues to use
        its existing data retrieval mechanism.
        
        Args:
            application_id: The application ID to query
            agent_name: Optional filter by agent name
            
        Returns:
            List of agent result documents
        """
        if not self.is_available:
            logger.warning("Cosmos DB not available")
            return []
        
        try:
            if agent_name:
                query = (
                    "SELECT * FROM c WHERE c.application_id = @app_id "
                    "AND c.document_type = 'agent_result' "
                    "AND c.agent_name = @agent_name "
                    "ORDER BY c.timestamp DESC"
                )
                parameters = [
                    {"name": "@app_id", "value": application_id},
                    {"name": "@agent_name", "value": agent_name}
                ]
            else:
                query = (
                    "SELECT * FROM c WHERE c.application_id = @app_id "
                    "AND c.document_type = 'agent_result' "
                    "ORDER BY c.timestamp DESC"
                )
                parameters = [{"name": "@app_id", "value": application_id}]
            
            items = list(self.container.query_items(
                query=query,
                parameters=parameters
            ))
            
            return items
            
        except exceptions.CosmosHttpResponseError as e:
            logger.error(f"❌ Failed to query agent results: {e}")
            return []
        except Exception as e:
            logger.error(f"❌ Unexpected error querying agent results: {e}")
            return []


    # ========================================================================
    # Comprehensive Report Storage & Retrieval (for frontend dashboard)
    # ========================================================================

    async def store_report(
        self,
        application_id: str,
        report: Dict[str, Any]
    ) -> Optional[str]:
        """
        Store a comprehensive underwriting report in Cosmos DB.

        This is the full report structure that the frontend dashboard expects,
        including application_metadata, medical_extraction, premium_analysis,
        detailed_agent_responses, etc.

        Args:
            application_id: The application ID (partition key)
            report: Full comprehensive report dict

        Returns:
            Document ID if successful, None otherwise
        """
        if not self.is_available:
            logger.warning("Cosmos DB not available, skipping report storage")
            return None

        try:
            doc_id = f"report_{application_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
            document = {
                "id": doc_id,
                "application_id": application_id,
                "document_type": "comprehensive_report",
                "created_at": datetime.now().isoformat(),
                "report": report,
                # Denormalized fields for efficient querying
                "applicant_name": report.get("application_metadata", {}).get("applicant_name", ""),
                "final_decision": report.get("underwriting_decision", {}).get("final_decision", "pending"),
                "risk_category": report.get("medical_loading_analysis", {}).get("risk_category", ""),
                "total_final_premium": report.get("premium_analysis", {}).get("total_final_premium", 0),
            }

            result = self.container.create_item(body=document)
            logger.info(f"✅ Stored comprehensive report for {application_id}: {result['id']}")
            return result['id']

        except exceptions.CosmosHttpResponseError as e:
            logger.error(f"❌ Failed to store report: {e}")
            return None
        except Exception as e:
            logger.error(f"❌ Unexpected error storing report: {e}")
            return None

    async def get_reports_by_application(
        self,
        application_id: str
    ) -> List[Dict[str, Any]]:
        """
        Retrieve comprehensive reports for a specific application ID.

        Args:
            application_id: The application ID to query

        Returns:
            List of comprehensive report documents (most recent first)
        """
        if not self.is_available:
            logger.warning("Cosmos DB not available")
            return []

        try:
            query = (
                "SELECT * FROM c WHERE c.application_id = @app_id "
                "AND c.document_type = 'comprehensive_report' "
                "ORDER BY c.created_at DESC"
            )

            items = list(self.container.query_items(
                query=query,
                parameters=[{"name": "@app_id", "value": application_id}],
            ))

            return items

        except exceptions.CosmosHttpResponseError as e:
            logger.error(f"❌ Failed to query reports for {application_id}: {e}")
            return []
        except Exception as e:
            logger.error(f"❌ Unexpected error querying reports: {e}")
            return []

    async def get_all_reports(self) -> List[Dict[str, Any]]:
        """
        Retrieve all comprehensive reports (one per application, most recent).

        Returns a summary list suitable for the dashboard applications page.
        """
        if not self.is_available:
            logger.warning("Cosmos DB not available")
            return []

        try:
            query = (
                "SELECT * FROM c "
                "WHERE c.document_type = 'comprehensive_report' "
                "ORDER BY c.created_at DESC"
            )

            items = list(self.container.query_items(
                query=query,
                enable_cross_partition_query=True,
            ))

            # Deduplicate: keep only the most recent report per application_id
            seen: Dict[str, Dict[str, Any]] = {}
            for item in items:
                app_id = item.get("application_id", "")
                if app_id not in seen:
                    seen[app_id] = item

            return list(seen.values())

        except exceptions.CosmosHttpResponseError as e:
            logger.error(f"❌ Failed to query all reports: {e}")
            return []
        except Exception as e:
            logger.error(f"❌ Unexpected error querying all reports: {e}")
            return []


# Global instance (lazy initialization)
_cosmos_storage: Optional[CosmosStorageService] = None


def get_cosmos_storage() -> CosmosStorageService:
    """Get or create the Cosmos storage service instance"""
    global _cosmos_storage
    if _cosmos_storage is None:
        _cosmos_storage = CosmosStorageService()
    return _cosmos_storage
