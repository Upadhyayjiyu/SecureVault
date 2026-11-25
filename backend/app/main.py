import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

from app.config import settings
from app.database import connect_to_mongo, close_mongo_connection, get_database
from app.middleware.auth import hash_password
from app.scanner.patterns import DEFAULT_DETECTION_PATTERNS
from app.routes import auth, scans, admin, health

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("securevault")

async def seed_database():
    """Initializes default admin user and built-in detection rules if missing."""
    db = get_database()
    
    # 1. Seed Admin User
    admin = await db.users.find_one({"email": settings.ADMIN_EMAIL.lower()})
    if not admin:
        logger.info(f"Seeding default admin user ({settings.ADMIN_EMAIL})...")
        admin_doc = {
            "name": "SecureVault Administrator",
            "email": settings.ADMIN_EMAIL.lower(),
            "password_hash": hash_password(settings.ADMIN_PASSWORD),
            "role": "ADMIN",
            "status": "active",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "last_login": None
        }
        await db.users.insert_one(admin_doc)
        logger.info("Admin user created successfully.")

    # 2. Seed Default Detection Rules
    existing_rules_count = await db.detection_rules.count_documents({})
    if existing_rules_count == 0:
        logger.info("Seeding default detection rules into MongoDB...")
        for p in DEFAULT_DETECTION_PATTERNS:
            doc = {
                "rule_id": p["type"].lower(),
                "type": p["type"],
                "category": p["category"],
                "regex": p["regex"],
                "severity": p["severity"],
                "status": "enabled",
                "is_custom": False,
                "recommendation": p["recommendation"],
                "created_at": datetime.utcnow()
            }
            await db.detection_rules.insert_one(doc)
        logger.info("Default detection rules seeded successfully.")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting up SecureVault Backend...")
    await connect_to_mongo()
    await seed_database()
    yield
    # Shutdown
    logger.info("Shutting down SecureVault Backend...")
    await close_mongo_connection()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Personal Data Exposure & Secret Detection System",
    lifespan=lifespan
)

# CORS middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for dev flexibility
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(health.router, prefix=settings.API_V1_STR)
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(scans.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {
        "app": "SecureVault API",
        "status": "online",
        "docs_url": "/docs"
    }
