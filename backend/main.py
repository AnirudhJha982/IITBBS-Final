"""
CampusOS AI - Vercel ASGI Application Entrypoint
Provides entrypoint 'main:app' for Vercel Services Python runtime.
Includes sys.modules aliasing for serverless isolation.
"""
import sys
import types
from pathlib import Path

_backend_dir = Path(__file__).resolve().parent
_root_dir = _backend_dir.parent

for _p in [str(_backend_dir), str(_root_dir)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

if "backend" not in sys.modules:
    backend_pkg = types.ModuleType("backend")
    backend_pkg.__path__ = [str(_backend_dir)]
    sys.modules["backend"] = backend_pkg

from app.main import app

__all__ = ["app"]
