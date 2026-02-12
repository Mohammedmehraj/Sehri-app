import os

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover
    load_dotenv = None

from openai import OpenAI

if load_dotenv is not None:
    load_dotenv()

api_key = os.environ.get("OPENROUTER_API_KEY")
if not api_key:
    raise RuntimeError("Missing OPENROUTER_API_KEY")

client = OpenAI(
    base_url=os.environ.get("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"),
    api_key=api_key,
)

completion = client.chat.completions.create(
    extra_headers={
        "HTTP-Referer": os.environ.get("OPENROUTER_SITE_URL", "https://localhost"),
        "X-Title": os.environ.get("OPENROUTER_APP_NAME", "Local Test"),
    },
    model=os.environ.get("OPENROUTER_MODEL", "liquid/lfm-2.5-1.2b-instruct:free"),
    messages=[{"role": "user", "content": "What is your name?"}],
)

print(completion.choices[0].message.content)
