import sys
from pathlib import Path

# Automatically ensure both repository root and backend directory are in sys.path
_root = Path(__file__).resolve().parent.parent.parent
_backend = Path(__file__).resolve().parent.parent
for _p in [str(_root), str(_backend)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)
