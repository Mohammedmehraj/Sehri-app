from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Sehri Finder API", version="1.0.0")


class ChatRequest(BaseModel):
    message: str


@app.get("/")
@app.get("/api")
def api_root() -> dict:
    return {"message": "Sehri Finder API is running."}


@app.get("/hello")
@app.get("/api/hello")
def hello_world() -> dict:
    return {"message": "Hello World"}


@app.post("/chat")
@app.post("/api/chat")
def chat(_: ChatRequest) -> dict:
    return {"response": "Hello World"}


@app.get("/health")
@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}
