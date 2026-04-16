from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import structlog
import time
from typing import Callable

from .routers import api_router
from .services.ai_service import ai_service

structlog.configure(
    processors=[
        structlog.processors.TimeProfiler(),
        structlog.processors.JSONRenderer(),
    ]
)
logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("application_startup", version="1.0.0")
    yield
    logger.info("application_shutdown")


app = FastAPI(
    title="LeadGen Pro API",
    description="AI-Powered Lead Generation Platform API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def logging_middleware(request: Request, call_next: Callable):
    start_time = time.time()

    logger.info(
        "request_started",
        method=request.method,
        path=request.url.path,
    )

    response = await call_next(request)

    process_time = time.time() - start_time
    logger.info(
        "request_completed",
        method=request.method,
        path=request.url.path,
        status_code=response.status_code,
        process_time_ms=round(process_time * 1000, 2),
    )

    response.headers["X-Process-Time"] = str(round(process_time * 1000, 2))
    return response


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("unhandled_exception", error=str(exc), path=request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": str(exc)},
    )


app.include_router(api_router)


@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}


@app.get("/")
async def root():
    return {
        "message": "LeadGen Pro API",
        "docs": "/docs",
        "health": "/health",
    }
