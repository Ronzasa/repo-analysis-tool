import { getDatabase, runQuery, getAllRows, getOneRow, saveDatabase } from '../database';
import crypto from 'crypto';

export interface Repository {
  id: string;
  name: string;
  path: string;
  url?: string;
  created_at: number;
  updated_at: number;
}

export function saveRepository(repo: Omit<Repository, 'id' | 'created_at' | 'updated_at'>): Repository {
  /**
   * Save a new repository to the database
   */
  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);
  
  const newRepo: Repository = {
    id,
    name: repo.name,
    path: repo.path,
    url: repo.url,
    created_at: now,
    updated_at: now
  };
  
  runQuery(
    'INSERT INTO repositories (id, name, path, url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
    [newRepo.id, newRepo.name, newRepo.path, newRepo.url || null, newRepo.created_at, newRepo.updated_at]
  );
  
  return newRepo;
}

export function getRepository(id: string): Repository | null {
  /**
   * Get a repository by ID
   */
  const repo = getOneRow('SELECT * FROM repositories WHERE id = ?', [id]);
  return repo;
}

export function listRepositories(): Repository[] {
  /**
   * List all repositories
   */
  return getAllRows('SELECT * FROM repositories ORDER BY created_at DESC');
}

export function updateRepository(id: string, updates: Partial<Omit<Repository, 'id' | 'created_at'>>): Repository | null {
  /**
   * Update a repository
   */
  const existing = getRepository(id);
  if (!existing) {
    return null;
  }
  
  const now = Math.floor(Date.now() / 1000);
  const updated = {
    ...existing,
    ...updates,
    updated_at: now
  };
  
  runQuery(
    'UPDATE repositories SET name = ?, path = ?, url = ?, updated_at = ? WHERE id = ?',
    [updated.name, updated.path, updated.url, updated.updated_at, id]
  );
  
  return updated;
}

export function deleteRepository(id: string): boolean {
  /**
   * Delete a repository and all associated metrics
   */
  const existing = getRepository(id);
  if (!existing) {
    return false;
  }
  
  // Delete associated metrics first
  runQuery('DELETE FROM file_metrics WHERE repo_id = ?', [id]);
  runQuery('DELETE FROM directory_metrics WHERE repo_id = ?', [id]);
  
  // Delete repository
  runQuery('DELETE FROM repositories WHERE id = ?', [id]);
  
  return true;
}

export function getRepositoryByName(name: string): Repository | null {
  /**
   * Get a repository by name
   */
  const repo = getOneRow('SELECT * FROM repositories WHERE name = ?', [name]);
  return repo;
}
