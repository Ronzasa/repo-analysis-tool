"""
Test fixtures for git operations
"""
import pytest
import pygit2
from pathlib import Path

@pytest.fixture
def sample_git_repo(temp_dir):
    """Create a sample git repository with some commits"""
    repo_path = temp_dir / "sample_repo"
    repo_path.mkdir()
    
    # Initialize repository
    repo = pygit2.init_repository(str(repo_path))
    
    # Create a test file
    test_file = repo_path / "test.txt"
    test_file.write_text("Line 1\nLine 2\nLine 3\n")
    
    # Add and commit
    repo.index.add("test.txt")
    repo.index.write()
    
    author = pygit2.Signature("Test Author", "test@example.com")
    committer = pygit2.Signature("Test Author", "test@example.com")
    
    tree = repo.index.write_tree()
    repo.create_commit(
        "refs/heads/main",
        author,
        committer,
        "Initial commit",
        tree,
        []
    )
    
    # Make another commit
    test_file.write_text("Line 1\nLine 2\nLine 3\nLine 4\n")
    repo.index.add("test.txt")
    repo.index.write()
    
    tree = repo.index.write_tree()
    parent = repo.head.target
    repo.create_commit(
        "refs/heads/main",
        author,
        committer,
        "Add line 4",
        tree,
        [parent]
    )
    
    repo.set_head("refs/heads/main")
    
    return repo_path
