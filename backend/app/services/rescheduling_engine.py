"""
CampusOS AI - Timetable Disruption & Rescheduling Engine
Calculates minimal-displacement schedule repairs when room closures or faculty absences occur.
"""

import copy
import json
from pathlib import Path
from typing import Dict, Any, List
from backend.app.core.logging import logger
from backend.app.scheduling.engine import SchedulingEngine


class RescheduleProposal:
    def __init__(self, disruption_id: str = ""):
        self.disruption_id = disruption_id
        self.affected_sessions: List[str] = []
        self.relocations: List[Dict[str, Any]] = []
        self.impact_score: float = 0.0
        self.status: str = "PENDING"


def apply_disruption_to_data(data: Dict[str, Any], disruption: Dict[str, Any]) -> Dict[str, Any]:
    """Applies official disruption changes to master dataset."""
    d = copy.deepcopy(data)
    fac = {f["id"]: f for f in d["faculty"]}

    for ch in disruption.get("changes", []):
        t = ch["type"]
        if t == "faculty_unavailable":
            for day in ch["days"]:
                fac[ch["faculty_id"]]["unavailable"].append({
                    "day": day,
                    "periods": ch["periods"],
                    "reason": ch.get("reason", "")
                })
        elif t == "room_unavailable":
            for day in ch["days"]:
                d["room_unavailability"].append({
                    "room_id": ch["room_id"],
                    "day": day,
                    "periods": ch["periods"],
                    "reason": ch.get("reason", "")
                })
        elif t == "add_faculty":
            d["faculty"].append(ch["faculty"])
            fac[ch["faculty"]["id"]] = ch["faculty"]
        elif t == "add_session":
            d["sessions"].append(ch["session"])
        elif t == "remove_session":
            d["sessions"] = [s for s in d["sessions"] if s["id"] != ch["session_id"]]
        elif t == "session_fixed_slot":
            target = next((s for s in d["sessions"] if s["id"] == ch["session_id"]), None)
            if target is None:
                raise ValueError(f"Unknown academic session: {ch['session_id']}")
            target["fixed_slot"] = {"day": ch["day"], "start_period": int(ch["start_period"])}
        else:
            raise ValueError(f"Unknown change type: {t}")

    return d


class ReschedulingEngine:
    """
    Minimizes schedule displacement while ensuring 100% hard constraint satisfaction.
    Target: Minimize sessions moved from baseline.
    """

    def __init__(self, time_limit_seconds: int = 120, num_workers: int = 8):
        self.time_limit_seconds = time_limit_seconds
        self.num_workers = num_workers

    def repair_schedule(
        self,
        base_data: Dict[str, Any],
        disruption: Dict[str, Any],
        baseline_schedule: Dict[str, Any],
        team_name: str = "CampusOS AI",
    ) -> Dict[str, Any]:
        """
        Solves repaired timetable minimizing sessions moved from baseline.
        """
        repaired_data = apply_disruption_to_data(base_data, disruption)
        baseline_sessions = {s["session_id"]: s for s in baseline_schedule.get("sessions", [])}

        engine = SchedulingEngine(time_limit_seconds=self.time_limit_seconds, num_workers=self.num_workers)

        # Solve master timetable for repaired dataset
        # We can bias the solver to stay as close to baseline as possible
        repaired_master = engine.solve_master_timetable(repaired_data, baseline_schedule, minimize_movement=True)

        # Spectra bookings evaluation on repaired schedule
        fest_week = engine.solve_spectra_bookings(repaired_data, repaired_master)

        return {
            "team": team_name,
            "dataset_id": repaired_data.get("dataset_id", "cit-public-v1"),
            "sessions": repaired_master,
            "fest_week": fest_week,
            "exams": baseline_schedule.get("exams", []),
        }
