"""
CampusOS AI - Natural Language & Hinglish Request Parser (Placeholder)
Parses conversational requests and converts them into structured booking proposals.

IMPORTANT ARCHITECTURAL RULE:
All extracted entities MUST undergo deterministic backend validation against
official room capacities, existing timetables, and conflict rules before booking creation.
"""

from typing import Any, Dict, Optional
from pydantic import BaseModel, Field
from backend.app.ai.provider import BaseAIProvider, get_ai_provider


class ParsedVenueBookingRequest(BaseModel):
    original_prompt: str
    target_event_name: Optional[str] = None
    attendee_count: Optional[int] = None
    preferred_room_type: Optional[str] = None
    requested_day: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    extracted_language: str = "English"
    confidence_score: float = 0.0
    deterministic_validation_status: str = "PENDING_VALIDATION"


class AIRequestParser:
    """
    Parses conversational booking and timetable queries into strongly-typed proposals.
    """

    def __init__(self, provider: Optional[BaseAIProvider] = None):
        self.provider = provider or get_ai_provider()

    async def parse_booking_prompt(self, prompt: str) -> ParsedVenueBookingRequest:
        """
        Extracts booking parameters from unstructured English or Hinglish text.
        Example Hinglish: 'Bhai kal 3 baje CSE lab chahiye 40 logo ke liye'
        """
        response = await self.provider.generate_structured_response(
            prompt=prompt,
            system_instruction="Extract campus booking parameters strictly to JSON schema.",
        )
        return ParsedVenueBookingRequest(
            original_prompt=prompt,
            extracted_language="Hinglish" if any(w in prompt.lower() for w in ["bhai", "chahiye", "kal", "parso", "baje"]) else "English",
            deterministic_validation_status="PENDING_VALIDATION",
        )
