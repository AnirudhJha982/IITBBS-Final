"""
CampusOS AI - Common Base Schemas
Provides generic response structures, pagination parameters, and error envelopes.
"""

from typing import Generic, TypeVar, Optional, List, Any
from pydantic import BaseModel, Field

DataT = TypeVar("DataT")


class APIResponse(BaseModel, Generic[DataT]):
    success: bool = Field(True, description="Indicates whether the request succeeded")
    message: str = Field("Operation completed successfully", description="User-facing status message")
    data: Optional[DataT] = Field(None, description="Payload data")
    error: Optional[dict[str, Any]] = Field(None, description="Error diagnostics if success is False")


class PaginationParams(BaseModel):
    page: int = Field(1, ge=1, description="Page number starting at 1")
    page_size: int = Field(20, ge=1, le=100, description="Items per page")


class PaginatedResponse(BaseModel, Generic[DataT]):
    items: List[DataT]
    total: int
    page: int
    page_size: int
    total_pages: int
