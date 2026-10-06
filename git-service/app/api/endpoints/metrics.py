from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from datetime import datetime
from app.core.metrics.calculator import MetricCalculator
from app.core.config import settings

router = APIRouter()

@router.get("/file/{repo_id}")
async def get_file_metrics(
    repo_id: str,
    file_path: str = Query(...),
    start_time: Optional[int] = None,
    end_time: Optional[int] = None,
    commits: Optional[List[str]] = None
):
    """Get file metrics"""
    repo_path = settings.REPOS_DIR / repo_id
    
    if not repo_path.exists():
        raise HTTPException(status_code=404, detail="Repository not found")
    
    try:
        calculator = MetricCalculator(str(repo_path))
        metrics = calculator.calculate_file_metrics(
            file_path=file_path,
            start_time=start_time,
            end_time=end_time,
            commit_hashes=commits
        )
        return {"file": file_path, "metrics": metrics}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/directory/{repo_id}")
async def get_directory_metrics(
    repo_id: str,
    dir_path: str = Query(...),
    start_time: Optional[int] = None,
    end_time: Optional[int] = None,
    commits: Optional[List[str]] = None
):
    """Get directory metrics"""
    repo_path = settings.REPOS_DIR / repo_id
    
    if not repo_path.exists():
        raise HTTPException(status_code=404, detail="Repository not found")
    
    try:
        calculator = MetricCalculator(str(repo_path))
        metrics = calculator.calculate_directory_metrics(
            dir_path=dir_path,
            start_time=start_time,
            end_time=end_time,
            commit_hashes=commits
        )
        return {"directory": dir_path, "metrics": metrics}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/repo/{repo_id}")
async def get_repo_metrics(
    repo_id: str,
    start_time: Optional[int] = None,
    end_time: Optional[int] = None,
    commits: Optional[List[str]] = None
):
    """Get repository metrics"""
    repo_path = settings.REPOS_DIR / repo_id
    
    if not repo_path.exists():
        raise HTTPException(status_code=404, detail="Repository not found")
    
    try:
        calculator = MetricCalculator(str(repo_path))
        metrics = calculator.calculate_repo_metrics(
            start_time=start_time,
            end_time=end_time,
            commit_hashes=commits
        )
        return {"repo_id": repo_id, "metrics": metrics}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/author/{repo_id}")
async def get_author_metrics(
    repo_id: str,
    author: str = Query(...),
    start_time: Optional[int] = None,
    end_time: Optional[int] = None,
    commits: Optional[List[str]] = None
):
    """Get author metrics"""
    repo_path = settings.REPOS_DIR / repo_id
    
    if not repo_path.exists():
        raise HTTPException(status_code=404, detail="Repository not found")
    
    try:
        calculator = MetricCalculator(str(repo_path))
        metrics = calculator.calculate_author_metrics(
            author=author,
            start_time=start_time,
            end_time=end_time,
            commit_hashes=commits
        )
        return {"author": author, "metrics": metrics}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
