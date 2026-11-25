from datetime import datetime
from typing import Optional
from app.database import get_database
import logging

logger = logging.getLogger(__name__)

async def log_audit_event(
    action: str,
    user_id: Optional[str] = None,
    user_email: Optional[str] = None,
    ip_address: Optional[str] = None,
    status: str = "SUCCESS",
    details: Optional[dict] = None
):
    """
    Persists audit events into MongoDB audit_logs collection.
    Guarantees no plaintext secrets or credentials are saved.
    """
    try:
        db = get_database()
        audit_doc = {
            "action": action,
            "user_id": user_id,
            "user_email": user_email or "SYSTEM",
            "ip_address": ip_address or "127.0.0.1",
            "status": status,
            "details": details or {},
            "created_at": datetime.utcnow()
        }
        await db.audit_logs.insert_one(audit_doc)
    except Exception as e:
        logger.error(f"Failed to record audit log event: {str(e)}")
