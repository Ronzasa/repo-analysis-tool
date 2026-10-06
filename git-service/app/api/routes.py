from fastapi import APIRouter
from app.api.endpoints import git, metrics, analyze

router = APIRouter()

router.include_router(git.router, prefix="/git", tags=["git"])
router.include_router(metrics.router, prefix="/metrics", tags=["metrics"])
router.include_router(analyze.router, tags=["analyze"])
