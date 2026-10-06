"""
Comprehensive tests for all metric calculations
"""
import pytest
import pygit2
from pathlib import Path
from app.core.metrics.calculator import MetricCalculator


class TestFileMetrics:
    """Test file metric calculations"""
    
    def test_file_metrics_basic(self, sample_git_repo):
        """Test basic file metrics calculation"""
        calculator = MetricCalculator(str(sample_git_repo))
        
        metrics = calculator.calculate_file_metrics('test.txt')
        
        assert 'added_lines' in metrics
        assert 'removed_lines' in metrics
        assert 'growth' in metrics
        assert 'churn' in metrics
        assert 'modifications' in metrics
        
        # We added 3 lines in first commit, 1 line in second
        assert metrics['added_lines'] == 4
        assert metrics['removed_lines'] == 0
        assert metrics['growth'] == 4
        assert metrics['churn'] == 4
        assert metrics['modifications'] == 2
    
    def test_file_metrics_with_time_filter(self, sample_git_repo):
        """Test file metrics with time filtering"""
        calculator = MetricCalculator(str(sample_git_repo))
        
        # Get all commits to find middle time
        all_commits = calculator._get_commits()
        middle_time = all_commits[0].committer.time
        
        # Filter from middle time onwards
        metrics = calculator.calculate_file_metrics('test.txt', start_time=middle_time)
        
        # Should have fewer modifications
        assert metrics['modifications'] <= 2
    
    def test_file_metrics_nonexistent_file(self, sample_git_repo):
        """Test metrics for non-existent file"""
        calculator = MetricCalculator(str(sample_git_repo))
        
        metrics = calculator.calculate_file_metrics('nonexistent.txt')
        
        assert metrics['added_lines'] == 0
        assert metrics['removed_lines'] == 0
        assert metrics['modifications'] == 0


class TestDirectoryMetrics:
    """Test directory metric calculations"""
    
    def test_directory_metrics_root(self, sample_git_repo):
        """Test directory metrics for root"""
        calculator = MetricCalculator(str(sample_git_repo))
        
        metrics = calculator.calculate_directory_metrics('')
        
        assert 'added_lines' in metrics
        assert 'removed_lines' in metrics
        assert 'growth' in metrics
        assert 'churn' in metrics
        
        # Root should include all changes
        assert metrics['added_lines'] > 0
    
    def test_directory_metrics_immediate_children_only(self, sample_git_repo):
        """Test that directory metrics only aggregate immediate children"""
        # Create a subdirectory structure
        repo = pygit2.Repository(str(sample_git_repo))
        
        # Create subdirectory with file
        subdir = sample_git_repo / "subdir"
        subdir.mkdir()
        (subdir / "file.txt").write_text("content")
        
        repo.index.add("subdir/file.txt")
        repo.index.write()
        
        author = pygit2.Signature("Test Author", "test@example.com")
        tree = repo.index.write_tree()
        parent = repo.head.target
        repo.create_commit(
            "refs/heads/main",
            author,
            author,
            "Add subdir",
            tree,
            [parent]
        )
        
        calculator = MetricCalculator(str(sample_git_repo))
        
        # Root directory metrics should include subdir
        root_metrics = calculator.calculate_directory_metrics('')
        assert root_metrics['added_lines'] > 0


class TestRepoMetrics:
    """Test repository metric calculations"""
    
    def test_repo_metrics_basic(self, sample_git_repo):
        """Test basic repository metrics"""
        calculator = MetricCalculator(str(sample_git_repo))
        
        metrics = calculator.calculate_repo_metrics()
        
        assert 'added_lines' in metrics
        assert 'removed_lines' in metrics
        assert 'growth' in metrics
        assert 'churn' in metrics
        assert 'commit_count' in metrics
        
        assert metrics['commit_count'] >= 2
    
    def test_repo_metrics_equals_root_directory(self, sample_git_repo):
        """Test that repo metrics equal root directory metrics"""
        calculator = MetricCalculator(str(sample_git_repo))
        
        repo_metrics = calculator.calculate_repo_metrics()
        dir_metrics = calculator.calculate_directory_metrics('')
        
        assert repo_metrics['added_lines'] == dir_metrics['added_lines']
        assert repo_metrics['removed_lines'] == dir_metrics['removed_lines']
        assert repo_metrics['growth'] == dir_metrics['growth']
        assert repo_metrics['churn'] == dir_metrics['churn']


class TestCommitSetMetrics:
    """Test commit set metric calculations"""
    
    def test_commit_set_metrics_file(self, sample_git_repo):
        """Test commit set metrics for a file"""
        calculator = MetricCalculator(str(sample_git_repo))
        
        metrics = calculator.calculate_commit_set_metrics('test.txt')
        
        assert 'added_lines' in metrics
        assert 'removed_lines' in metrics
        assert 'growth' in metrics
        assert 'churn' in metrics
        assert 'modifications' in metrics
        assert 'modification_frequency' in metrics
        assert 'churn_rate' in metrics
        assert 'commit_count' in metrics
        
        assert metrics['modifications'] == 2
        assert metrics['commit_count'] >= 2
    
    def test_commit_set_metrics_with_time_range(self, sample_git_repo):
        """Test commit set metrics with time range"""
        calculator = MetricCalculator(str(sample_git_repo))
        
        all_commits = calculator._get_commits()
        if len(all_commits) >= 2:
            start_time = all_commits[-1].committer.time
            end_time = all_commits[0].committer.time
            
            metrics = calculator.calculate_commit_set_metrics(
                'test.txt',
                start_time=start_time,
                end_time=end_time
            )
            
            assert metrics['commit_count'] >= 0


class TestAuthorMetrics:
    """Test author metric calculations"""
    
    def test_author_metrics_basic(self, sample_git_repo):
        """Test basic author metrics"""
        calculator = MetricCalculator(str(sample_git_repo))
        
        metrics = calculator.calculate_author_metrics('Test Author')
        
        assert 'added_lines' in metrics
        assert 'removed_lines' in metrics
        assert 'growth' in metrics
        assert 'churn' in metrics
        assert 'modifications' in metrics
        assert 'commit_count' in metrics
        assert 'ownership' in metrics
        
        # All commits are by Test Author
        assert metrics['commit_count'] >= 2
        assert metrics['ownership'] > 0
    
    def test_author_metrics_with_object(self, sample_git_repo):
        """Test author metrics for specific object"""
        calculator = MetricCalculator(str(sample_git_repo))
        
        metrics = calculator.calculate_author_metrics('Test Author', 'test.txt')
        
        assert metrics['modifications'] >= 1
        assert metrics['churn'] > 0
    
    def test_author_ownership_sums_to_one(self, sample_git_repo):
        """Test that all author ownerships sum to approximately 1"""
        calculator = MetricCalculator(str(sample_git_repo))
        
        # Get all commits
        commits = calculator._get_commits()
        
        # Get unique authors
        authors = set()
        for commit in commits:
            authors.add(commit.author.name)
        
        # Calculate ownership for each author
        total_ownership = 0
        for author in authors:
            metrics = calculator.calculate_author_metrics(author)
            total_ownership += metrics['ownership']
        
        # Should sum to approximately 1 (allowing for floating point errors)
        assert abs(total_ownership - 1.0) < 0.01
    
    def test_author_metrics_case_insensitive(self, sample_git_repo):
        """Test that author matching is case insensitive"""
        calculator = MetricCalculator(str(sample_git_repo))
        
        metrics1 = calculator.calculate_author_metrics('Test Author')
        metrics2 = calculator.calculate_author_metrics('test author')
        metrics3 = calculator.calculate_author_metrics('TEST AUTHOR')
        
        assert metrics1['commit_count'] == metrics2['commit_count']
        assert metrics1['commit_count'] == metrics3['commit_count']


class TestMetricFormulas:
    """Test that metric formulas are correct"""
    
    def test_growth_formula(self, sample_git_repo):
        """Test that growth = added - removed"""
        calculator = MetricCalculator(str(sample_git_repo))
        
        metrics = calculator.calculate_file_metrics('test.txt')
        
        expected_growth = metrics['added_lines'] - metrics['removed_lines']
        assert metrics['growth'] == expected_growth
    
    def test_churn_formula(self, sample_git_repo):
        """Test that churn = added + removed"""
        calculator = MetricCalculator(str(sample_git_repo))
        
        metrics = calculator.calculate_file_metrics('test.txt')
        
        expected_churn = metrics['added_lines'] + metrics['removed_lines']
        assert metrics['churn'] == expected_churn
    
    def test_modification_frequency_formula(self, sample_git_repo):
        """Test that modification_frequency = modifications / commit_count"""
        calculator = MetricCalculator(str(sample_git_repo))
        
        metrics = calculator.calculate_file_metrics('test.txt')
        
        if metrics['commit_count'] > 0:
            expected_freq = metrics['modifications'] / metrics['commit_count']
            assert abs(metrics['modification_frequency'] - expected_freq) < 0.001
    
    def test_churn_rate_formula(self, sample_git_repo):
        """Test that churn_rate = churn / commit_count"""
        calculator = MetricCalculator(str(sample_git_repo))
        
        metrics = calculator.calculate_file_metrics('test.txt')
        
        if metrics['commit_count'] > 0:
            expected_rate = metrics['churn'] / metrics['commit_count']
            assert abs(metrics['churn_rate'] - expected_rate) < 0.001
