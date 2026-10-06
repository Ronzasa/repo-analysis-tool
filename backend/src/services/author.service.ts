import { runQuery, getAllRows, getOneRow } from '../database';
import fs from 'fs';
import path from 'path';

export interface Author {
  id: string;
  name: string;
  email: string;
  merged_into?: string;
}

export function saveAuthor(author: Author): void {
  /**
   * Save an author to the database
   */
  runQuery(
    'INSERT OR REPLACE INTO authors (id, name, email, merged_into) VALUES (?, ?, ?, ?)',
    [author.id, author.name, author.email, author.merged_into || null]
  );
}

export function getAuthor(id: string): Author | null {
  /**
   * Get an author by ID
   */
  return getOneRow('SELECT * FROM authors WHERE id = ?', [id]);
}

export function getAuthorByEmail(email: string): Author | null {
  /**
   * Get an author by email
   */
  return getOneRow('SELECT * FROM authors WHERE email = ?', [email]);
}

export function listAuthors(): Author[] {
  /**
   * List all authors
   */
  return getAllRows('SELECT * FROM authors ORDER BY name');
}

export function mergeAuthors(sourceIds: string[], targetId: string): void {
  /**
   * Merge multiple authors into a target author.
   * Updates all metrics to point to the target author.
   */
  const target = getAuthor(targetId);
  if (!target) {
    throw new Error(`Target author not found: ${targetId}`);
  }
  
  // Update all source authors to point to target
  for (const sourceId of sourceIds) {
    if (sourceId !== targetId) {
      // Update author record
      runQuery('UPDATE authors SET merged_into = ? WHERE id = ?', [targetId, sourceId]);
      
      // Update file metrics
      runQuery('UPDATE file_metrics SET author_id = ? WHERE author_id = ?', [targetId, sourceId]);
      
      // Update directory metrics
      runQuery('UPDATE directory_metrics SET author_id = ? WHERE author_id = ?', [targetId, sourceId]);
    }
  }
}

export function parseMailmap(repoPath: string): Map<string, string> {
  /**
   * Parse .mailmap file from a repository.
   * Returns a map of old_email -> canonical_email
   * 
   * Mailmap format:
   * Proper Name <proper@email.com> <commit@email.com>
   * or
   * <proper@email.com> <commit@email.com>
   */
  const mailmapPath = path.join(repoPath, '.mailmap');
  const mailmap = new Map<string, string>();
  
  if (!fs.existsSync(mailmapPath)) {
    return mailmap;
  }
  
  const content = fs.readFileSync(mailmapPath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  
  for (const line of lines) {
    // Parse mailmap line
    // Format: "Proper Name <proper@email.com> <commit@email.com>"
    // or: "<proper@email.com> <commit@email.com>"
    const matches = line.match(/(?:[^<]*<([^>]+)>)?\s*<([^>]+)>/);
    
    if (matches) {
      const canonicalEmail = matches[1] || matches[2];
      const commitEmail = matches[2];
      
      if (canonicalEmail && commitEmail && canonicalEmail !== commitEmail) {
        mailmap.set(commitEmail, canonicalEmail);
      }
    }
  }
  
  return mailmap;
}

export function applyMailmap(repoPath: string): number {
  /**
   * Apply .mailmap to merge authors in the database.
   * Returns the number of authors merged.
   */
  const mailmap = parseMailmap(repoPath);
  let mergedCount = 0;
  
  for (const [oldEmail, newEmail] of mailmap.entries()) {
    const oldAuthor = getAuthorByEmail(oldEmail);
    const newAuthor = getAuthorByEmail(newEmail);
    
    if (oldAuthor && newAuthor) {
      // Merge old into new
      mergeAuthors([oldAuthor.id], newAuthor.id);
      mergedCount++;
    } else if (oldAuthor && !newAuthor) {
      // Update old author's email
      runQuery('UPDATE authors SET email = ? WHERE id = ?', [newEmail, oldAuthor.id]);
      mergedCount++;
    }
  }
  
  return mergedCount;
}

export function getEffectiveAuthor(authorId: string): Author | null {
  /**
   * Get the effective author (following merge chain)
   */
  let author = getAuthor(authorId);
  
  while (author && author.merged_into) {
    author = getAuthor(author.merged_into);
  }
  
  return author;
}

export function deleteAuthor(id: string): void {
  /**
   * Delete an author
   */
  runQuery('DELETE FROM authors WHERE id = ?', [id]);
}

export function listMergedAuthors(): Author[] {
  /**
   * List all authors that have been merged into other authors
   */
  return getAllRows('SELECT * FROM authors WHERE merged_into IS NOT NULL');
}

export function listActiveAuthors(): Author[] {
  /**
   * List all authors that have not been merged
   */
  return getAllRows('SELECT * FROM authors WHERE merged_into IS NULL');
}

export function getAuthorsByRepo(repoId: string): Author[] {
  /**
   * Get all authors that have contributed to a specific repository
   */
  return getAllRows(
    `SELECT DISTINCT a.* FROM authors a
     LEFT JOIN file_metrics fm ON a.id = fm.author_id
     LEFT JOIN directory_metrics dm ON a.id = dm.author_id
     WHERE (fm.repo_id = ? OR dm.repo_id = ?)
     AND a.merged_into IS NULL
     ORDER BY a.name`,
    [repoId, repoId]
  );
}
