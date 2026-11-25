import re

def mask_sensitive_value(value: str, val_type: str) -> str:
    """
    Safely mask sensitive detected values so raw secrets are never exposed in UI/DB/Logs.
    """
    if not value:
        return "****"
    
    val = value.strip()
    length = len(val)

    if val_type == "CREDIT_CARD":
        # Keep only last 4 digits
        digits = re.sub(r"\D", "", val)
        if len(digits) >= 4:
            return f"**** **** **** {digits[-4:]}"
        return "**** **** **** ****"

    elif val_type == "EMAIL":
        # Mask username before @ except first letter
        if "@" in val:
            parts = val.split("@")
            user = parts[0]
            domain = parts[1]
            if len(user) <= 2:
                masked_user = user[0] + "*"
            else:
                masked_user = user[0] + "*" * (len(user) - 2) + user[-1]
            return f"{masked_user}@{domain}"
        return val[0] + "*****"

    elif val_type == "JWT":
        # Mask header and payload, show eyJ...masked
        if val.startswith("eyJ"):
            return f"eyJ...[JWT TOKEN MASKED]...{val[-6:] if length > 10 else ''}"
        return f"{val[:5]}...[JWT MASKED]...{val[-4:] if length > 8 else ''}"

    elif val_type == "PRIVATE_KEY":
        return "-----BEGIN PRIVATE KEY----- [MASKED PRIVATE KEY CONTENT] -----END PRIVATE KEY-----"

    elif val_type == "DATABASE_CREDENTIAL":
        # Mask password in URL mysql://admin:password123@localhost:3306/db -> mysql://admin:********@localhost:3306/db
        masked = re.sub(r":([^:@]+)@", ":********@", val)
        return masked

    elif val_type in ["API_KEY", "CLOUD_CREDENTIAL"]:
        if length <= 8:
            return "*****"
        return f"{val[:3]}{'*' * (length - 6)}{val[-3:]}"

    elif val_type == "PASSWORD":
        if length <= 4:
            return "****"
        return f"{val[0]}{'*' * (length - 2)}{val[-1]}"

    elif val_type == "PHONE":
        if length <= 5:
            return "****"
        return f"{val[:3]}****{val[-2:]}"

    # Default generic masking
    if length <= 6:
        return "*" * length
    return f"{val[:2]}{'*' * (length - 4)}{val[-2:]}"
