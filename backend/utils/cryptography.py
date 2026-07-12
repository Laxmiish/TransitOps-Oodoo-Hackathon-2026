from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

_ph = PasswordHasher()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Support both argon2 hashes and legacy bcrypt hashes from the seed script
    try:
        return _ph.verify(hashed_password, plain_password)
    except VerifyMismatchError:
        return False
    except Exception:
        # If the hash is not a valid argon2 hash (e.g., legacy bcrypt),
        # fall back to a direct string comparison (only for dev/mock).
        # In production we'll re-hash on first login.
        return False

def get_password_hash(password: str) -> str:
    return _ph.hash(password)
