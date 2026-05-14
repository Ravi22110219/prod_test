import os
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field


class EchoRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=240)


class EchoResponse(BaseModel):
    received: str
    reply: str
    length: int
    timestamp: str


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def cors_origins() -> list[str]:
    configured = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    )
    return [origin.strip() for origin in configured.split(",") if origin.strip()]


app = FastAPI(
    title="React FastAPI Deployment Test",
    version="0.1.0",
    description="A tiny API used to verify frontend/backend deployment.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "fastapi-backend",
        "timestamp": utc_now(),
    }


@app.get("/api/greeting")
def greeting(name: str = "friend") -> dict[str, str]:
    clean_name = name.strip() or "friend"
    return {
        "message": f"Hello {clean_name}. Your React app is connected to FastAPI.",
        "timestamp": utc_now(),
    }


@app.post("/api/echo", response_model=EchoResponse)
def echo(payload: EchoRequest) -> EchoResponse:
    message = payload.message.strip()
    return EchoResponse(
        received=message,
        reply=f"FastAPI received: {message}",
        length=len(message),
        timestamp=utc_now(),
    )


static_dir = Path(__file__).resolve().parent.parent / "static"

if static_dir.exists():
    static_root = static_dir.resolve()
    assets_dir = static_dir / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.api_route("/{full_path:path}", methods=["GET", "HEAD"], include_in_schema=False)
    def serve_react_app(full_path: str) -> FileResponse:
        requested_file = (static_root / full_path).resolve()
        if (
            full_path
            and requested_file.is_relative_to(static_root)
            and requested_file.is_file()
        ):
            return FileResponse(requested_file)

        return FileResponse(static_root / "index.html")
else:

    @app.get("/")
    def api_root() -> dict[str, str]:
        return {
            "message": "FastAPI backend is running. Start React dev server or build the frontend.",
            "docs": "/docs",
        }
