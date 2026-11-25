from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
import logging

logger = logging.getLogger(__name__)

class Database:
    client: AsyncIOMotorClient = None
    db = None

db_instance = Database()

async def connect_to_mongo():
    logger.info(f"Connecting to MongoDB at {settings.MONGO_URI}...")
    db_instance.client = AsyncIOMotorClient(settings.MONGO_URI)
    db_instance.db = db_instance.client[settings.MONGO_DB_NAME]
    
    # Create indexes for fast queries
    await db_instance.db.users.create_index("email", unique=True)
    await db_instance.db.scans.create_index("user_id")
    await db_instance.db.scans.create_index("created_at")
    await db_instance.db.findings.create_index("scan_id")
    await db_instance.db.findings.create_index("user_id")
    await db_instance.db.detection_rules.create_index("rule_id", unique=True)
    await db_instance.db.audit_logs.create_index("created_at")
    
    logger.info("MongoDB connection and index creation complete.")

async def close_mongo_connection():
    if db_instance.client:
        db_instance.client.close()
        logger.info("MongoDB connection closed.")

def get_database():
    return db_instance.db
