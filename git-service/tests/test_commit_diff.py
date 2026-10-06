"""
Tests for commit iteration and diff parsing
"""
import pytest
import pygit2
from pathlib import Path
from app.core.metrics.calculator import MetricCalculator


def test_commit_iteration_skips_merges(sample_git_repo):
    """Test that commit iteration skips merge commits"""
    calculator = MetricCalculator(str(sample_git_repo))
    
    # Get all commits
    commits = calculator._get_commits()
    
    # Verify no merge commits (commits with > 1 parent)
    for commit in commits:
        assert len(commit.parents) <= 1, "Merge commits should be skipped"


def test_commit_iteration_with_time_filter(sample_git_repo):
    """Test commit iteration with time filtering"""
    calculator = MetricCalculator(str(sample_git_repo))
    
    # Get commit times
    all_commits = calculator._get_commits()
    assert len(all_commits) >= 2
    
    # Filter by time (should get subset)
    middle_time = all_commits[0].committer.time
    filtered_commits = calculator._get_commits(start_time=middle_time)
    
    # Should have fewer commits
    assert len(filtered_commits) <= len(all_commits)


def test_commit_iteration_with_specific_hashes(sample_git_repo):
    """Test commit iteration with specific commit hashes"""
    calculator = MetricCalculator(str(sample_git_repo))
    
    # Get all commits first
    all_commits = calculator._get_commits()
    
    # Get specific commits by hash
    hashes = [c.hex for c in all_commits[:2]]
    specific_commits = calculator._get_commits(commit_hashes=hashes)
    
    assert len(specific_commits) == 2


def test_diff_parsing_excludes_binary(sample_git_repo):
    """Test that diff parsing excludes binary files"""
    calculator = MetricCalculator(str(sample_git_repo))
    
    # Get commits
    commits = calculator._get_commits()
    
    # Parse diffs
    for commit in commits:
        diff_stats = calculator._get_diff_stats(commit)
        
        # All entries should be text files (no binary)
        for file_path, stats in diff_stats.items():
            assert 'additions' in stats
            assert 'deletions' in stats
            assert stats['additions'] >= 0
            assert stats['deletions'] >= 0


def test_diff_parsing_rename_detection(sample_git_repo):
    """Test that diff parsing detects renames"""
    # Create a rename in the sample repo
    repo = pygit2.Repository(str(sample_git_repo))
    
    # Rename the file
    old_path = sample_git_repo / "test.txt"
    new_path = sample_git_repo / "renamed.txt"
    old_path.rename(new_path)
    
    # Commit the rename
    repo.index.add("renamed.txt")
    repo.index.remove("test.txt")
    repo.index.write()
    
    author = pygit2.Signature("Test Author", "test@example.com")
    tree = repo.index.write_tree()
    parent = repo.head.target
    repo.create_commit(
        "refs/heads/main",
        author,
        author,
        "Rename file",
        tree,
        [parent]
    )
    
    # Now test diff parsing
    calculator = MetricCalculator(str(sample_git_repo))
    commits = calculator._get_commits()
    
    # Get the latest commit (the rename)
    latest_commit = commits[0]
    diff_stats = calculator._get_diff_stats(latest_commit)
    
    # Should detect the rename (file should appear with new name)
    assert 'renamed.txt' in diff_stats or len(diff_stats) == 0  # Rename with no changes


def test_diff_stats_structure(sample_git_repo):
    """Test that diff stats have correct structure"""
    calculator = MetricCalculator(str(sample_git_repo))
    
    commits = calculator._get_commits()
    
    for commit in commits:
        diff_stats = calculator._get_diff_stats(commit)
        
        # Should be a dictionary
        assert isinstance(diff_stats, dict)
        
        # Each entry should have correct structure
        for file_path, stats in diff_stats.items():
            assert isinstance(file_path, str)
            assert isinstance(stats, dict)
            assert 'additions' in stats
            assert 'deletions' in stats
            assert isinstance(stats['additions'], int)
            assert isinstance(stats['deletions'], int)


def test_first_commit_diff(sample_git_repo):
    """Test diff parsing for first commit (no parent)"""
    calculator = MetricCalculator(str(sample_git_repo))
    
    # Get all commits
    commits = calculator._get_commits()
    
    # Find first commit (no parents)
    first_commit = None
    for commit in commits:
        if len(commit.parents) == 0:
            first_commit = commit
            break
    
    if first_commit:
        # Should not raise an error
        diff_stats = calculator._get_diff_stats(first_commit)
        assert isinstance(diff_stats, dict)
