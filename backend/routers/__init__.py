from fastapi import APIRouter

from .leads import router as leads_router
from .ai import router as ai_router

api_router = APIRouter()

api_router.include_router(leads_router)
api_router.include_router(ai_router)
