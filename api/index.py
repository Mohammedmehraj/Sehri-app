import os
import re
from datetime import date, datetime
from typing import Any

from dotenv import load_dotenv
from bson import ObjectId
from fastapi import FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.errors import PyMongoError

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


def get_env(name: str, default: str | None = None) -> str | None:
    value = os.getenv(name, default)
    if value is None:
        return None
    cleaned = value.strip()
    return cleaned or default


def get_mongo_client() -> MongoClient:
    global _mongo_client

    if _mongo_client is not None:
        return _mongo_client

    mongodb_uri = get_env("MONGODB_URI")
    if not mongodb_uri:
        raise RuntimeError("MONGODB_URI is not set.")

    _mongo_client = MongoClient(mongodb_uri, serverSelectionTimeoutMS=7000)
    return _mongo_client


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
def chat(_: ChatRequest) -> dict:
    return {"response": "Hello World"}


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
