import os

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover - optional in some deployments
    load_dotenv = None

from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI

app = Flask(__name__)

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ENV_PATH = os.path.join(PROJECT_ROOT, ".env")

if load_dotenv is not None:
    load_dotenv(dotenv_path=ENV_PATH)


def get_cors_origins():
    origins = os.environ.get("CORS_ORIGINS", "*").strip()
    if origins == "*":
        return "*"
    return [origin.strip() for origin in origins.split(",") if origin.strip()]


CORS(app, origins=get_cors_origins())


def get_openrouter_settings():
    return {
        "base_url": os.environ.get("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"),
        "api_key": os.environ.get("OPENROUTER_API_KEY"),
        "model": os.environ.get("OPENROUTER_MODEL", "liquid/lfm-2.5-1.2b-instruct:free"),
        "site_url": os.environ.get("OPENROUTER_SITE_URL"),
        "app_name": os.environ.get("OPENROUTER_APP_NAME"),
    }


def get_client(settings):
    if not settings["api_key"]:
        return None

    headers = {}
    if settings["site_url"]:
        headers["HTTP-Referer"] = settings["site_url"]
    if settings["app_name"]:
        headers["X-Title"] = settings["app_name"]

    return OpenAI(
        base_url=settings["base_url"],
        api_key=settings["api_key"],
        default_headers=headers or None,
        timeout=30.0,
        max_retries=2,
    )

SYSTEM_PROMPT = """You are Hala AI Assistant, a helpful chatbot for "Bangalore Sehri Finder" app. You help users find Sehri (pre-dawn meal) providers during Ramadan in Bangalore.

Be friendly, concise, and helpful. Provide information about:
- Finding nearby Sehri providers (Masjids, Volunteer groups, Restaurants)
- Prayer times and Sehri/Iftar times
- Free vs Paid options
- How to use the app features
- Ramadan related guidance

Keep responses short and to the point (2-3 sentences max unless asked for more details).
"""


@app.route("/api/chat", methods=["POST"])
@app.route("/chat", methods=["POST"])
def chat():
    try:
        settings = get_openrouter_settings()
        client = get_client(settings)
        if client is None:
            return jsonify({"error": "Server is missing OPENROUTER_API_KEY"}), 500

        data = request.get_json(silent=True) or {}
        user_message = (data.get("message") or "").strip()

        if not user_message:
            return jsonify({"error": "Message is required"}), 400

        completion = client.chat.completions.create(
            model=settings["model"],
            messages=[
                {
                    "role": "system",
                    "content": SYSTEM_PROMPT
                },
                {
                    "role": "user",
                    "content": user_message
                }
            ],
            temperature=0.7,
            max_tokens=256
        )

        bot_response = (completion.choices[0].message.content or "").strip()
        if not bot_response:
            return jsonify({"error": "Model returned an empty response"}), 502

        return jsonify({"response": bot_response})

    except Exception as e:
        print(f"Chat API error: {e}")
        return jsonify({"error": "Unable to process your request right now"}), 502


@app.route("/api/health", methods=["GET"])
@app.route("/health", methods=["GET"])
def health():
    settings = get_openrouter_settings()
    return jsonify(
        {
            "status": "ok",
            "has_openrouter_key": bool(settings["api_key"]),
            "model": settings["model"],
        }
    )


if __name__ == "__main__":
    app.run(debug=True, port=int(os.environ.get("PORT", "5000")))
