from typing import List, Dict, Any

SEVERITY_WEIGHTS = {
    "CRITICAL": 95,
    "HIGH": 75,
    "MEDIUM": 45,
    "LOW": 15
}

TYPE_WEIGHTS = {
    "PRIVATE_KEY": 100,
    "DATABASE_CREDENTIAL": 100,
    "CLOUD_CREDENTIAL": 100,
    "API_KEY": 90,
    "JWT": 85,
    "PASSWORD": 80,
    "CREDIT_CARD": 70,
    "PHONE": 15,
    "EMAIL": 10,
    "IP_ADDRESS": 10
}

def calculate_risk_score(findings: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Computes overall document risk score (0-100) and risk level classification.
    """
    if not findings:
        return {
            "risk_score": 0,
            "risk_level": "SAFE",
            "finding_count": 0,
            "counts": {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
        }

    counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
    max_single_weight = 0
    total_weighted_points = 0.0

    for f in findings:
        sev = f.get("severity", "LOW")
        f_type = f.get("type", "")
        conf = f.get("confidence", 0.8)
        
        counts[sev] = counts.get(sev, 0) + 1
        
        # Base weight from type or severity
        type_weight = TYPE_WEIGHTS.get(f_type, SEVERITY_WEIGHTS.get(sev, 15))
        effective_weight = type_weight * conf
        
        if effective_weight > max_single_weight:
            max_single_weight = effective_weight
            
        # Accumulate secondary finding points
        total_weighted_points += (effective_weight * 0.15)

    # Combined score starts at highest single threat + logarithmic bonus from additional findings
    raw_score = max_single_weight + min(25.0, total_weighted_points)
    final_score = min(100, int(round(raw_score)))
    
    # Classify Risk Level
    if final_score <= 20:
        level = "SAFE"
    elif final_score <= 40:
        level = "LOW"
    elif final_score <= 60:
        level = "MEDIUM"
    elif final_score <= 80:
        level = "HIGH"
    else:
        level = "CRITICAL"
        
    return {
        "risk_score": final_score,
        "risk_level": level,
        "finding_count": len(findings),
        "counts": counts
    }
