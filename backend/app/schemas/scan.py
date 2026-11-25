from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

class TextScanRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=100000)
    filename: Optional[str] = "Pasted_Text.txt"

class FindingOut(BaseModel):
    finding_id: str
    type: str
    category: str
    severity: str
    confidence: float
    masked_value: str
    line_number: int
    surrounding_context: str
    recommendation: str

class ScanOut(BaseModel):
    id: str
    user_id: str
    filename: str
    file_type: str
    risk_score: int
    risk_level: str
    finding_count: int
    created_at: datetime
    processing_time: str
    counts: Dict[str, int]
    findings: Optional[List[FindingOut]] = None
