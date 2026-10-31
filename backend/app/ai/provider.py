"""
CampusOS AI - AI Provider Abstraction Interface
Allows dynamic provider switching (OpenAI, Gemini, Anthropic, Azure, Local, Mock)
without changing business logic or constraint validation interfaces.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field
from backend.app.core.config import settings


class AIResponse(BaseModel):
    raw_text: str
    parsed_json: Optional[Dict[str, Any]] = None
    provider: str
    model: str
    tokens_used: int = 0


class BaseAIProvider(ABC):
    """Abstract contract for LLM integrations."""

    @abstractmethod
    async def generate_structured_response(
        self,
        prompt: str,
        system_instruction: str,
        response_schema: Optional[Dict[str, Any]] = None,
    ) -> AIResponse:
        """Generates a guaranteed structured response from the underlying model."""
        pass


class MockAIProvider(BaseAIProvider):
    """
    Mock implementation for testing and development environments without active API keys.
    Simulates structured responses for venue requests in English and Hinglish.
    """

    async def generate_structured_response(
        self,
        prompt: str,
        system_instruction: str,
        response_schema: Optional[Dict[str, Any]] = None,
    ) -> AIResponse:
        return AIResponse(
            raw_text="Mock AI Provider: Request received. Structured parsing ready.",
            parsed_json={
                "intent": "venue_inquiry",
                "extracted_parameters": {
                    "raw_query": prompt,
                    "language_detected": "Hinglish/English",
                    "requires_backend_validation": True,
                },
                "confidence": 0.95,
            },
            provider="mock",
            model="mock-deterministic-v1",
            tokens_used=12,
        )


def get_ai_provider() -> BaseAIProvider:
    """Factory returning the configured AI provider based on environment settings."""
    provider_name = settings.AI_PROVIDER.lower()
    if provider_name == "mock" or not settings.AI_API_KEY:
        return MockAIProvider()
    # Extensions for openai, gemini, etc. will be enabled when keys are supplied in .env
    return MockAIProvider()
