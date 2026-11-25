import re
import uuid
import logging
from typing import List, Dict, Any, Optional

from app.scanner.patterns import DEFAULT_DETECTION_PATTERNS, luhn_check
from app.scanner.entropy import is_high_entropy_secret, calculate_shannon_entropy
from app.scanner.risk_engine import calculate_risk_score
from app.utils.masking import mask_sensitive_value

logger = logging.getLogger(__name__)

def scan_text_content(
    text: str,
    custom_rules: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Main detection orchestrator scanning text line-by-line for sensitive data, PII, credentials,
    and high-entropy tokens. Raw secrets are NEVER returned unmasked.
    """
    if not text:
        return {
            "risk_score": 0,
            "risk_level": "SAFE",
            "finding_count": 0,
            "findings": [],
            "counts": {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
        }

    # Prepare active pattern list
    patterns = []
    
    # 1. Base patterns
    if custom_rules:
        # Override or extend with DB rules
        rule_map = {r["type"]: r for r in custom_rules if r.get("status") == "enabled"}
        for p in DEFAULT_DETECTION_PATTERNS:
            p_type = p["type"]
            if p_type in rule_map:
                override = rule_map[p_type]
                patterns.append({
                    "type": p_type,
                    "category": p["category"],
                    "regex": override.get("regex", p["regex"]),
                    "severity": override.get("severity", p["severity"]),
                    "base_confidence": p["base_confidence"],
                    "recommendation": p["recommendation"]
                })
            elif p_type not in [r["type"] for r in custom_rules]: # Not disabled explicitly
                patterns.append(p)
                
        # Add custom rules created by admin
        for r in custom_rules:
            if r.get("is_custom") and r.get("status") == "enabled":
                patterns.append({
                    "type": r.get("type", "CUSTOM_PATTERN"),
                    "category": r.get("category", "Custom Secret Rule"),
                    "regex": r.get("regex"),
                    "severity": r.get("severity", "HIGH"),
                    "base_confidence": 0.90,
                    "recommendation": r.get("recommendation", "Review custom pattern finding.")
                })
    else:
        patterns = DEFAULT_DETECTION_PATTERNS

    lines = text.splitlines()
    findings = []
    seen_matches = set() # Avoid exact duplicate findings on same line

    for line_idx, line in enumerate(lines, start=1):
        clean_line = line.strip()
        if not clean_line:
            continue

        for p in patterns:
            p_type = p["type"]
            regex_str = p["regex"]
            
            try:
                matches = re.finditer(regex_str, line)
            except re.error:
                continue

            for match in matches:
                matched_val = match.group(0).strip()
                # If regex has capture group, use group 1 for extraction if available
                if match.groups() and match.group(1):
                    raw_secret = match.group(1).strip()
                else:
                    raw_secret = matched_val
                    
                if not raw_secret or len(raw_secret) < 2:
                    continue

                # Credit card Luhn validation check
                if p_type == "CREDIT_CARD":
                    digits = re.sub(r"\D", "", raw_secret)
                    if not luhn_check(digits):
                        continue # Skip invalid card pattern

                # False positive check for emails / variables
                confidence = p["base_confidence"]
                
                # Check entropy for secret-like tokens
                if p_type in ["API_KEY", "PASSWORD", "CLOUD_CREDENTIAL", "CUSTOM_PATTERN"]:
                    entropy_val = calculate_shannon_entropy(raw_secret)
                    if entropy_val > 4.2:
                        confidence = min(0.99, confidence + 0.05)
                    elif len(raw_secret) > 15 and entropy_val < 2.0 and not re.search(r"password|secret", line, re.I):
                        # Very low entropy repetitive string, lower confidence
                        confidence = max(0.50, confidence - 0.20)

                # Dedup key
                dedup_key = f"{p_type}_{line_idx}_{raw_secret[:10]}"
                if dedup_key in seen_matches:
                    continue
                seen_matches.add(dedup_key)

                # Context snippet (masked)
                context_snippet = line
                masked_val = mask_sensitive_value(raw_secret, p_type)
                
                # Replace actual secret in context line snippet with masked value for safety
                safe_context = context_snippet.replace(raw_secret, masked_val)

                findings.append({
                    "finding_id": str(uuid.uuid4()),
                    "type": p_type,
                    "category": p["category"],
                    "severity": p["severity"],
                    "confidence": round(confidence, 2),
                    "masked_value": masked_val,
                    "line_number": line_idx,
                    "surrounding_context": safe_context[:200], # max 200 chars
                    "recommendation": p["recommendation"]
                })

    risk_meta = calculate_risk_score(findings)
    return {
        **risk_meta,
        "findings": findings
    }
