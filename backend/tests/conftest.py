import pytest
from datetime import datetime, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from starlette.testclient import TestClient

from app.database.database import Base, get_db
from app.database.models import CachedLoan, LoanMetadata, UserProfile
from app.main import app
from app.services.blockchain_service import blockchain_service

# Use in-memory SQLite database for unit tests
TEST_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def db_session():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def seed_sample_data(db_session):
    """Seed test SQLite database with sample cached loan and metadata."""
    loan = CachedLoan(
        loan_id=1,
        borrower_address="0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        lender_address="0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
        principal_eth=2.5,
        principal_wei="2500000000000000000",
        interest_rate_bps=950,
        duration_seconds=5184000,
        status="ACTIVE",
        total_due_eth=2.539,
        total_repaid_eth=1.0,
        created_at=datetime.utcnow(),
        is_synced_with_chain=True,
    )
    db_session.add(loan)

    meta = LoanMetadata(
        loan_id=1,
        title="Compute Server Expansion",
        purpose="Procurement of high-performance enterprise GPUs.",
    )
    db_session.add(meta)

    user = UserProfile(
        wallet_address="0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        display_name="Borrower One",
        bio="Decentralized infrastructure engineer",
    )
    db_session.add(user)

    db_session.commit()
    return {"loan": loan, "meta": meta, "user": user}
