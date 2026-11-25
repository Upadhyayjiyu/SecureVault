from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Request
from bson import ObjectId

from app.database import get_database
from app.schemas.auth import UserRegister, UserLogin, UserOut, TokenResponse, UserProfileUpdate, PasswordChange
from app.middleware.auth import hash_password, verify_password, create_access_token, get_current_user
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user_in: UserRegister, request: Request):
    """Register a new user account."""
    db = get_database()
    
    # Check duplicate email
    existing_user = await db.users.find_one({"email": user_in.email.lower()})
    if existing_user:
        await log_audit_event(
            action="USER_REGISTRATION_FAILED",
            user_email=user_in.email.lower(),
            ip_address=request.client.host if request.client else None,
            status="FAILURE",
            details={"reason": "Email already registered"}
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    # Determine default role (ADMIN for seed email if matches settings, otherwise USER)
    from app.config import settings
    role = "ADMIN" if user_in.email.lower() == settings.ADMIN_EMAIL.lower() else "USER"

    user_doc = {
        "name": user_in.name,
        "email": user_in.email.lower(),
        "password_hash": hash_password(user_in.password),
        "role": role,
        "status": "active",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "last_login": datetime.utcnow()
    }

    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)

    # Issue JWT token
    access_token = create_access_token(data={"sub": user_id, "role": role})
    
    user_out = UserOut(
        id=user_id,
        name=user_doc["name"],
        email=user_doc["email"],
        role=role,
        status="active",
        created_at=user_doc["created_at"],
        last_login=user_doc["last_login"]
    )

    await log_audit_event(
        action="USER_REGISTERED",
        user_id=user_id,
        user_email=user_doc["email"],
        ip_address=request.client.host if request.client else None,
        status="SUCCESS"
    )

    return TokenResponse(access_token=access_token, user=user_out)

@router.post("/login", response_model=TokenResponse)
async def login_user(login_in: UserLogin, request: Request):
    """Authenticate user and return JWT access token."""
    db = get_database()
    email_clean = login_in.email.lower()
    
    user = await db.users.find_one({"email": email_clean})
    if not user or not verify_password(login_in.password, user["password_hash"]):
        await log_audit_event(
            action="LOGIN_FAILED",
            user_email=email_clean,
            ip_address=request.client.host if request.client else None,
            status="FAILURE"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email address or password."
        )

    if user.get("status") == "disabled":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been disabled. Please contact system administrator."
        )

    user_id = str(user["_id"])
    role = user.get("role", "USER")

    # Update last login timestamp
    now = datetime.utcnow()
    await db.users.update_one({"_id": user["_id"]}, {"$set": {"last_login": now}})

    access_token = create_access_token(data={"sub": user_id, "role": role})

    user_out = UserOut(
        id=user_id,
        name=user["name"],
        email=user["email"],
        role=role,
        status=user.get("status", "active"),
        created_at=user["created_at"],
        last_login=now
    )

    await log_audit_event(
        action="USER_LOGIN" if role == "USER" else "ADMIN_LOGIN",
        user_id=user_id,
        user_email=user["email"],
        ip_address=request.client.host if request.client else None,
        status="SUCCESS"
    )

    return TokenResponse(access_token=access_token, user=user_out)

@router.post("/logout")
async def logout_user(request: Request, current_user: dict = Depends(get_current_user)):
    """Log out user session."""
    await log_audit_event(
        action="USER_LOGOUT",
        user_id=current_user["id"],
        user_email=current_user["email"],
        ip_address=request.client.host if request.client else None,
        status="SUCCESS"
    )
    return {"message": "Successfully logged out"}

@router.get("/me", response_model=UserOut)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Fetch current user profile details."""
    return UserOut(
        id=current_user["id"],
        name=current_user["name"],
        email=current_user["email"],
        role=current_user.get("role", "USER"),
        status=current_user.get("status", "active"),
        created_at=current_user["created_at"],
        last_login=current_user.get("last_login")
    )

@router.patch("/profile", response_model=UserOut)
async def update_profile(
    profile_in: UserProfileUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update user profile name."""
    db = get_database()
    await db.users.update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$set": {"name": profile_in.name, "updated_at": datetime.utcnow()}}
    )
    current_user["name"] = profile_in.name
    return UserOut(
        id=current_user["id"],
        name=current_user["name"],
        email=current_user["email"],
        role=current_user.get("role", "USER"),
        status=current_user.get("status", "active"),
        created_at=current_user["created_at"],
        last_login=current_user.get("last_login")
    )

@router.patch("/change-password")
async def change_password(
    pwd_in: PasswordChange,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Change user password."""
    db = get_database()
    user = await db.users.find_one({"_id": ObjectId(current_user["id"])})
    if not verify_password(pwd_in.current_password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password entered is incorrect."
        )

    new_hash = hash_password(pwd_in.new_password)
    await db.users.update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$set": {"password_hash": new_hash, "updated_at": datetime.utcnow()}}
    )

    await log_audit_event(
        action="PASSWORD_CHANGED",
        user_id=current_user["id"],
        user_email=current_user["email"],
        ip_address=request.client.host if request.client else None,
        status="SUCCESS"
    )

    return {"message": "Password updated successfully"}
