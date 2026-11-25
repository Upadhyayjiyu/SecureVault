import re

def luhn_check(card_num: str) -> bool:
    """
    Validate credit card numbers using Luhn Algorithm (Mod 10).
    Reduces false positives on arbitrary 16-digit sequences.
    """
    digits = [int(c) for c in card_num if c.isdigit()]
    if len(digits) < 13 or len(digits) > 19:
        return False
    
    checksum = 0
    reverse_digits = digits[::-1]
    
    for i, digit in enumerate(reverse_digits):
        if i % 2 == 1:
            doubled = digit * 2
            checksum += doubled - 9 if doubled > 9 else doubled
        else:
            checksum += digit
            
    return checksum % 10 == 0

# Core Pattern Definitions
DEFAULT_DETECTION_PATTERNS = [
    {
        "type": "PRIVATE_KEY",
        "category": "Authentication Secret",
        "regex": r"-----BEGIN (?:RSA |DSA |EC |OPENSSH |PGP )?PRIVATE KEY(?: BLOCK)?-----",
        "severity": "CRITICAL",
        "base_confidence": 0.99,
        "recommendation": "Revoke the exposed key immediately and generate a new key pair."
    },
    {
        "type": "DATABASE_CREDENTIAL",
        "category": "Database Credentials",
        "regex": r'\b(?:mysql|postgresql|postgres|mongodb|mongodb\+srv|redis|mssql|oracle):\/\/[^\s"\'<>]+',
        "severity": "CRITICAL",
        "base_confidence": 0.96,
        "recommendation": "Rotate database passwords immediately and remove connection strings from source code."
    },
    {
        "type": "CLOUD_CREDENTIAL",
        "category": "Cloud Credentials",
        "regex": r'(?i)\b(?:aws_secret_access_key|aws_access_key_id|gcp_secret|azure_storage_key)\s*[:=]\s*["\']?([a-zA-Z0-9\/+=]{16,})["\']?|\b(AKIA|ASIA)[0-9A-Z]{16}\b',
        "severity": "CRITICAL",
        "base_confidence": 0.95,
        "recommendation": "Revoke cloud provider keys immediately and use IAM roles or Secret Managers."
    },
    {
        "type": "API_KEY",
        "category": "API Credentials",
        "regex": r'(?i)\b(?:api[_-]?key|access[_-]?token|auth[_-]?token|bearer[_-]?token|client[_-]?secret)\s*[:=]\s*["\']?([a-zA-Z0-9_\-\.]{12,})["\']?|\b(?:sk-[a-zA-Z0-9]{20,}|ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9_]{22,}|xox[baprs]-[0-9a-zA-Z]{10,}|sk_live_[0-9a-zA-Z]{24,})\b',
        "severity": "HIGH",
        "base_confidence": 0.92,
        "recommendation": "Revoke and rotate the exposed API key or access token immediately."
    },
    {
        "type": "JWT",
        "category": "Authentication Token",
        "regex": r"\b(eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,})\b",
        "severity": "HIGH",
        "base_confidence": 0.95,
        "recommendation": "Invalidate the JWT secret/session token to prevent unauthorized session hijacking."
    },
    {
        "type": "PASSWORD",
        "category": "Credential Exposure",
        "regex": r'(?i)\b(?:password|passwd|pwd|database_password|db_pass|secret)\s*[:=]\s*["\']?([^"\'\s#]{4,})["\']?',
        "severity": "HIGH",
        "base_confidence": 0.88,
        "recommendation": "Change the password immediately and migrate credentials to environment variables."
    },
    {
        "type": "CREDIT_CARD",
        "category": "Financial PII",
        "regex": r"\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\d{3})\d{11})\b|\b(?:\d{4}[-\s]?){3}\d{4}\b",
        "severity": "HIGH",
        "base_confidence": 0.85,
        "recommendation": "Mask credit card numbers and adhere to PCI-DSS data storage compliance requirements."
    },
    {
        "type": "IP_ADDRESS",
        "category": "Network PII",
        "regex": r"\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b",
        "severity": "LOW",
        "base_confidence": 0.80,
        "recommendation": "Avoid exposing internal network IP addresses or infrastructure topology."
    },
    {
        "type": "PHONE",
        "category": "Personal PII",
        "regex": r"\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3,5}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b|\b[6-9]\d{9}\b",
        "severity": "LOW",
        "base_confidence": 0.75,
        "recommendation": "Ensure personal phone numbers are stored securely with consent and authorization."
    },
    {
        "type": "EMAIL",
        "category": "Personal PII",
        "regex": r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b",
        "severity": "LOW",
        "base_confidence": 0.90,
        "recommendation": "Avoid exposing user personal email addresses unnecessarily in public files."
    }
]
