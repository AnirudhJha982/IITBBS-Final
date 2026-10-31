"""
CampusOS AI - Vercel ASGI Application Entrypoint
Provides entrypoint 'main:app' for Vercel Services Python runtime.
Includes sys.modules aliasing for serverless isolation and fail-safe diagnostic reporting.
"""
import sys
import types
import traceback
from pathlib import Path

# Ensure backend root and project root are in sys.path
_backend_dir = Path(__file__).resolve().parent
_root_dir = _backend_dir.parent

for _p in [str(_backend_dir), str(_root_dir)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

# Ensure 'backend' module is resolvable in isolated serverless containers where root is 'backend/'
if "backend" not in sys.modules:
    backend_pkg = types.ModuleType("backend")
    backend_pkg.__path__ = [str(_backend_dir)]
    sys.modules["backend"] = backend_pkg

try:
    from app.main import app
except Exception as e:
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse

    err_trace = traceback.format_exc()
    app = FastAPI(title="CampusOS AI Startup Diagnostic")

    @app.api_route("/", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"])
    @app.api_route("/{full_path:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"])
    async def startup_error_fallback(full_path: str = ""):
        return JSONResponse(
            status_code=500,
            content={
                "error": "StartupImportError",
                "message": str(e),
                "traceback": err_trace,
                "sys_path": sys.path,
            }
        )
else:
    @app.get("/api/v1/health-check", tags=["Probe"])
    async def direct_probe():
        return {"status": "ok", "entrypoint": "backend.main:app"}

__all__ = ["app"]
