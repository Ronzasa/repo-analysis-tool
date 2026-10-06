import pygit2
from typing import Optional, List, Dict, Any, Set
from collections import defaultdict
from datetime import datetime
from pathlib import Path

class MetricCalculator:
    def __init__(self, repo_path: str):
        self.repo = pygit2.Repository(repo_path)
        self.repo_path = repo_path
    
    def _get_commits(
        self,
        start_time: Optional[int] = None,
        end_time: Optional[int] = None,
        commit_hashes: Optional[List[str]] = None
    ) -> List[pygit2.Commit]:
        """Get commits based on filters"""
        commits = []
        
        if commit_hashes:
            # Use specific commits
            for hash in commit_hashes:
                try:
                    commit = self.repo.get(hash)
                    if commit:
                        commits.append(commit)
                except:
                    continue
        else:
            # Walk all commits from HEAD
            for commit in self.repo.walk(self.repo.head.target):
                # Skip merge commits
                if len(commit.parents) > 1:
                    continue
                
                # Apply time filters
                commit_time = commit.committer.time
                
                if start_time and commit_time < start_time:
                    continue
                if end_time and commit_time >= end_time:
                    continue
                
                commits.append(commit)
        
        return commits
    
    def _is_binary(self, blob: pygit2.Blob) -> bool:
        """Check if a blob is binary"""
        return blob.is_binary
    
    def _get_diff_stats(self, commit: pygit2.Commit) -> Dict[str, Dict[str, int]]:
        """Get diff statistics for a commit"""
        stats = {}
        
        if commit.parents:
            parent = commit.parents[0]
            diff = self.repo.diff(parent, commit)
        else:
            # First commit
            diff = commit.tree.diff_to_tree()
        
        diff.find_similar()  # Enable rename detection
        
        for patch in diff:
            if patch.delta.is_binary:
                continue
            
            file_path = patch.delta.new_file.path
            stats[file_path] = {
                'additions': patch.line_stats[1],
                'deletions': patch.line_stats[2]
            }
        
        return stats
    
    def _get_immediate_children(self, dir_path: str, diff_stats: Dict[str, Dict[str, int]]) -> Dict[str, Dict[str, int]]:
        """
        Get metrics for immediate children of a directory.
        According to brief: aggregate from immediate subdirectories and files.
        """
        children_stats = {}
        dir_path = dir_path.rstrip('/')
        
        for file_path, stats in diff_stats.items():
            # Check if file is in this directory (immediate child)
            if dir_path == '':
                # Root directory - file is immediate child if no '/' in path
                if '/' not in file_path:
                    children_stats[file_path] = stats
            else:
                # Check if file is directly under dir_path
                if file_path.startswith(dir_path + '/'):
                    relative = file_path[len(dir_path) + 1:]
                    # Immediate child if no more '/' in relative path
                    if '/' not in relative:
                        children_stats[file_path] = stats
        
        return children_stats
    
    def calculate_file_metrics(
        self,
        file_path: str,
        start_time: Optional[int] = None,
        end_time: Optional[int] = None,
        commit_hashes: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Calculate metrics for a specific file.
        
        Metrics:
        - File Added Lines (l+): lines added
        - File Removed Lines (l-): lines removed
        - File Growth (δ): l+ - l-
        - File Churn (λ): l+ + l-
        """
        commits = self._get_commits(start_time, end_time, commit_hashes)
        
        total_added = 0
        total_removed = 0
        modifications = 0
        
        for commit in commits:
            diff_stats = self._get_diff_stats(commit)
            
            if file_path in diff_stats:
                added = diff_stats[file_path]['additions']
                removed = diff_stats[file_path]['deletions']
                
                total_added += added
                total_removed += removed
                modifications += 1
        
        growth = total_added - total_removed
        churn = total_added + total_removed
        
        return {
            'added_lines': total_added,
            'removed_lines': total_removed,
            'growth': growth,
            'churn': churn,
            'modifications': modifications,
            'modification_frequency': modifications / len(commits) if commits else 0,
            'churn_rate': churn / len(commits) if commits else 0
        }
    
    def calculate_directory_metrics(
        self,
        dir_path: str,
        start_time: Optional[int] = None,
        end_time: Optional[int] = None,
        commit_hashes: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Calculate metrics for a directory.
        
        According to brief: aggregate from immediate children (files and subdirectories).
        Directory metrics are the sum of metrics from immediate children.
        
        Metrics:
        - Directory Added Lines: sum of added lines from immediate children
        - Directory Removed Lines: sum of removed lines from immediate children
        - Directory Growth: sum of growth from immediate children
        - Directory Churn: sum of churn from immediate children
        """
        commits = self._get_commits(start_time, end_time, commit_hashes)
        
        total_added = 0
        total_removed = 0
        modifications = 0
        
        for commit in commits:
            diff_stats = self._get_diff_stats(commit)
            
            # Get immediate children only
            children_stats = self._get_immediate_children(dir_path, diff_stats)
            
            for file_path, stats in children_stats.items():
                total_added += stats['additions']
                total_removed += stats['deletions']
                modifications += 1
        
        growth = total_added - total_removed
        churn = total_added + total_removed
        
        return {
            'added_lines': total_added,
            'removed_lines': total_removed,
            'growth': growth,
            'churn': churn,
            'modifications': modifications,
            'modification_frequency': modifications / len(commits) if commits else 0,
            'churn_rate': churn / len(commits) if commits else 0
        }
    
    def calculate_repo_metrics(
        self,
        start_time: Optional[int] = None,
        end_time: Optional[int] = None,
        commit_hashes: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Calculate metrics for the entire repository.
        Repository metrics are directory metrics on the root.
        """
        # Root directory is empty string
        return self.calculate_directory_metrics('', start_time, end_time, commit_hashes)
    
    def calculate_commit_set_metrics(
        self,
        object_path: str,
        start_time: Optional[int] = None,
        end_time: Optional[int] = None,
        commit_hashes: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Calculate commit set metrics for a file or directory.
        
        Metrics over a commit set H:
        - Added lines (l+): sum of added lines across all commits
        - Removed lines (l-): sum of removed lines across all commits
        - Growth (δ): sum of growth across all commits
        - Churn (λ): sum of churn across all commits
        - Modifications (n): number of commits with changes
        - Modification frequency (η): n / |H|
        - Churn rate (ρ): λ / |H|
        """
        commits = self._get_commits(start_time, end_time, commit_hashes)
        
        total_added = 0
        total_removed = 0
        modifications = 0
        
        for commit in commits:
            diff_stats = self._get_diff_stats(commit)
            
            # Check if it's a file or directory
            if object_path in diff_stats:
                # It's a file
                stats = diff_stats[object_path]
                total_added += stats['additions']
                total_removed += stats['deletions']
                modifications += 1
            else:
                # Check if it's a directory - aggregate from immediate children
                children_stats = self._get_immediate_children(object_path, diff_stats)
                if children_stats:
                    for stats in children_stats.values():
                        total_added += stats['additions']
                        total_removed += stats['deletions']
                    modifications += 1
        
        growth = total_added - total_removed
        churn = total_added + total_removed
        
        return {
            'added_lines': total_added,
            'removed_lines': total_removed,
            'growth': growth,
            'churn': churn,
            'modifications': modifications,
            'modification_frequency': modifications / len(commits) if commits else 0,
            'churn_rate': churn / len(commits) if commits else 0,
            'commit_count': len(commits)
        }
    
    def calculate_author_metrics(
        self,
        author: str,
        object_path: Optional[str] = None,
        start_time: Optional[int] = None,
        end_time: Optional[int] = None,
        commit_hashes: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Calculate metrics for a specific author.
        
        Metrics:
        - Author Modifications (n): commits by author with changes to object
        - Author Churn (λ): total churn by author on object
        - Author Ownership (ω): author_churn / total_churn
        
        If object_path is None, calculate for entire repository.
        """
        commits = self._get_commits(start_time, end_time, commit_hashes)
        
        # Filter by author
        author_commits = [c for c in commits if author.lower() in c.author.email.lower() or author.lower() in c.author.name.lower()]
        
        total_added = 0
        total_removed = 0
        modifications = 0
        
        for commit in author_commits:
            diff_stats = self._get_diff_stats(commit)
            
            if object_path:
                # Check specific object
                if object_path in diff_stats:
                    stats = diff_stats[object_path]
                    total_added += stats['additions']
                    total_removed += stats['deletions']
                    modifications += 1
                else:
                    # Check if it's a directory
                    children_stats = self._get_immediate_children(object_path, diff_stats)
                    if children_stats:
                        for stats in children_stats.values():
                            total_added += stats['additions']
                            total_removed += stats['deletions']
                        modifications += 1
            else:
                # Entire repository
                for stats in diff_stats.values():
                    total_added += stats['additions']
                    total_removed += stats['deletions']
                modifications += 1
        
        growth = total_added - total_removed
        churn = total_added + total_removed
        
        # Calculate total churn for ownership
        total_churn = 0
        for commit in commits:
            diff_stats = self._get_diff_stats(commit)
            
            if object_path:
                if object_path in diff_stats:
                    stats = diff_stats[object_path]
                    total_churn += stats['additions'] + stats['deletions']
                else:
                    children_stats = self._get_immediate_children(object_path, diff_stats)
                    for stats in children_stats.values():
                        total_churn += stats['additions'] + stats['deletions']
            else:
                for stats in diff_stats.values():
                    total_churn += stats['additions'] + stats['deletions']
        
        ownership = churn / total_churn if total_churn > 0 else 0
        
        return {
            'added_lines': total_added,
            'removed_lines': total_removed,
            'growth': growth,
            'churn': churn,
            'modifications': modifications,
            'commit_count': len(author_commits),
            'ownership': ownership
        }
