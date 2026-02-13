import hashlib
import os
import re
import secrets
from datetime import date, datetime, timedelta, timezone
from typing import Any

from dotenv import load_dotenv
from bson import ObjectId
from fastapi import FastAPI, Header, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from pydantic import BaseModel
from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.errors import DuplicateKeyError, PyMongoError

load_dotenv()

app = FastAPI(title="Sehri Finder API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

_mongo_client: MongoClient | None = None


class ChatRequest(BaseModel):
    message: str


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


def get_env(name: str, default: str | None = None) -> str | None:
    value = os.getenv(name, default)
    if value is None:
        return None
    cleaned = value.strip()
    return cleaned or default


OPENROUTER_BASE_URL = get_env("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1") or "https://openrouter.ai/api/v1"
OPENROUTER_MODEL = get_env("OPENROUTER_MODEL", "liquid/lfm-2.5-1.2b-instruct:free") or "liquid/lfm-2.5-1.2b-instruct:free"
OPENROUTER_SITE_URL = get_env("OPENROUTER_SITE_URL")
OPENROUTER_APP_NAME = get_env("OPENROUTER_APP_NAME")

SYSTEM_PROMPT = """You are Hala AI Assistant, a helpful chatbot for "Bangalore Sehri Finder" app.
You help users find Sehri (pre-dawn meal) providers during Ramadan in Bangalore.

Be friendly, concise, and helpful. Provide information about:
- Finding nearby Sehri providers (Masjids, Volunteer groups, Restaurants)
- Prayer times and Sehri/Iftar times
- Free vs Paid options
- How to use the app features
- Ramadan related guidance

Keep responses short and to the point (2-3 sentences max unless asked for more details).
"""


def get_openrouter_client() -> OpenAI | None:
    # Support both key names so Vercel env mismatches do not break chat.
    api_key = get_env("OPENROUTER_API_KEY") or get_env("OPENAI_API_KEY")
    if not api_key:
        return None

    headers: dict[str, str] = {}
    if OPENROUTER_SITE_URL:
        headers["HTTP-Referer"] = OPENROUTER_SITE_URL
    if OPENROUTER_APP_NAME:
        headers["X-Title"] = OPENROUTER_APP_NAME

    return OpenAI(
        base_url=OPENROUTER_BASE_URL,
        api_key=api_key,
        default_headers=headers or None,
    )


def extract_chat_content(completion: Any) -> str:
    choices = getattr(completion, "choices", None)
    if not choices:
        return ""

    first_choice = choices[0]
    message = getattr(first_choice, "message", None)
    if message is None:
        return ""

    content = getattr(message, "content", "")
    if isinstance(content, str):
        return content.strip()

    if isinstance(content, list):
        parts: list[str] = []
        for item in content:
            if isinstance(item, dict):
                text = item.get("text")
            else:
                text = getattr(item, "text", None)
            if text:
                parts.append(str(text))
        return "".join(parts).strip()

    if content is None:
        return ""
    return str(content).strip()


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def normalize_email(value: str) -> str:
    return value.strip().lower()


def get_auth_db_name() -> str:
    return get_env("MONGODB_AUTH_DB_NAME") or get_env("MONGODB_DB_NAME") or "sehri_finder"


def get_mongo_client() -> MongoClient:
    global _mongo_client

    if _mongo_client is not None:
        return _mongo_client

    mongodb_uri = get_env("MONGODB_URI")
    if not mongodb_uri:
        raise RuntimeError("MONGODB_URI is not set.")

    _mongo_client = MongoClient(mongodb_uri, serverSelectionTimeoutMS=7000)
    return _mongo_client


def get_users_collection() -> Collection:
    client = get_mongo_client()
    db_name = get_auth_db_name()
    collection_name = get_env("MONGODB_USERS_COLLECTION", "users")
    if not collection_name:
        raise RuntimeError("MONGODB_USERS_COLLECTION is invalid.")
    collection = client[db_name][collection_name]
    collection.create_index("email", unique=True)
    return collection


def get_sessions_collection() -> Collection:
    client = get_mongo_client()
    db_name = get_auth_db_name()
    collection_name = get_env("MONGODB_SESSIONS_COLLECTION", "auth_sessions")
    if not collection_name:
        raise RuntimeError("MONGODB_SESSIONS_COLLECTION is invalid.")
    collection = client[db_name][collection_name]
    collection.create_index("token_hash", unique=True)
    collection.create_index("expires_at")
    return collection


def get_providers_collection() -> Collection:
    client = get_mongo_client()
    configured_db_name = get_env("MONGODB_DB_NAME")
    configured_collection_name = get_env("MONGODB_PROVIDERS_COLLECTION", "providers")
    if not configured_collection_name:
        raise RuntimeError("Collection name is invalid.")

    def resolve_collection_name(db_name: str, expected_name: str) -> str | None:
        collection_names = client[db_name].list_collection_names()
        if expected_name in collection_names:
            return expected_name

        lower_map = {name.lower(): name for name in collection_names}
        if expected_name.lower() in lower_map:
            return lower_map[expected_name.lower()]
        if "providers" in lower_map:
            return lower_map["providers"]
        return None

    if configured_db_name:
        collection_name = resolve_collection_name(configured_db_name, configured_collection_name)
        if not collection_name:
            raise RuntimeError(
                f"Collection '{configured_collection_name}' was not found in database '{configured_db_name}'."
            )
        return client[configured_db_name][collection_name]

    candidate_db_names = ["sehri_finder", "Sehri", "test"]
    for db_name in client.list_database_names():
        if db_name not in candidate_db_names and db_name not in {"admin", "local", "config"}:
            candidate_db_names.append(db_name)

    for db_name in candidate_db_names:
        collection_name = resolve_collection_name(db_name, configured_collection_name)
        if collection_name:
            return client[db_name][collection_name]

    raise RuntimeError("Could not find a providers collection. Set MONGODB_DB_NAME and MONGODB_PROVIDERS_COLLECTION.")


def first_non_empty(document: dict[str, Any], keys: tuple[str, ...], fallback: str = "") -> str:
    for key in keys:
        value = document.get(key)
        if value is None:
            continue
        text = str(value).strip()
        if text:
            return text
    return fallback


def format_open_time(value: str) -> str:
    match = re.match(r"^(\d{1,2}):(\d{2})$", value.strip())
    if not match:
        return value

    hour_24 = int(match.group(1))
    minute = int(match.group(2))
    suffix = "AM" if hour_24 < 12 else "PM"
    hour_12 = hour_24 % 12
    if hour_12 == 0:
        hour_12 = 12
    return f"{hour_12}:{minute:02d} {suffix}"


def normalize_provider(document: dict[str, Any]) -> dict[str, Any]:
    provider_name = first_non_empty(
        document,
        ("Organisation Name", "organisation_name", "name", "Name", "providerName", "provider_name"),
        "Unknown Provider",
    )

    provider_type_raw = first_non_empty(document, ("type", "providerType", "provider_type"), "")
    provider_type_lookup = provider_type_raw.strip().lower()
    provider_name_lookup = provider_name.lower()
    if not provider_type_lookup:
        if any(word in provider_name_lookup for word in ("masjid", "mosque", "jamia", "markaz")):
            provider_type_lookup = "masjid"
        elif any(word in provider_name_lookup for word in ("hotel", "restaurant", "eatery", "cafe")):
            provider_type_lookup = "restaurant"
        else:
            provider_type_lookup = "volunteer"

    if provider_type_lookup == "masjid":
        provider_type = "Masjid"
    elif provider_type_lookup in {"volunteer", "volunteer group", "ngo"}:
        provider_type = "Volunteer"
    else:
        provider_type = "Restaurant"

    pricing_raw = first_non_empty(document, ("pricing", "Type of Sehri", "type_of_sehri"), "Paid")
    pricing = "Free" if pricing_raw.strip().lower() == "free" else "Paid"
    opens_raw = first_non_empty(document, ("opens", "opensAt", "opens_at", "Sehri Timing", "sehri_timing"), "3:00 AM")

    if provider_type == "Masjid":
        image = "🕌"
    elif provider_type == "Volunteer":
        image = "🤝"
    else:
        image = "🍽️"

    raw_id = document.get("id", document.get("_id", ""))
    provider_id = str(raw_id) if raw_id is not None else ""

    return {
        "id": provider_id,
        "name": provider_name,
        "type": provider_type,
        "location": first_non_empty(document, ("location", "Area", "area", "Zone", "zone", "City", "city"), "Unknown Area"),
        "address": first_non_empty(document, ("address", "Address"), "Address not available"),
        "opens": format_open_time(opens_raw),
        "foodType": first_non_empty(
            document,
            ("foodType", "food_type", "Specific To", "specific_to", "Our Comments", "our_comments"),
            "Not specified",
        ),
        "pricing": pricing,
        "image": image,
    }


def serialize_mongo_value(value: Any) -> Any:
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, date):
        return value.isoformat()
    if isinstance(value, list):
        return [serialize_mongo_value(item) for item in value]
    if isinstance(value, dict):
        return {key: serialize_mongo_value(item) for key, item in value.items()}
    return value


def hash_password(password: str, salt_hex: str | None = None) -> str:
    iterations = 200000
    salt = bytes.fromhex(salt_hex) if salt_hex else secrets.token_bytes(16)
    password_hash = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
    return f"pbkdf2_sha256${iterations}${salt.hex()}${password_hash.hex()}"


def verify_password(password: str, encoded_hash: str) -> bool:
    try:
        algorithm, iterations_raw, salt_hex, expected_hash_hex = encoded_hash.split("$")
        if algorithm != "pbkdf2_sha256":
            return False
        iterations = int(iterations_raw)
    except Exception:
        return False

    salt = bytes.fromhex(salt_hex)
    calculated_hash = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations).hex()
    return secrets.compare_digest(calculated_hash, expected_hash_hex)


def hash_auth_token(token: str) -> str:
    secret = get_env("AUTH_SECRET_KEY", "change-me-in-production")
    return hashlib.sha256(f"{secret}:{token}".encode("utf-8")).hexdigest()


def get_token_from_authorization_header(authorization: str | None) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header is missing.")
    parts = authorization.split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer" or not parts[1].strip():
        raise HTTPException(status_code=401, detail="Invalid authorization header format.")
    return parts[1].strip()


def extract_user_payload(document: dict[str, Any]) -> dict[str, str]:
    return {
        "id": str(document.get("_id", "")),
        "name": str(document.get("name", "")).strip(),
        "email": str(document.get("email", "")).strip().lower(),
    }


def get_current_user_from_token(token: str) -> dict[str, Any]:
    sessions_collection = get_sessions_collection()
    users_collection = get_users_collection()

    token_hash = hash_auth_token(token)
    session_doc = sessions_collection.find_one({"token_hash": token_hash})
    if not session_doc:
        raise HTTPException(status_code=401, detail="Session is invalid.")

    expires_at = session_doc.get("expires_at")
    if not isinstance(expires_at, datetime):
        sessions_collection.delete_one({"_id": session_doc.get("_id")})
        raise HTTPException(status_code=401, detail="Session is invalid.")

    now = utc_now()
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at <= now:
        sessions_collection.delete_one({"_id": session_doc.get("_id")})
        raise HTTPException(status_code=401, detail="Session has expired.")

    user_id = session_doc.get("user_id")
    if not user_id:
        sessions_collection.delete_one({"_id": session_doc.get("_id")})
        raise HTTPException(status_code=401, detail="Session is invalid.")

    user_doc = users_collection.find_one({"_id": user_id})
    if not user_doc:
        sessions_collection.delete_one({"_id": session_doc.get("_id")})
        raise HTTPException(status_code=401, detail="User not found.")

    sessions_collection.update_one(
        {"_id": session_doc.get("_id")},
        {"$set": {"last_used_at": now}},
    )
    return user_doc


def build_location_search_blob(document: dict[str, Any], normalized: dict[str, Any]) -> str:
    location_keys = (
        "location",
        "Location",
        "Area",
        "area",
        "Zone",
        "zone",
        "City",
        "city",
        "Address",
        "address",
        "Delivery Areas",
        "delivery_areas",
        "Google Pin Location",
    )

    tokens: list[str] = []
    for key in location_keys:
        value = document.get(key)
        if value is None:
            continue
        text = str(value).strip()
        if text:
            tokens.append(text.lower())

    normalized_location = str(normalized.get("location", "")).strip().lower()
    if normalized_location:
        tokens.append(normalized_location)

    return " | ".join(tokens)


@app.get("/")
@app.get("/api")
def api_root() -> dict:
    return {"message": "Sehri Finder API is running."}


@app.get("/hello")
@app.get("/api/hello")
def hello_world() -> dict:
    return {"message": "Hello World"}


@app.get("/providers")
@app.get("/api/providers")
def list_providers(
    response: Response,
    location: str | None = Query(default=None, min_length=1),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=12, ge=1, le=50),
) -> dict[str, Any]:
    location_filter = location.strip().lower() if isinstance(location, str) else ""

    try:
        collection = get_providers_collection()
        documents = list(collection.find({}))
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except PyMongoError as exc:
        raise HTTPException(status_code=500, detail=f"MongoDB error: {exc}") from exc

    providers: list[dict[str, Any]] = []
    for document in documents:
        is_active = document.get("is_active", document.get("isActive", True))
        if is_active is False:
            continue

        normalized = normalize_provider(document)
        if location_filter:
            search_blob = build_location_search_blob(document, normalized)
            if location_filter not in search_blob:
                continue
        providers.append(normalized)

    total = len(providers)
    total_pages = max(1, (total + page_size - 1) // page_size)
    safe_page = min(page, total_pages)
    start_index = (safe_page - 1) * page_size
    end_index = start_index + page_size

    response.headers["Cache-Control"] = "no-store"

    return {
        "data": providers[start_index:end_index],
        "pagination": {
            "page": safe_page,
            "page_size": page_size,
            "total": total,
            "total_pages": total_pages,
            "has_next": safe_page < total_pages,
            "has_prev": safe_page > 1,
        },
    }


@app.get("/providers/all")
@app.get("/api/providers/all")
def list_all_providers_from_mongo() -> dict[str, Any]:
    try:
        collection = get_providers_collection()
        documents = list(collection.find({}))
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except PyMongoError as exc:
        raise HTTPException(status_code=500, detail=f"MongoDB error: {exc}") from exc

    serialized_documents = [serialize_mongo_value(document) for document in documents]
    return {"count": len(serialized_documents), "data": serialized_documents}


@app.post("/chat")
@app.post("/api/chat")
def chat(payload: ChatRequest) -> dict[str, str]:
    user_message = payload.message.strip()
    if not user_message:
        raise HTTPException(status_code=400, detail="Message is required.")

    client = get_openrouter_client()
    if client is None:
        raise HTTPException(
            status_code=500,
            detail=(
                "Server is missing OpenRouter API key. Set OPENROUTER_API_KEY "
                "(or OPENAI_API_KEY) in Vercel for this deployment environment "
                "(Preview/Production) and redeploy."
            ),
        )

    try:
        completion = client.chat.completions.create(
            model=OPENROUTER_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ],
            temperature=0.7,
            max_tokens=256,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"OpenRouter request failed: {exc}") from exc

    response_text = extract_chat_content(completion)
    if not response_text:
        response_text = "I could not generate a response right now. Please try again."

    return {"response": response_text}


@app.post("/auth/register")
@app.post("/api/auth/register")
def register(payload: RegisterRequest) -> dict[str, Any]:
    name = payload.name.strip()
    email = normalize_email(payload.email)
    password = payload.password

    if len(name) < 2:
        raise HTTPException(status_code=422, detail="Name must be at least 2 characters.")
    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
        raise HTTPException(status_code=422, detail="Email format is invalid.")
    if len(password) < 6:
        raise HTTPException(status_code=422, detail="Password must be at least 6 characters.")

    users_collection = get_users_collection()
    now = utc_now()
    document = {
        "name": name,
        "email": email,
        "password_hash": hash_password(password),
        "created_at": now,
        "updated_at": now,
        "is_active": True,
    }

    try:
        inserted = users_collection.insert_one(document)
    except DuplicateKeyError as exc:
        raise HTTPException(status_code=409, detail="An account with this email already exists.") from exc
    except PyMongoError as exc:
        raise HTTPException(status_code=500, detail=f"MongoDB error: {exc}") from exc

    return {
        "message": "Registration successful.",
        "user": {
            "id": str(inserted.inserted_id),
            "name": name,
            "email": email,
        },
    }


@app.post("/auth/login")
@app.post("/api/auth/login")
def login(payload: LoginRequest) -> dict[str, Any]:
    email = normalize_email(payload.email)
    password = payload.password

    users_collection = get_users_collection()
    sessions_collection = get_sessions_collection()

    user_doc = users_collection.find_one({"email": email})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    password_hash = str(user_doc.get("password_hash", ""))
    if not verify_password(password, password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if user_doc.get("is_active", True) is False:
        raise HTTPException(status_code=403, detail="This account is disabled.")

    token = secrets.token_urlsafe(48)
    token_hash = hash_auth_token(token)
    now = utc_now()
    try:
        session_days = int(get_env("AUTH_SESSION_DAYS", "7") or "7")
    except ValueError:
        session_days = 7
    expires_at = now + timedelta(days=max(1, session_days))

    sessions_collection.insert_one(
        {
            "token_hash": token_hash,
            "user_id": user_doc.get("_id"),
            "created_at": now,
            "updated_at": now,
            "last_used_at": now,
            "expires_at": expires_at,
        }
    )

    return {
        "token": token,
        "expires_at": expires_at.isoformat(),
        "user": extract_user_payload(user_doc),
    }


@app.get("/auth/me")
@app.get("/api/auth/me")
def me(authorization: str | None = Header(default=None)) -> dict[str, Any]:
    token = get_token_from_authorization_header(authorization)
    user_doc = get_current_user_from_token(token)
    return {"user": extract_user_payload(user_doc)}


@app.post("/auth/logout")
@app.post("/api/auth/logout")
def logout(authorization: str | None = Header(default=None)) -> dict[str, str]:
    token = get_token_from_authorization_header(authorization)
    sessions_collection = get_sessions_collection()
    sessions_collection.delete_one({"token_hash": hash_auth_token(token)})
    return {"message": "Logged out."}


@app.get("/health")
@app.get("/api/health")
def health() -> dict:
    try:
        get_mongo_client().admin.command("ping")
        database_status = "connected"
    except Exception:
        database_status = "not_connected"
    return {"status": "ok", "database": database_status}


@app.on_event("shutdown")
def close_mongo() -> None:
    global _mongo_client
    if _mongo_client is not None:
        _mongo_client.close()
        _mongo_client = None
