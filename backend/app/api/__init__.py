from fastapi import APIRouter
from app.api.loans import router as loans_router
from app.api.repayments import router as repayments_router
from app.api.users import router as users_router
from app.api.admin import router as admin_router

api_router = APIRouter(prefix="/api")
api_router.include_router(loans_router)
api_router.include_router(repayments_router)
api_router.include_router(users_router)
api_router.include_router(admin_router)

__all__ = ["api_router"]
