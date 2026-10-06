"""
Git operations module for repository management
"""
import pygit2
from pathlib import Path
from typing import Optional
import shutil


def clone_repository(url: str, target_path: str, bare: bool = False) -> str:
    """
    Clone a remote repository to local path.
    
    Args:
        url: Remote repository URL
        target_path: Local path to clone to
        bare: Whether to create a bare repository
    
    Returns:
        Path to cloned repository
    
    Raises:
        Exception: If clone fails
    """
    target = Path(target_path)
    
    # Check if target already exists
    if target.exists():
        raise ValueError(f"Target path already exists: {target_path}")
    
    # Create parent directory if needed
    target.parent.mkdir(parents=True, exist_ok=True)
    
    try:
        # Clone the repository
        repo = pygit2.clone_repository(url, str(target), bare=bare)
        
        # Set HEAD to default branch if not bare
        if not bare and repo.head_is_unborn:
            # Try to set HEAD to main or master
            for branch in ['main', 'master']:
                if f'refs/heads/{branch}' in repo.references:
                    repo.set_head(f'refs/heads/{branch}')
                    break
        
        return str(target)
    except Exception as e:
        # Cleanup on failure
        if target.exists():
            shutil.rmtree(target)
        raise Exception(f"Failed to clone repository: {str(e)}")


def open_repository(repo_path: str) -> pygit2.Repository:
    """
    Open an existing git repository.
    
    Args:
        repo_path: Path to repository
    
    Returns:
        pygit2.Repository instance
    
    Raises:
        Exception: If repository cannot be opened
    """
    try:
        return pygit2.Repository(repo_path)
    except Exception as e:
        raise Exception(f"Failed to open repository: {str(e)}")


def get_repository_info(repo_path: str) -> dict:
    """
    Get information about a repository.
    
    Args:
        repo_path: Path to repository
    
    Returns:
        Dictionary with repository information
    """
    repo = open_repository(repo_path)
    
    # Count commits
    commit_count = 0
    if not repo.head_is_unborn:
        for commit in repo.walk(repo.head.target):
            commit_count += 1
    
    # Count branches
    branches = [ref for ref in repo.references if ref.startswith('refs/heads/')]
    
    # Get current branch
    current_branch = None
    if not repo.head_is_unborn:
        current_branch = repo.head.shorthand
    
    return {
        'path': repo_path,
        'is_bare': repo.is_bare,
        'is_empty': repo.head_is_unborn,
        'commit_count': commit_count,
        'branch_count': len(branches),
        'current_branch': current_branch,
        'branches': [ref.replace('refs/heads/', '') for ref in branches]
    }


def delete_repository(repo_path: str) -> None:
    """
    Delete a repository directory.
    
    Args:
        repo_path: Path to repository
    """
    target = Path(repo_path)
    if target.exists():
        shutil.rmtree(target)
