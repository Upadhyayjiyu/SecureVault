import re
import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from bson import ObjectId

from app.database import get_database
from app.middleware.auth import get_current_admin
from app.schemas.admin import (
    AdminStatsOut, RuleCreate, RuleUpdate, DetectionRuleOut, UserStatusUpdate
)
from app.schemas.auth import UserOut
from app.services.audit_service import log_audit_event
from app.scanner.patterns import DEFAULT_DETECTION_PATTERNS

router = APIRouter(prefix="/admin", tags=["Admin"], dependencies=[Depends(get_current_admin)])

@router.get("/stats", response_model=AdminStatsOut)
async def get_admin_stats():
    """Retrieve global platform security metrics and analytics."""
    db = get_database()
    
    total_users = await db.users.count_documents({})
    total_scans = await db.scans.count_documents({})
    critical_scans = await db.scans.count_documents({"risk_level": "CRITICAL"})
    high_risk_scans = await db.scans.count_documents({"risk_level": "HIGH"})
    total_findings = await db.findings.count_documents({})

    # Aggregate findings by type
    pipeline_type = [
        {"$group": {"_id": "$type", "count": {"$sum": 1}}}
    ]
    type_res = await db.findings.aggregate(pipeline_type).to_list(100)
    findings_by_type = {item["_id"]: item["count"] for item in type_res}

    # Aggregate findings by severity
    pipeline_sev = [
        {"$group": {"_id": "$severity", "count": {"$sum": 1}}}
    ]
    sev_res = await db.findings.aggregate(pipeline_sev).to_list(10)
    findings_by_severity = {item["_id"]: item["count"] for item in sev_res}

    # Fetch 10 recent audit log activities
    activity_cursor = db.audit_logs.find().sort("created_at", -1).limit(10)
    activities = await activity_cursor.to_list(10)
    recent_activity = []
    for a in activities:
        recent_activity.append({
            "id": str(a["_id"]),
            "action": a.get("action", ""),
            "user_email": a.get("user_email", "SYSTEM"),
            "status": a.get("status", "SUCCESS"),
            "created_at": a.get("created_at", datetime.utcnow()).strftime("%Y-%m-%d %H:%M:%S")
        })

    return AdminStatsOut(
        total_users=total_users,
        total_scans=total_scans,
        critical_scans=critical_scans,
        high_risk_scans=high_risk_scans,
        total_findings=total_findings,
        findings_by_type=findings_by_type,
        findings_by_severity=findings_by_severity,
        recent_activity=recent_activity
    )

@router.get("/users", response_model=List[UserOut])
async def list_users(search: Optional[str] = None):
    """Retrieve list of registered users."""
    db = get_database()
    query = {}
    if search:
        query = {
            "$or": [
                {"name": {"$regex": search, "$options": "i"}},
                {"email": {"$regex": search, "$options": "i"}}
            ]
        }
        
    cursor = db.users.find(query).sort("created_at", -1)
    users = await cursor.to_list(500)
    
    res = []
    for u in users:
        res.append(UserOut(
            id=str(u["_id"]),
            name=u["name"],
            email=u["email"],
            role=u.get("role", "USER"),
            status=u.get("status", "active"),
            created_at=u["created_at"],
            last_login=u.get("last_login")
        ))
    return res

@router.patch("/users/{user_id}/status", response_model=UserOut)
async def update_user_status(
    user_id: str,
    status_in: UserStatusUpdate,
    request: Request,
    admin_user: dict = Depends(get_current_admin)
):
    """Toggle user account status between active and disabled."""
    db = get_database()
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="User not found.")

    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if user.get("role") == "ADMIN" and status_in.status == "disabled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot disable an administrator account."
        )

    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"status": status_in.status, "updated_at": datetime.utcnow()}}
    )

    await log_audit_event(
        action="USER_STATUS_CHANGED",
        user_id=admin_user["id"],
        user_email=admin_user["email"],
        ip_address=request.client.host if request.client else None,
        status="SUCCESS",
        details={"target_user_id": user_id, "new_status": status_in.status}
    )

    updated_user = await db.users.find_one({"_id": ObjectId(user_id)})
    return UserOut(
        id=str(updated_user["_id"]),
        name=updated_user["name"],
        email=updated_user["email"],
        role=updated_user.get("role", "USER"),
        status=updated_user.get("status", "active"),
        created_at=updated_user["created_at"],
        last_login=updated_user.get("last_login")
    )

@router.get("/rules", response_model=List[DetectionRuleOut])
async def get_rules():
    """List detection rules."""
    db = get_database()
    cursor = db.detection_rules.find()
    rules = await cursor.to_list(100)
    
    # If detection rules collection is empty, seed defaults
    if not rules:
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
        cursor = db.detection_rules.find()
        rules = await cursor.to_list(100)

    res = []
    for r in rules:
        res.append(DetectionRuleOut(
            id=str(r["_id"]),
            rule_id=r["rule_id"],
            type=r["type"],
            category=r["category"],
            regex=r["regex"],
            severity=r["severity"],
            status=r.get("status", "enabled"),
            is_custom=r.get("is_custom", False),
            recommendation=r["recommendation"]
        ))
    return res

@router.post("/rules", response_model=DetectionRuleOut, status_code=status.HTTP_201_CREATED)
async def create_custom_rule(
    rule_in: RuleCreate,
    request: Request,
    admin_user: dict = Depends(get_current_admin)
):
    """Add custom regex detection rule."""
    # Validate regex pattern safety
    try:
        re.compile(rule_in.regex)
    except re.error as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid regular expression syntax: {str(e)}"
        )

    db = get_database()
    rule_id = f"custom_{uuid.uuid4().hex[:8]}"
    
    rule_doc = {
        "rule_id": rule_id,
        "type": rule_in.type.upper(),
        "category": rule_in.category,
        "regex": rule_in.regex,
        "severity": rule_in.severity,
        "status": "enabled",
        "is_custom": True,
        "recommendation": rule_in.recommendation,
        "created_at": datetime.utcnow()
    }

    result = await db.detection_rules.insert_one(rule_doc)
    
    await log_audit_event(
        action="DETECTION_RULE_CREATED",
        user_id=admin_user["id"],
        user_email=admin_user["email"],
        ip_address=request.client.host if request.client else None,
        status="SUCCESS",
        details={"rule_type": rule_in.type}
    )

    return DetectionRuleOut(
        id=str(result.inserted_id),
        rule_id=rule_id,
        type=rule_doc["type"],
        category=rule_doc["category"],
        regex=rule_doc["regex"],
        severity=rule_doc["severity"],
        status="enabled",
        is_custom=True,
        recommendation=rule_doc["recommendation"]
    )

@router.patch("/rules/{rule_id}", response_model=DetectionRuleOut)
async def update_rule(
    rule_id: str,
    rule_update: RuleUpdate,
    request: Request,
    admin_user: dict = Depends(get_current_admin)
):
    """Update detection rule status, severity, or pattern."""
    db = get_database()
    try:
        rule = await db.detection_rules.find_one({
            "$or": [{"rule_id": rule_id}, {"_id": ObjectId(rule_id)}]
        })
    except Exception:
        rule = await db.detection_rules.find_one({"rule_id": rule_id})

    if not rule:
        raise HTTPException(status_code=404, detail="Detection rule not found.")

    update_dict = {}
    if rule_update.status is not None:
        update_dict["status"] = rule_update.status
    if rule_update.severity is not None:
        update_dict["severity"] = rule_update.severity
    if rule_update.regex is not None:
        try:
            re.compile(rule_update.regex)
            update_dict["regex"] = rule_update.regex
        except re.error as e:
            raise HTTPException(status_code=400, detail=f"Invalid regex: {str(e)}")
    if rule_update.recommendation is not None:
        update_dict["recommendation"] = rule_update.recommendation

    if update_dict:
        await db.detection_rules.update_one({"_id": rule["_id"]}, {"$set": update_dict})

    await log_audit_event(
        action="DETECTION_RULE_UPDATED",
        user_id=admin_user["id"],
        user_email=admin_user["email"],
        ip_address=request.client.host if request.client else None,
        status="SUCCESS",
        details={"rule_id": rule_id, "updates": update_dict}
    )

    updated_rule = await db.detection_rules.find_one({"_id": rule["_id"]})
    return DetectionRuleOut(
        id=str(updated_rule["_id"]),
        rule_id=updated_rule["rule_id"],
        type=updated_rule["type"],
        category=updated_rule["category"],
        regex=updated_rule["regex"],
        severity=updated_rule["severity"],
        status=updated_rule.get("status", "enabled"),
        is_custom=updated_rule.get("is_custom", False),
        recommendation=updated_rule["recommendation"]
    )

@router.delete("/rules/{rule_id}")
async def delete_custom_rule(
    rule_id: str,
    request: Request,
    admin_user: dict = Depends(get_current_admin)
):
    """Delete a custom rule."""
    db = get_database()
    try:
        rule = await db.detection_rules.find_one({
            "$or": [{"rule_id": rule_id}, {"_id": ObjectId(rule_id)}]
        })
    except Exception:
        rule = await db.detection_rules.find_one({"rule_id": rule_id})

    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found.")

    if not rule.get("is_custom", False):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete built-in system rules. Disable it instead."
        )

    await db.detection_rules.delete_one({"_id": rule["_id"]})
    await log_audit_event(
        action="DETECTION_RULE_DELETED",
        user_id=admin_user["id"],
        user_email=admin_user["email"],
        ip_address=request.client.host if request.client else None,
        status="SUCCESS",
        details={"rule_id": rule_id}
    )
    return {"message": "Custom detection rule deleted."}

@router.get("/audit-logs")
async def get_audit_logs(limit: int = 100):
    """Retrieve security audit logs."""
    db = get_database()
    cursor = db.audit_logs.find().sort("created_at", -1).limit(limit)
    logs = await cursor.to_list(limit)
    
    res = []
    for l in logs:
        res.append({
            "id": str(l["_id"]),
            "action": l.get("action", ""),
            "user_id": l.get("user_id"),
            "user_email": l.get("user_email", "SYSTEM"),
            "ip_address": l.get("ip_address", "127.0.0.1"),
            "status": l.get("status", "SUCCESS"),
            "details": l.get("details", {}),
            "created_at": l.get("created_at", datetime.utcnow()).strftime("%Y-%m-%d %H:%M:%S")
        })
    return res
