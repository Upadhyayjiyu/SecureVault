import os
import time
import tempfile
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Response, Request
from bson import ObjectId

from app.config import settings
from app.database import get_database
from app.middleware.auth import get_current_user
from app.schemas.scan import ScanOut, TextScanRequest, FindingOut
from app.scanner import scan_text_content
from app.scanner.extractors import extract_text_from_pdf, extract_text_from_docx, extract_text_from_plain_text
from app.services.audit_service import log_audit_event
from app.services.pdf_report_service import generate_pdf_report

router = APIRouter(prefix="/scans", tags=["Scans"])

ALLOWED_EXTENSIONS = {
    "pdf", "docx", "txt", "csv", "js", "jsx", "ts", "tsx", "py", 
    "java", "c", "cpp", "php", "html", "css", "json", "yaml", "yml", "xml", "env", "conf"
}

@router.post("/file", response_model=ScanOut, status_code=status.HTTP_201_CREATED)
async def scan_file(
    request: Request,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Upload and scan document or source code file for sensitive exposure.
    Uploaded files are stored temporarily ONLY during text extraction and are immediately deleted.
    """
    start_time = time.time()
    
    # Extension validation
    filename = file.filename or "uploaded_file.txt"
    ext = filename.split(".")[-1].lower() if "." in filename else ""
    
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type (.{ext}). Allowed extensions: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    # Read bytes and validate size
    file_bytes = await file.read()
    if len(file_bytes) > settings.MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_MB} MB."
        )

    # Save to safe temporary file location
    temp_dir = tempfile.mkdtemp()
    temp_file_path = os.path.join(temp_dir, f"scan_{int(time.time())}_{os.path.basename(filename)}")
    
    try:
        with open(temp_file_path, "wb") as f:
            f.write(file_bytes)

        # Extract text content based on file type
        if ext == "pdf":
            extracted_text = extract_text_from_pdf(file_bytes)
        elif ext == "docx":
            extracted_text = extract_text_from_docx(file_bytes)
        else:
            extracted_text = extract_text_from_plain_text(file_bytes)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to extract text from file: {str(e)}"
        )
    finally:
        # CRITICAL SECURITY STEP: Immediately remove temporary file from disk
        if os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except Exception:
                pass
        if os.path.exists(temp_dir):
            try:
                os.rmdir(temp_dir)
            except Exception:
                pass

    # Run detection engine
    db = get_database()
    rules_cursor = db.detection_rules.find()
    custom_rules = await rules_cursor.to_list(100)
    
    scan_meta = scan_text_content(extracted_text, custom_rules=custom_rules)
    processing_time = f"{round(time.time() - start_time, 3)}s"

    # Persist scan metadata in MongoDB
    scan_doc = {
        "user_id": current_user["id"],
        "filename": filename,
        "file_type": ext.upper(),
        "risk_score": scan_meta["risk_score"],
        "risk_level": scan_meta["risk_level"],
        "finding_count": scan_meta["finding_count"],
        "counts": scan_meta["counts"],
        "processing_time": processing_time,
        "created_at": datetime.utcnow()
    }

    scan_result = await db.scans.insert_one(scan_doc)
    scan_id = str(scan_result.inserted_id)

    # Save findings metadata with scan_id
    findings_list = []
    if scan_meta["findings"]:
        for f in scan_meta["findings"]:
            f["scan_id"] = scan_id
            f["user_id"] = current_user["id"]
            f["created_at"] = datetime.utcnow()
        await db.findings.insert_many(scan_meta["findings"])
        findings_list = [FindingOut(**f) for f in scan_meta["findings"]]

    await log_audit_event(
        action="FILE_SCAN",
        user_id=current_user["id"],
        user_email=current_user["email"],
        ip_address=request.client.host if request.client else None,
        status="SUCCESS",
        details={
            "filename": filename,
            "risk_score": scan_meta["risk_score"],
            "risk_level": scan_meta["risk_level"],
            "findings": scan_meta["finding_count"]
        }
    )

    return ScanOut(
        id=scan_id,
        user_id=current_user["id"],
        filename=filename,
        file_type=ext.upper(),
        risk_score=scan_meta["risk_score"],
        risk_level=scan_meta["risk_level"],
        finding_count=scan_meta["finding_count"],
        created_at=scan_doc["created_at"],
        processing_time=processing_time,
        counts=scan_meta["counts"],
        findings=findings_list
    )

@router.post("/text", response_model=ScanOut, status_code=status.HTTP_201_CREATED)
async def scan_text(
    payload: TextScanRequest,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """
    Scan pasted text or code snippet for sensitive credentials and PII.
    """
    start_time = time.time()
    db = get_database()
    
    rules_cursor = db.detection_rules.find()
    custom_rules = await rules_cursor.to_list(100)

    scan_meta = scan_text_content(payload.text, custom_rules=custom_rules)
    processing_time = f"{round(time.time() - start_time, 3)}s"
    filename = payload.filename or "Pasted_Text_Scan.txt"

    scan_doc = {
        "user_id": current_user["id"],
        "filename": filename,
        "file_type": "TEXT",
        "risk_score": scan_meta["risk_score"],
        "risk_level": scan_meta["risk_level"],
        "finding_count": scan_meta["finding_count"],
        "counts": scan_meta["counts"],
        "processing_time": processing_time,
        "created_at": datetime.utcnow()
    }

    scan_result = await db.scans.insert_one(scan_doc)
    scan_id = str(scan_result.inserted_id)

    findings_list = []
    if scan_meta["findings"]:
        for f in scan_meta["findings"]:
            f["scan_id"] = scan_id
            f["user_id"] = current_user["id"]
            f["created_at"] = datetime.utcnow()
        await db.findings.insert_many(scan_meta["findings"])
        findings_list = [FindingOut(**f) for f in scan_meta["findings"]]

    await log_audit_event(
        action="TEXT_SCAN",
        user_id=current_user["id"],
        user_email=current_user["email"],
        ip_address=request.client.host if request.client else None,
        status="SUCCESS",
        details={
            "risk_score": scan_meta["risk_score"],
            "risk_level": scan_meta["risk_level"],
            "findings": scan_meta["finding_count"]
        }
    )

    return ScanOut(
        id=scan_id,
        user_id=current_user["id"],
        filename=filename,
        file_type="TEXT",
        risk_score=scan_meta["risk_score"],
        risk_level=scan_meta["risk_level"],
        finding_count=scan_meta["finding_count"],
        created_at=scan_doc["created_at"],
        processing_time=processing_time,
        counts=scan_meta["counts"],
        findings=findings_list
    )

@router.get("", response_model=List[ScanOut])
async def list_scans(current_user: dict = Depends(get_current_user)):
    """Fetch user scan history."""
    db = get_database()
    cursor = db.scans.find({"user_id": current_user["id"]}).sort("created_at", -1)
    scans = await cursor.to_list(500)
    
    results = []
    for s in scans:
        results.append(ScanOut(
            id=str(s["_id"]),
            user_id=s["user_id"],
            filename=s["filename"],
            file_type=s["file_type"],
            risk_score=s["risk_score"],
            risk_level=s["risk_level"],
            finding_count=s["finding_count"],
            created_at=s["created_at"],
            processing_time=s.get("processing_time", "0.01s"),
            counts=s.get("counts", {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0})
        ))
    return results

@router.get("/{scan_id}", response_model=ScanOut)
async def get_scan_detail(
    scan_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Retrieve scan result metadata and detailed findings."""
    db = get_database()
    try:
        scan = await db.scans.find_one({"_id": ObjectId(scan_id), "user_id": current_user["id"]})
    except Exception:
        raise HTTPException(status_code=404, detail="Scan result not found.")
        
    if not scan:
        raise HTTPException(status_code=404, detail="Scan result not found.")

    findings_cursor = db.findings.find({"scan_id": scan_id})
    raw_findings = await findings_cursor.to_list(1000)
    findings = [FindingOut(**f) for f in raw_findings]

    return ScanOut(
        id=str(scan["_id"]),
        user_id=scan["user_id"],
        filename=scan["filename"],
        file_type=scan["file_type"],
        risk_score=scan["risk_score"],
        risk_level=scan["risk_level"],
        finding_count=scan["finding_count"],
        created_at=scan["created_at"],
        processing_time=scan.get("processing_time", "0.01s"),
        counts=scan.get("counts", {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}),
        findings=findings
    )

@router.delete("/{scan_id}")
async def delete_scan(
    scan_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Delete scan record and associated findings."""
    db = get_database()
    try:
        scan = await db.scans.find_one({"_id": ObjectId(scan_id), "user_id": current_user["id"]})
    except Exception:
        raise HTTPException(status_code=404, detail="Scan not found.")

    if not scan:
        raise HTTPException(status_code=404, detail="Scan record not found.")

    await db.scans.delete_one({"_id": ObjectId(scan_id)})
    await db.findings.delete_many({"scan_id": scan_id})

    await log_audit_event(
        action="SCAN_DELETED",
        user_id=current_user["id"],
        user_email=current_user["email"],
        ip_address=request.client.host if request.client else None,
        status="SUCCESS",
        details={"scan_id": scan_id}
    )

    return {"message": "Scan record deleted successfully."}

@router.get("/{scan_id}/report")
async def export_scan_pdf_report(
    scan_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Export PDF security report for a scan."""
    db = get_database()
    try:
        scan = await db.scans.find_one({"_id": ObjectId(scan_id), "user_id": current_user["id"]})
    except Exception:
        raise HTTPException(status_code=404, detail="Scan not found.")

    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found.")

    findings_cursor = db.findings.find({"scan_id": scan_id})
    findings = await findings_cursor.to_list(1000)

    pdf_bytes = generate_pdf_report(scan, findings)
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=SecureVault_Report_{scan_id[:8]}.pdf"
        }
    )
