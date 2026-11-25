from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

class RuleCreate(BaseModel):
    type: str = Field(..., min_length=3, max_length=50)
    category: str = Field(..., min_length=2, max_length=50)
    regex: str = Field(..., min_length=2)
    severity: str = Field(..., pattern="^(CRITICAL|HIGH|MEDIUM|LOW)$")
    recommendation: str = Field(..., min_length=5)

class RuleUpdate(BaseModel):
    status: Optional[str] = Field(None, pattern="^(enabled|disabled)$")
    severity: Optional[str] = Field(None, pattern="^(CRITICAL|HIGH|MEDIUM|LOW)$")
    regex: Optional[str] = None
    recommendation: Optional[str] = None

class DetectionRuleOut(BaseModel):
    id: str
    rule_id: str
    type: str
    category: str
    regex: str
    severity: str
    status: str
    is_custom: bool
    recommendation: str

class UserStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(active|disabled)$")

class AdminStatsOut(BaseModel):
    total_users: int
    total_scans: int
    critical_scans: int
    high_risk_scans: int
    total_findings: int
    findings_by_type: Dict[str, int]
    findings_by_severity: Dict[str, int]
    recent_activity: List[Dict[str, Any]]
