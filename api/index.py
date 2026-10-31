"""
CampusOS AI - Root API Serverless Entrypoint for Vercel
Directly exposes the full FastAPI application with all 10 domain routers.
"""
import sys
from pathlib import Path

_root = Path(__file__).resolve().parent.parent
_backend = _root / "backend"
for _p in [str(_root), str(_backend)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

from backend.app.main import app

__all__ = ["app"]
