from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from app.core.metrics.calculator import MetricCalculator
from pathlib import Path
import time

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
    Optimized for large repositories with single-pass processing
    """
    repo_path = Path(request.repo_path)
    
    if not repo_path.exists():
        raise HTTPException(status_code=404, detail=f"Repository path not found: {request.repo_path}")
    
    start_time = time.time()
    
    try:
        calculator = MetricCalculator(str(repo_path))
        
        # Get all commits
        commits = calculator._get_commits()
        print(f"Found {len(commits)} commits")
        
        # Single pass: collect file changes and authors simultaneously
        file_changes = {}  # file_path -> {added, removed}
        author_set = set()
        authors = []
        
        for i, commit in enumerate(commits):
            # Collect authors
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
            
            # Collect file changes from diff stats
            try:
                diff_stats = calculator._get_diff_stats(commit)
                for file_path, stats in diff_stats.items():
                    if file_path not in file_changes:
                        file_changes[file_path] = {'added': 0, 'removed': 0}
                    file_changes[file_path]['added'] += stats.get('additions', 0)
                    file_changes[file_path]['removed'] += stats.get('deletions', 0)
            except Exception as e:
                # Skip commits that fail to parse
                pass
            
            # Progress logging for large repos
            if (i + 1) % 10000 == 0:
                print(f"Processed {i + 1}/{len(commits)} commits...")
        
        print(f"Found {len(file_changes)} unique files and {len(authors)} authors")
        
        # Build file metrics from aggregated changes
        file_metrics = []
        for file_path, changes in file_changes.items():
            added = changes['added']
            removed = changes['removed']
            file_metrics.append({
                'file_path': file_path,
                'commit_hash': 'all',
                'author_id': None,
                'added_lines': added,
                'removed_lines': removed,
                'growth': added - removed,
                'churn': added + removed
            })
        
        # Build directory metrics by aggregating file metrics
        dir_metrics_map = {}
        for fm in file_metrics:
            dir_path = str(Path(fm['file_path']).parent)
            if dir_path not in dir_metrics_map:
                dir_metrics_map[dir_path] = {'added': 0, 'removed': 0}
            dir_metrics_map[dir_path]['added'] += fm['added_lines']
            dir_metrics_map[dir_path]['removed'] += fm['removed_lines']
        
        directory_metrics = []
        for dir_path, changes in dir_metrics_map.items():
            if dir_path != '.':
                directory_metrics.append({
                    'dir_path': dir_path,
                    'commit_hash': 'all',
                    'author_id': None,
                    'added_lines': changes['added'],
                    'removed_lines': changes['removed'],
                    'growth': changes['added'] - changes['removed'],
                    'churn': changes['added'] + changes['removed']
                })
        
        elapsed = time.time() - start_time
        print(f"Analysis completed in {elapsed:.2f} seconds")
        print(f"File metrics: {len(file_metrics)}, Directory metrics: {len(directory_metrics)}, Authors: {len(authors)}")
        
        return {
            'file_metrics': file_metrics,
            'directory_metrics': directory_metrics,
            'authors': authors
        }
        
    except Exception as e:
        elapsed = time.time() - start_time
        print(f"Analysis failed after {elapsed:.2f} seconds: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
