import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.config import settings

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

@pytest.fixture(scope="module")
def admin_token(client):
    res = client.post("/api/auth/login", json={
        "email": settings.ADMIN_EMAIL,
        "password": settings.ADMIN_PASSWORD
    })
    assert res.status_code == 200, f"Admin login failed: {res.text}"
    return res.json()["access_token"]

@pytest.fixture(scope="module")
def test_user_token(client):
    # Register or login unique test user
    email = "qa_user_test@securevault.local"
    password = "TestUserPassword123!"
    reg = client.post("/api/auth/register", json={
        "name": "QA Test Engineer",
        "email": email,
        "password": password
    })
    if reg.status_code == 201:
        return reg.json()["access_token"]
    
    # Fallback to login if already exists
    login = client.post("/api/auth/login", json={
        "email": email,
        "password": password
    })
    assert login.status_code == 200, f"Login failed: {login.text}"
    return login.json()["access_token"]


def test_health_check(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["service"] == "SecureVault"


def test_root_endpoint(client):
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert data["app"] == "SecureVault API"
    assert data["status"] == "online"


def test_auth_duplicate_registration_rejected(client):
    email = "duplicate_guard@securevault.local"
    # First registration
    client.post("/api/auth/register", json={
        "name": "First User",
        "email": email,
        "password": "ValidPassword123!"
    })
    # Second registration should fail with 400
    res = client.post("/api/auth/register", json={
        "name": "Second User",
        "email": email,
        "password": "AnotherPassword123!"
    })
    assert res.status_code == 400
    assert "already exists" in res.json()["detail"]


def test_auth_invalid_credentials(client):
    res = client.post("/api/auth/login", json={
        "email": "non_existent_account@securevault.local",
        "password": "WrongPassword999!"
    })
    assert res.status_code == 401
    assert "Invalid email address or password" in res.json()["detail"]


def test_user_profile(client, test_user_token):
    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {test_user_token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == "qa_user_test@securevault.local"
    assert data["role"] == "USER"


def test_scan_safe_text(client, test_user_token):
    payload = {
        "text": "Hello world! This is a completely standard and safe report with no keys or sensitive data.",
        "filename": "clean_memo.txt"
    }
    res = client.post("/api/scans/text", json=payload, headers={"Authorization": f"Bearer {test_user_token}"})
    assert res.status_code == 201
    data = res.json()
    assert data["risk_score"] == 0
    assert data["risk_level"] == "SAFE"
    assert data["finding_count"] == 0
    assert len(data["findings"]) == 0


def test_scan_text_with_exposed_secrets(client, test_user_token):
    sensitive_text = (
        "AWS_KEY=AKIAIOSFODNN7EXAMPLE\n"
        "AWS_SECRET=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY\n"
        "DB_URI=postgresql://postgres:SuperSecretP@ssword123@db.example.com:5432/production\n"
        "admin_email=security-lead@company.org\n"
    )
    res = client.post("/api/scans/text", json={"text": sensitive_text, "filename": "secrets.env"}, headers={"Authorization": f"Bearer {test_user_token}"})
    assert res.status_code == 201
    data = res.json()
    assert data["risk_score"] > 50
    assert data["risk_level"] in ["HIGH", "CRITICAL"]
    assert data["finding_count"] >= 2
    
    # Verify strict masking: raw secret must NEVER appear in finding value
    for f in data["findings"]:
        assert "AKIAIOSFODNN7EXAMPLE" not in f["masked_value"]
        assert "SuperSecretP@ssword123" not in f["masked_value"]


def test_scan_file_upload(client, test_user_token):
    file_content = b"DATABASE_URL=mysql://admin:P@ssw0rd12345!@sql.internal:3306/db\nCONTACT=support@acme.com"
    files = {"file": ("config.env", file_content, "text/plain")}
    res = client.post("/api/scans/file", files=files, headers={"Authorization": f"Bearer {test_user_token}"})
    assert res.status_code == 201
    data = res.json()
    assert data["filename"] == "config.env"
    assert data["file_type"] == "ENV"
    assert data["finding_count"] >= 1
    scan_id = data["id"]

    # Verify scan history retrieval
    history_res = client.get("/api/scans", headers={"Authorization": f"Bearer {test_user_token}"})
    assert history_res.status_code == 200
    scans_list = history_res.json()
    assert any(s["id"] == scan_id for s in scans_list)

    # Verify scan detail retrieval
    detail_res = client.get(f"/api/scans/{scan_id}", headers={"Authorization": f"Bearer {test_user_token}"})
    assert detail_res.status_code == 200
    assert detail_res.json()["id"] == scan_id

    # Verify PDF report generation
    pdf_res = client.get(f"/api/scans/{scan_id}/report", headers={"Authorization": f"Bearer {test_user_token}"})
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"
    assert pdf_res.content.startswith(b"%PDF")


def test_scan_unsupported_file_extension(client, test_user_token):
    files = {"file": ("malicious.exe", b"binary content", "application/octet-stream")}
    res = client.post("/api/scans/file", files=files, headers={"Authorization": f"Bearer {test_user_token}"})
    assert res.status_code == 400
    assert "Unsupported file type" in res.json()["detail"]


def test_admin_authorization_enforcement(client, test_user_token, admin_token):
    # Normal user should be rejected from admin endpoints with 403 Forbidden
    user_res = client.get("/api/admin/stats", headers={"Authorization": f"Bearer {test_user_token}"})
    assert user_res.status_code == 403

    # Admin user should succeed with 200 OK
    admin_res = client.get("/api/admin/stats", headers={"Authorization": f"Bearer {admin_token}"})
    assert admin_res.status_code == 200
    stats = admin_res.json()
    assert "total_users" in stats
    assert "total_scans" in stats
    assert "recent_activity" in stats


def test_admin_rules_and_users(client, admin_token):
    # Fetch detection rules
    rules_res = client.get("/api/admin/rules", headers={"Authorization": f"Bearer {admin_token}"})
    assert rules_res.status_code == 200
    rules = rules_res.json()
    assert len(rules) > 0

    # Fetch users list
    users_res = client.get("/api/admin/users", headers={"Authorization": f"Bearer {admin_token}"})
    assert users_res.status_code == 200
    users = users_res.json()
    assert len(users) >= 1

    # Fetch audit logs
    audit_res = client.get("/api/admin/audit-logs", headers={"Authorization": f"Bearer {admin_token}"})
    assert audit_res.status_code == 200
    logs = audit_res.json()
    assert "logs" in logs
