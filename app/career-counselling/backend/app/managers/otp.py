import random
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional
from twilio.rest import Client
from app.core.database import get_database
from app.config import settings

ACCOUNT_SID = settings.ACCOUNT_SID
AUTH_TOKEN = settings.AUTH_TOKEN
SMS_FROM = settings.TWILIO_SMS_FROM

OTP_TTL_MINUTES = 5
VERIFICATION_TOKEN_TTL_MINUTES = 10


def _hash_otp(otp: str) -> str:
    return hashlib.sha256(otp.encode()).hexdigest()


async def send_otp(phone: str) -> dict:
    """
    Check for duplicate phone, generate a 6-digit OTP, send via WhatsApp,
    and store the hashed OTP in the otp_verifications collection.

    Returns {"ok": True} on success or raises ValueError.
    """
    db = get_database()

    # Block duplicate phone numbers already in use by a registered user
    existing = await db.users.find_one({"mobileNo": phone})
    if existing:
        raise ValueError("phone_taken")

    otp = str(random.randint(100000, 999999))
    otp_hash = _hash_otp(otp)
    expires_at = datetime.utcnow() + timedelta(minutes=OTP_TTL_MINUTES)

    # Upsert so re-sends overwrite the old OTP for that phone
    await db.otp_verifications.update_one(
        {"phone": phone},
        {
            "$set": {
                "phone": phone,
                "otp_hash": otp_hash,
                "expires_at": expires_at,
                "verified": False,
                "verification_token": None,
                "created_at": datetime.utcnow(),
            }
        },
        upsert=True,
    )

    try:
        client = Client(ACCOUNT_SID, AUTH_TOKEN)
        client.messages.create(
            from_=SMS_FROM,
            to=phone,
            body=f"Your AlumNiti verification code is: {otp}. It expires in {OTP_TTL_MINUTES} minutes.",
        )
    except Exception as e:
        # Clean up the record so users can retry
        await db.otp_verifications.delete_one({"phone": phone})
        raise RuntimeError(f"Failed to send OTP: {e}")

    return {"ok": True}


async def verify_otp(phone: str, otp: str) -> str:
    """
    Verify the OTP for a given phone number.

    Returns a one-time verification_token on success, raises ValueError otherwise.
    """
    db = get_database()
    record = await db.otp_verifications.find_one({"phone": phone})

    if not record:
        raise ValueError("no_otp")

    if record.get("verified"):
        raise ValueError("already_verified")

    if datetime.utcnow() > record["expires_at"]:
        raise ValueError("otp_expired")

    if record["otp_hash"] != _hash_otp(otp):
        raise ValueError("invalid_otp")

    verification_token = secrets.token_urlsafe(32)
    token_expires_at = datetime.utcnow() + timedelta(minutes=VERIFICATION_TOKEN_TTL_MINUTES)

    await db.otp_verifications.update_one(
        {"phone": phone},
        {
            "$set": {
                "verified": True,
                "verification_token": verification_token,
                "token_expires_at": token_expires_at,
            }
        },
    )

    return verification_token


async def consume_verification_token(phone: str, token: str) -> bool:
    """
    Validate and consume a verification token during signup.
    Returns True if valid, False otherwise.
    Deletes the record after successful consumption.
    """
    db = get_database()
    record = await db.otp_verifications.find_one({"phone": phone})

    if not record:
        return False

    if not record.get("verified"):
        return False

    if record.get("verification_token") != token:
        return False

    if datetime.utcnow() > record.get("token_expires_at", datetime.min):
        return False

    # One-time use — delete after successful consumption
    await db.otp_verifications.delete_one({"phone": phone})
    return True
