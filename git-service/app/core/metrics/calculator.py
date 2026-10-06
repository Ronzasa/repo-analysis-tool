import pygit2
from typing import Optional, List, Dict, Any
from collections import defaultdict
from datetime import datetime

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
    
    def calculate_file_metrics(
        self,
        file_path: str,
        start_time: Optional[int] = None,
        end_time: Optional[int] = None,
        commit_hashes: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Calculate metrics for a specific file"""
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
        """Calculate metrics for a directory"""
        commits = self._get_commits(start_time, end_time, commit_hashes)
        
        total_added = 0
        total_removed = 0
        modifications = 0
        
        for commit in commits:
            diff_stats = self._get_diff_stats(commit)
            
            # Aggregate metrics for files in this directory
            for file_path, stats in diff_stats.items():
                if file_path.startswith(dir_path + '/') or file_path.startswith(dir_path + '\\'):
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
        """Calculate metrics for the entire repository"""
        commits = self._get_commits(start_time, end_time, commit_hashes)
        
        total_added = 0
        total_removed = 0
        
        for commit in commits:
            diff_stats = self._get_diff_stats(commit)
            
            for stats in diff_stats.values():
                total_added += stats['additions']
                total_removed += stats['deletions']
        
        growth = total_added - total_removed
        churn = total_added + total_removed
        
        return {
            'added_lines': total_added,
            'removed_lines': total_removed,
            'growth': growth,
            'churn': churn,
            'commit_count': len(commits)
        }
    
    def calculate_author_metrics(
        self,
        author: str,
        start_time: Optional[int] = None,
        end_time: Optional[int] = None,
        commit_hashes: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Calculate metrics for a specific author"""
        commits = self._get_commits(start_time, end_time, commit_hashes)
        
        # Filter by author
        author_commits = [c for c in commits if author.lower() in c.author.email.lower() or author.lower() in c.author.name.lower()]
        
        total_added = 0
        total_removed = 0
        modifications = 0
        
        for commit in author_commits:
            diff_stats = self._get_diff_stats(commit)
            
            for stats in diff_stats.values():
                total_added += stats['additions']
                total_removed += stats['deletions']
            
            modifications += 1
        
        growth = total_added - total_removed
        churn = total_added + total_removed
        
        # Calculate total churn for ownership
        all_commits = self._get_commits(start_time, end_time, commit_hashes)
        total_churn = 0
        for commit in all_commits:
            diff_stats = self._get_diff_stats(commit)
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
