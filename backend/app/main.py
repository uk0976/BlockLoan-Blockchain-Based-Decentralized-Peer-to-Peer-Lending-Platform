from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Dict, Any

from app.core.config import settings
from app.database.database import engine, Base
from app.schemas.loan import HealthResponse
from app.services.blockchain_service import blockchain_service
from app.api import api_router

# Initialize SQLite database schema
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API and On-Chain Event Indexer for BlockLoan Peer-to-Peer Lending Platform",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration restricted to authorized frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


from sqlalchemy.exc import SQLAlchemyError

# =============================================================================
# EXCEPTION HANDLERS
# =============================================================================

@app.exception_handler(ConnectionError)
async def connection_error_handler(request: Request, exc: ConnectionError):
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={"detail": str(exc), "type": "BlockchainConnectionError"},
    )


@app.exception_handler(RuntimeError)
async def runtime_error_handler(request: Request, exc: RuntimeError):
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={"detail": str(exc), "type": "ContractDeploymentError"},
    )


@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_error_handler(request: Request, exc: SQLAlchemyError):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Database operation failed. Integrity verified.", "type": "DatabaseError"},
    )


@app.exception_handler(LookupError)
async def lookup_error_handler(request: Request, exc: LookupError):
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"detail": str(exc), "type": "NotFoundError"},
    )


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": str(exc), "type": "ValidationError"},
    )


# =============================================================================
# TOP-LEVEL HEALTH & DIAGNOSTIC ENDPOINTS
# =============================================================================

@app.get("/api/health", response_model=HealthResponse, tags=["Health"])
def health_check():
    """
    Health check endpoint to verify backend operational status,
    RPC connectivity, and contract deployment.
    """
    is_connected = blockchain_service.is_connected()
    chain_id = blockchain_service.get_chain_id() if is_connected else None
    contract_deployed = blockchain_service.is_contract_deployed() if is_connected else False
    contract_address = blockchain_service.get_contract_address()

    return HealthResponse(
        status="ok",
        project="BlockLoan",
        blockchain_connected=is_connected,
        chain_id=chain_id,
        contract_deployed=contract_deployed,
        contract_address=contract_address,
        version="0.1.0",
    )


@app.get("/api/blockchain/status", tags=["Blockchain"])
def get_blockchain_status() -> Dict[str, Any]:
    """Detailed diagnostics of local node, chain ID, and contract."""
    return blockchain_service.get_status_overview()


# Mount feature routers under /api
app.include_router(api_router)
