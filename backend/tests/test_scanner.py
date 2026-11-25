import pytest
from app.scanner.detector import scan_text_content
from app.scanner.patterns import luhn_check
from app.scanner.entropy import calculate_shannon_entropy, is_high_entropy_secret
from app.scanner.risk_engine import calculate_risk_score

def test_luhn_algorithm():
    assert luhn_check("4532015112830366") is True
    assert luhn_check("4111111111111111") is True
    assert luhn_check("1234567812345678") is False # Invalid Luhn sequence

def test_entropy_computation():
    low_ent = calculate_shannon_entropy("aaaaaaaabbbbbbbb")
    high_ent = calculate_shannon_entropy("sk_live_948fha823nflk20948fh")
    assert low_ent < 2.0
    assert high_ent > 3.8
    assert is_high_entropy_secret("a9f823m4098n2f094m820f4m") is True

def test_email_and_phone_detection():
    sample = """
    Contact info:
    user@example.com
    Phone: +91 9876543210
    """
    res = scan_text_content(sample)
    types = [f["type"] for f in res["findings"]]
    assert "EMAIL" in types
    assert "PHONE" in types
    # Masking check
    email_f = next(f for f in res["findings"] if f["type"] == "EMAIL")
    assert "@example.com" in email_f["masked_value"]
    assert "user@example.com" not in email_f["masked_value"] # Must be masked!

def test_critical_secrets_detection():
    sample = """
    DATABASE_URL=mysql://admin:password123@localhost:3306/app
    API_KEY=sk-proj-948fha823nflk20948fh109485
    -----BEGIN PRIVATE KEY-----
    MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC5
    """
    res = scan_text_content(sample)
    types = [f["type"] for f in res["findings"]]
    
    assert "DATABASE_CREDENTIAL" in types
    assert "API_KEY" in types
    assert "PRIVATE_KEY" in types
    assert res["risk_level"] in ["CRITICAL", "HIGH"]
    assert res["risk_score"] >= 85

    # Verify no raw secrets returned
    db_f = next(f for f in res["findings"] if f["type"] == "DATABASE_CREDENTIAL")
    assert "password123" not in db_f["masked_value"]
    assert "********" in db_f["masked_value"]

def test_jwt_and_password_detection():
    sample = """
    password="supersecretpass123"
    JWT_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
    """
    res = scan_text_content(sample)
    types = [f["type"] for f in res["findings"]]
    assert "PASSWORD" in types
    assert "JWT" in types
    
    jwt_f = next(f for f in res["findings"] if f["type"] == "JWT")
    assert "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c" not in jwt_f["masked_value"] # Token masked

def test_safe_content():
    sample = """
    name=John
    city=Mumbai
    description=This is a safe configuration file with no credentials.
    """
    res = scan_text_content(sample)
    assert res["risk_level"] == "SAFE"
    assert res["finding_count"] == 0
    assert res["risk_score"] == 0

def test_risk_score_capping():
    # Multiple findings should cap at 100
    findings = [
        {"type": "PRIVATE_KEY", "severity": "CRITICAL", "confidence": 0.99},
        {"type": "DATABASE_CREDENTIAL", "severity": "CRITICAL", "confidence": 0.98},
        {"type": "API_KEY", "severity": "HIGH", "confidence": 0.95},
        {"type": "CREDIT_CARD", "severity": "HIGH", "confidence": 0.90}
    ]
    res = calculate_risk_score(findings)
    assert res["risk_score"] == 100
    assert res["risk_level"] == "CRITICAL"
