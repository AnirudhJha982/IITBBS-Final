"""
CampusOS AI - Application Configuration
Configured using Pydantic Settings with support for environment variables and .env files.
"""

import os
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Application Metadata
    APP_NAME: str = "CampusOS AI - Intelligent Campus Scheduling & Venue Management Platform"
    APP_VERSION: str = "1.0.0-alpha"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"

    # Server Configuration
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000
    API_V1_PREFIX: str = "/api/v1"

    # Cross-Origin Resource Sharing (CORS)
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return ["http://localhost:3000", "http://127.0.0.1:3000"]

    # Database Configuration
    # Defaults to local SQLite for immediate standalone execution; switches to PostgreSQL via env var
    DATABASE_URL: str = "sqlite+aiosqlite:///./campusos_local.db"
    DATABASE_ECHO: bool = False
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_database_url(cls, v: Union[str, None]) -> str:
        url = v or "sqlite+aiosqlite:///./campusos_local.db"
        # On Vercel serverless functions the project directory is read-only; use /tmp for SQLite
        if os.environ.get("VERCEL") and url.startswith("sqlite") and "/tmp" not in url:
            return "sqlite+aiosqlite:////tmp/campusos_local.db"
        return url

    # Security & Tokens
    SECRET_KEY: str = "development-temporary-secret-key-must-be-rotated-for-production-min32char"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    # AI Provider Settings
    AI_PROVIDER: str = "mock"  # "mock", "openai", "gemini", "azure", "anthropic"
    AI_API_KEY: str = ""
    AI_MODEL_NAME: str = "gpt-4o"
    AI_TEMPERATURE: float = 0.1
    AI_MAX_TOKENS: int = 2048

    # Solver Parameters (Google OR-Tools CP-SAT)
    SOLVER_TIME_LIMIT_SECONDS: int = 120
    SOLVER_NUM_WORKERS: int = 8
    SOLVER_ENABLE_LOGS: bool = False

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
