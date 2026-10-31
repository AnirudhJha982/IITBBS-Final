"""
CampusOS AI - Production Schedule & Dataset Loader
Ensures bulletproof asset resolution across local, Docker, and Vercel serverless function containers.
"""

import json
from pathlib import Path
from typing import Dict, Any, Optional
from backend.app.core.logging import logger

_APP_DIR = Path(__file__).resolve().parent.parent
_PROJECT_ROOT = _APP_DIR.parent.parent


def _resolve_file(internal_name: str, fallback_relative_path: str) -> Path:
    # 1. Prefer backend internal package data (guaranteed inside Vercel serverless zip)
    internal_path = _APP_DIR / "data" / internal_name
    if internal_path.exists():
        return internal_path

    # 2. Project root path (local dev & testing)
    root_path = _PROJECT_ROOT / fallback_relative_path
    if root_path.exists():
        return root_path

    # 3. Relative to current working directory
    cwd_path = Path.cwd() / fallback_relative_path
    if cwd_path.exists():
        return cwd_path

    return internal_path


class ScheduleLoader:
    _cached_dataset: Optional[Dict[str, Any]] = None
    _cached_baseline: Optional[Dict[str, Any]] = None
    _cached_disrupted: Optional[Dict[str, Any]] = None

    @classmethod
    def get_master_dataset_path(cls) -> Path:
        return _resolve_file("cit_public.json", "data/official/cit_public.json")

    @classmethod
    def get_baseline_schedule_path(cls) -> Path:
        return _resolve_file("schedule.json", "exports/schedule.json")

    @classmethod
    def get_disrupted_schedule_path(cls) -> Path:
        return _resolve_file("schedule_after.json", "exports/schedule_after.json")

    @classmethod
    def get_sample_disruption_path(cls) -> Path:
        return _resolve_file("sample_disruption.json", "data/official/examples/sample_disruption.json")

    @classmethod
    def load_dataset(cls, force_reload: bool = False) -> Dict[str, Any]:
        if cls._cached_dataset is not None and not force_reload:
            return cls._cached_dataset
        path = cls.get_master_dataset_path()
        if not path.exists():
            logger.error(f"Master dataset not found at {path}")
            return {}
        with open(path, "r", encoding="utf-8") as f:
            cls._cached_dataset = json.load(f)
        return cls._cached_dataset

    @classmethod
    def load_baseline_schedule(cls, force_reload: bool = False) -> Dict[str, Any]:
        if cls._cached_baseline is not None and not force_reload:
            return cls._cached_baseline
        path = cls.get_baseline_schedule_path()
        if not path.exists():
            logger.error(f"Baseline schedule not found at {path}")
            return {}
        with open(path, "r", encoding="utf-8") as f:
            cls._cached_baseline = json.load(f)
        return cls._cached_baseline

    @classmethod
    def load_disrupted_schedule(cls, force_reload: bool = False) -> Dict[str, Any]:
        if cls._cached_disrupted is not None and not force_reload:
            return cls._cached_disrupted
        path = cls.get_disrupted_schedule_path()
        if not path.exists():
            logger.error(f"Disrupted schedule not found at {path}")
            return {}
        with open(path, "r", encoding="utf-8") as f:
            cls._cached_disrupted = json.load(f)
        return cls._cached_disrupted

    @classmethod
    def save_baseline_schedule(cls, schedule: Dict[str, Any]) -> None:
        cls._cached_baseline = schedule
        path = cls.get_baseline_schedule_path()
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(schedule, f, indent=2)

    @classmethod
    def save_disrupted_schedule(cls, schedule: Dict[str, Any]) -> None:
        cls._cached_disrupted = schedule
        path = cls.get_disrupted_schedule_path()
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(schedule, f, indent=2)
