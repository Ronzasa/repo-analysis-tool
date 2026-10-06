from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from app.core.metrics.calculator import MetricCalculator
from pathlib import Path

router = APIRouter()

class AnalyzeRequest(BaseModel):
    repo_path: str
    repo_id: str

class AnalyzeResponse(BaseModel):
    file_metrics: List[Dict[str, Any]]
    directory_metrics: List[Dict[str, Any]]
    authors: List[Dict[str, Any]]

@router.post("/analyze")
async def analyze_repository(request: AnalyzeRequest):
    """
    Analyze a repository and return all metrics
    """
    repo_path = Path(request.repo_path)
    
    if not repo_path.exists():
        raise HTTPException(status_code=404, detail=f"Repository path not found: {request.repo_path}")
    
    try:
        calculator = MetricCalculator(str(repo_path))
        
        # Get all commits
        commits = calculator._get_commits()
        
        # Calculate file metrics for all files
        file_metrics = []
        all_files = set()
        for commit in commits:
            diff_stats = calculator._get_diff_stats(commit)
            for file_path in diff_stats.keys():
                all_files.add(file_path)
        
        for file_path in all_files:
            try:
                metrics = calculator.calculate_file_metrics(file_path)
                file_metrics.append({
                    'file_path': file_path,
                    'commit_hash': 'all',
                    'author_id': None,
                    'added_lines': metrics.get('added_lines', 0),
                    'removed_lines': metrics.get('removed_lines', 0),
                    'growth': metrics.get('growth', 0),
                    'churn': metrics.get('churn', 0)
                })
            except:
                pass
        
        # Calculate directory metrics
        directory_metrics = []
        all_dirs = set()
        for file_path in all_files:
            dir_path = str(Path(file_path).parent)
            if dir_path != '.':
                all_dirs.add(dir_path)
        
        for dir_path in all_dirs:
            try:
                metrics = calculator.calculate_directory_metrics(dir_path)
                directory_metrics.append({
                    'dir_path': dir_path,
                    'commit_hash': 'all',
                    'author_id': None,
                    'added_lines': metrics.get('added_lines', 0),
                    'removed_lines': metrics.get('removed_lines', 0),
                    'growth': metrics.get('growth', 0),
                    'churn': metrics.get('churn', 0)
                })
            except:
                pass
        
        # Get authors
        authors = []
        author_set = set()
        for commit in commits:
            author_name = commit.author.name
            author_email = commit.author.email
            author_id = f"{author_name}<{author_email}>"
            
            if author_id not in author_set:
                author_set.add(author_id)
                authors.append({
                    'id': author_id,
                    'name': author_name,
                    'email': author_email
                })
        
        return {
            'file_metrics': file_metrics,
            'directory_metrics': directory_metrics,
            'authors': authors
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
