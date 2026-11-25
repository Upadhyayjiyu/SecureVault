import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "SecureVault"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Database
    MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    MONGO_DB_NAME: str = os.getenv("MONGO_DB_NAME", "securevault")
    
    # Security
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super-secret-vault-key-change-in-production-2026")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    
    # Scanner Limits
    MAX_FILE_SIZE_MB: int = 10
    MAX_FILE_SIZE_BYTES: int = 10 * 1024 * 1024
    
    # Seed Admin
    ADMIN_EMAIL: str = "admin@securevault.local"
    ADMIN_PASSWORD: str = "ChangeMe123!"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
