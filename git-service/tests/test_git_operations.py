"""
Tests for git operations
"""
import pytest
from pathlib import Path
from app.core.git.operations import (
    clone_repository,
    open_repository,
    get_repository_info,
    delete_repository
)


def test_clone_repository(temp_dir):
    """Test cloning a small repository"""
    # Use a small public repository for testing
    url = "https://github.com/octocat/Hello-World.git"
    target_path = str(temp_dir / "test_clone")
    
    # Clone the repository
    result = clone_repository(url, target_path)
    
    # Verify it was cloned
    assert Path(result).exists()
    assert (Path(result) / ".git").exists()
    
    # Cleanup
    delete_repository(result)


def test_clone_repository_already_exists(temp_dir):
    """Test that cloning to existing path raises error"""
    url = "https://github.com/octocat/Hello-World.git"
    target_path = str(temp_dir / "test_clone")
    
    # Create the directory first
    Path(target_path).mkdir()
    
    # Should raise ValueError
    with pytest.raises(ValueError, match="Target path already exists"):
        clone_repository(url, target_path)


def test_open_repository(sample_git_repo):
    """Test opening an existing repository"""
    repo = open_repository(str(sample_git_repo))
    assert repo is not None
    assert not repo.head_is_unborn


def test_get_repository_info(sample_git_repo):
    """Test getting repository information"""
    info = get_repository_info(str(sample_git_repo))
    
    assert 'path' in info
    assert 'commit_count' in info
    assert 'branch_count' in info
    assert 'current_branch' in info
    assert info['commit_count'] >= 2  # We created 2 commits in fixture
    assert info['branch_count'] >= 1


def test_delete_repository(temp_dir):
    """Test deleting a repository"""
    # Create a test directory
    test_path = temp_dir / "to_delete"
    test_path.mkdir()
    (test_path / "test.txt").write_text("test")
    
    # Delete it
    delete_repository(str(test_path))
    
    # Verify it's gone
    assert not test_path.exists()
