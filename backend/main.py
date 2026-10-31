"""
CampusOS AI - Vercel ASGI Application Entrypoint
Provides entrypoint 'main:app' for Vercel Services Python runtime.
"""
import sys
from pathlib import Path

# Ensure backend root and project root are in sys.path
_backend_dir = Path(__file__).resolve().parent
_root_dir = _backend_dir.parent

for _p in [str(_backend_dir), str(_root_dir)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

from app.main import app

__all__ = ["app"]
