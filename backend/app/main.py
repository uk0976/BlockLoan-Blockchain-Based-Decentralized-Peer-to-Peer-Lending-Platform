from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from app.core.config import settings
from app.database.session import engine, Base, get_db
from app.schemas.loan import HealthResponse, LoanResponse
from app.services.blockchain import blockchain_service

# Initialize SQLite database schema
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API and On-chain Event Indexer for BlockLoan Decentralized Lending Platform",
    version="0.1.0",
)

# Configure CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", response_model=HealthResponse, tags=["Health"])
def health_check():
    """Health check endpoint to verify backend status and blockchain node connectivity."""
    is_chain_live = blockchain_service.is_connected()
    return HealthResponse(
        status="ok",
        project="BlockLoan",
        blockchain_connected=is_chain_live,
        version="0.1.0"
    )


@app.get("/api/loans", response_model=List[LoanResponse], tags=["Loans"])
def list_cached_loans(db: Session = Depends(get_db)):
    """
    List indexed loans cached from on-chain events.
    (Detailed indexing service will be populated in subsequent phase).
    """
    return []
