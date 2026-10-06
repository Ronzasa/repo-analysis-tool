from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import pygit2
from pathlib import Path
from app.core.config import settings

router = APIRouter()

class CloneRequest(BaseModel):
    url: str
    name: Optional[str] = None

class RepoInfo(BaseModel):
    id: str
    name: str
    path: str
    commit_count: int
    branch_count: int

@router.post("/clone")
async def clone_repository(request: CloneRequest):
    """Clone a remote repository"""
    try:
        repo_name = request.name or request.url.split('/')[-1].replace('.git', '')
        repo_path = settings.REPOS_DIR / repo_name
        
        if repo_path.exists():
            raise HTTPException(status_code=400, detail="Repository already exists")
        
        # Clone the repository
        repo = pygit2.clone_repository(request.url, str(repo_path))
        
        # Count commits
        commit_count = 0
        for commit in repo.walk(repo.head.target):
            commit_count += 1
        
        return {
            "message": "Repository cloned successfully",
            "repo": {
                "id": repo_name,
                "name": repo_name,
                "path": str(repo_path),
                "commit_count": commit_count,
                "branch_count": len([ref for ref in repo.references if ref.startswith('refs/heads/')])
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/info/{repo_id}")
async def get_repo_info(repo_id: str):
    """Get repository information"""
    repo_path = settings.REPOS_DIR / repo_id
    
    if not repo_path.exists():
        raise HTTPException(status_code=404, detail="Repository not found")
    
    try:
        repo = pygit2.Repository(str(repo_path))
        
        commit_count = 0
        for commit in repo.walk(repo.head.target):
            commit_count += 1
        
        return {
            "id": repo_id,
            "name": repo_id,
            "path": str(repo_path),
            "commit_count": commit_count,
            "branch_count": len([ref for ref in repo.references if ref.startswith('refs/heads/')])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
