"""
Mailmap parser for Git repositories

Supports .mailmap file format to merge duplicate author identities.
Format: Proper Name <proper@email> <commit@email>
"""

import os
from pathlib import Path
from typing import Dict, Tuple, Optional


class MailmapParser:
    """Parse .mailmap files to map duplicate author identities"""

    def __init__(self, repo_path: str):
        self.repo_path = Path(repo_path)
        self.mailmap_path = self.repo_path / '.mailmap'
        self.mappings: Dict[str, Tuple[str, str]] = {}  # commit_email -> (proper_name, proper_email)
        self._parse()

    def _parse(self) -> None:
        """Parse the .mailmap file if it exists"""
        if not self.mailmap_path.exists():
            return

        try:
            with open(self.mailmap_path, 'r', encoding='utf-8', errors='ignore') as f:
                for line in f:
                    line = line.strip()
                    
                    # Skip empty lines and comments
                    if not line or line.startswith('#'):
                        continue

                    self._parse_line(line)
        except Exception as e:
            print(f"Warning: Failed to parse .mailmap: {e}")

    def _parse_line(self, line: str) -> None:
        """
        Parse a single .mailmap line
        
        Supported formats:
        1. Proper Name <proper@email> <commit@email>
        2. Proper Name <proper@email> Commit Name <commit@email>
        3. <proper@email> <commit@email>
        4. <proper@email> Commit Name <commit@email>
        """
        import re
        
        # Pattern to match email addresses
        email_pattern = r'<([^>]+)>'
        
        # Find all emails in the line
        emails = re.findall(email_pattern, line)
        
        if len(emails) < 2:
            return  # Need at least 2 emails
        
        # Extract proper name (before first email)
        proper_name_match = re.match(r'^([^<]+)<', line)
        proper_name = proper_name_match.group(1).strip() if proper_name_match else None
        
        proper_email = emails[0]
        commit_email = emails[1]
        
        # Store mapping
        if proper_name:
            self.mappings[commit_email] = (proper_name, proper_email)
        else:
            # If no proper name, just map email to email
            self.mappings[commit_email] = (None, proper_email)

    def get_proper_identity(self, name: str, email: str) -> Tuple[str, str]:
        """
        Get the proper author identity for a given name and email
        
        Args:
            name: Author name from commit
            email: Author email from commit
            
        Returns:
            Tuple of (proper_name, proper_email)
        """
        if email in self.mappings:
            proper_name, proper_email = self.mappings[email]
            return (proper_name or name, proper_email)
        
        return (name, email)

    def has_mappings(self) -> bool:
        """Check if there are any mailmap mappings"""
        return len(self.mappings) > 0

    def get_all_mappings(self) -> Dict[str, Tuple[str, str]]:
        """Get all mailmap mappings"""
        return self.mappings.copy()


def parse_mailmap(repo_path: str) -> Dict[str, str]:
    """
    Convenience function to parse .mailmap and return simple email mapping
    
    Args:
        repo_path: Path to the repository
        
    Returns:
        Dict mapping commit_email -> proper_email
    """
    parser = MailmapParser(repo_path)
    return {email: proper_email for email, (_, proper_email) in parser.mappings.items()}


def apply_mailmap_to_author(
    repo_path: str,
    name: str,
    email: str
) -> Tuple[str, str]:
    """
    Apply mailmap to a single author
    
    Args:
        repo_path: Path to the repository
        name: Author name
        email: Author email
        
    Returns:
        Tuple of (proper_name, proper_email)
    """
    parser = MailmapParser(repo_path)
    return parser.get_proper_identity(name, email)
