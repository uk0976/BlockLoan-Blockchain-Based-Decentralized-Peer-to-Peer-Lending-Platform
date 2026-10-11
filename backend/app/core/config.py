from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "BlockLoan Backend API"
    BACKEND_HOST: str = "127.0.0.1"
    BACKEND_PORT: int = 8000
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "sqlite:///./blockloan.db"

    # Blockchain (Hardhat local network default)
    BLOCKCHAIN_RPC_URL: str = "http://127.0.0.1:8545"
    BLOCKLOAN_CONTRACT_ADDRESS: str = ""
    EXPECTED_CHAIN_ID: int = 31337

    # Security: CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
