"""
Test metric calculations
"""
import pytest
from pathlib import Path

def test_sample_repo_creation(sample_git_repo):
    """Test that sample git repo is created correctly"""
    assert sample_git_repo.exists()
    assert (sample_git_repo / ".git").exists()
    assert (sample_git_repo / "test.txt").exists()

def test_file_content(sample_git_repo):
    """Test file content in sample repo"""
    test_file = sample_git_repo / "test.txt"
    content = test_file.read_text()
    assert "Line 1" in content
    assert "Line 4" in content
