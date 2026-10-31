"""
CampusOS AI - Independent Constraint Validator Adapter (Placeholder Architecture)

CRITICAL RULE COMPLIANCE:
This module DOES NOT create or fake the official validator.py.
The official validator.py will be supplied in data/official/validator.py with the starter pack.
This class will act as the application-level adapter to invoke the official validator
and verify schedules against 100% of official ground-truth rules without fabrication.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class ValidationResult(BaseModel):
    is_valid: bool = False
    violations_count: int = 0
    hard_constraint_violations: List[str] = []
    soft_constraint_penalties: Dict[str, float] = {}
    summary: str = "Validator pending integration of official validator.py"


class OfficialValidatorAdapter:
    """
    Adapter bridging CampusOS AI data models with the official hackathon validator.py.
    """

    def __init__(self, official_validator_path: Optional[str] = None):
        self.official_validator_path = official_validator_path
        self._is_official_validator_loaded = False

    def is_loaded(self) -> bool:
        return self._is_official_validator_loaded

    def validate_schedule(self, schedule_data: Dict[str, Any]) -> ValidationResult:
        """
        Executes validation via the official validator.py once provided in the starter pack.
        """
        raise NotImplementedError(
            "Validation cannot be executed until official validator.py is placed in data/official/."
        )
