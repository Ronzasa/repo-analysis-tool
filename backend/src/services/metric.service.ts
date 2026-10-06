import { runQuery, getAllRows, getOneRow } from '../database';

export interface FileMetric {
  id?: number;
  repo_id: string;
  file_path: string;
  commit_hash: string;
  author_id?: string;
  added_lines: number;
  removed_lines: number;
  growth: number;
  churn: number;
}

export interface DirectoryMetric {
  id?: number;
  repo_id: string;
  dir_path: string;
  commit_hash: string;
  author_id?: string;
  added_lines: number;
  removed_lines: number;
  growth: number;
  churn: number;
}

export interface MetricFilters {
  repo_id?: string;
  file_path?: string;
  dir_path?: string;
  commit_hash?: string;
  author_id?: string;
  start_time?: number;
  end_time?: number;
}

export function saveFileMetric(metric: FileMetric): void {
  /**
   * Save a file metric to the database
   */
  runQuery(
    `INSERT INTO file_metrics (repo_id, file_path, commit_hash, author_id, added_lines, removed_lines, growth, churn)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      metric.repo_id,
      metric.file_path,
      metric.commit_hash,
      metric.author_id || null,
      metric.added_lines,
      metric.removed_lines,
      metric.growth,
      metric.churn
    ]
  );
}

export function saveDirectoryMetric(metric: DirectoryMetric): void {
  /**
   * Save a directory metric to the database
   */
  runQuery(
    `INSERT INTO directory_metrics (repo_id, dir_path, commit_hash, author_id, added_lines, removed_lines, growth, churn)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      metric.repo_id,
      metric.dir_path,
      metric.commit_hash,
      metric.author_id || null,
      metric.added_lines,
      metric.removed_lines,
      metric.growth,
      metric.churn
    ]
  );
}

export function getFileMetrics(filters: MetricFilters): FileMetric[] {
  /**
   * Get file metrics with optional filters
   */
  let query = 'SELECT * FROM file_metrics WHERE 1=1';
  const params: any[] = [];
  
  if (filters.repo_id) {
    query += ' AND repo_id = ?';
    params.push(filters.repo_id);
  }
  
  if (filters.file_path) {
    query += ' AND file_path = ?';
    params.push(filters.file_path);
  }
  
  if (filters.commit_hash) {
    query += ' AND commit_hash = ?';
    params.push(filters.commit_hash);
  }
  
  if (filters.author_id) {
    query += ' AND author_id = ?';
    params.push(filters.author_id);
  }
  
  query += ' ORDER BY commit_hash';
  
  return getAllRows(query, params);
}

export function getDirectoryMetrics(filters: MetricFilters): DirectoryMetric[] {
  /**
   * Get directory metrics with optional filters
   */
  let query = 'SELECT * FROM directory_metrics WHERE 1=1';
  const params: any[] = [];
  
  if (filters.repo_id) {
    query += ' AND repo_id = ?';
    params.push(filters.repo_id);
  }
  
  if (filters.dir_path) {
    query += ' AND dir_path = ?';
    params.push(filters.dir_path);
  }
  
  if (filters.commit_hash) {
    query += ' AND commit_hash = ?';
    params.push(filters.commit_hash);
  }
  
  if (filters.author_id) {
    query += ' AND author_id = ?';
    params.push(filters.author_id);
  }
  
  query += ' ORDER BY commit_hash';
  
  return getAllRows(query, params);
}

export function getAggregatedFileMetrics(repoId: string, filePath: string): any {
  /**
   * Get aggregated metrics for a file across all commits
   */
  const query = `
    SELECT 
      SUM(added_lines) as total_added,
      SUM(removed_lines) as total_removed,
      SUM(growth) as total_growth,
      SUM(churn) as total_churn,
      COUNT(*) as modification_count
    FROM file_metrics
    WHERE repo_id = ? AND file_path = ?
  `;
  
  return getOneRow(query, [repoId, filePath]);
}

export function getAggregatedDirectoryMetrics(repoId: string, dirPath: string): any {
  /**
   * Get aggregated metrics for a directory across all commits
   */
  const query = `
    SELECT 
      SUM(added_lines) as total_added,
      SUM(removed_lines) as total_removed,
      SUM(growth) as total_growth,
      SUM(churn) as total_churn,
      COUNT(*) as modification_count
    FROM directory_metrics
    WHERE repo_id = ? AND dir_path = ?
  `;
  
  return getOneRow(query, [repoId, dirPath]);
}

export function deleteMetricsByRepo(repoId: string): void {
  /**
   * Delete all metrics for a repository
   */
  runQuery('DELETE FROM file_metrics WHERE repo_id = ?', [repoId]);
  runQuery('DELETE FROM directory_metrics WHERE repo_id = ?', [repoId]);
}

export function batchSaveFileMetrics(metrics: FileMetric[]): void {
  /**
   * Batch save multiple file metrics
   */
  for (const metric of metrics) {
    saveFileMetric(metric);
  }
}

export function batchSaveDirectoryMetrics(metrics: DirectoryMetric[]): void {
  /**
   * Batch save multiple directory metrics
   */
  for (const metric of metrics) {
    saveDirectoryMetric(metric);
  }
}

export function getMetricsByRepo(repoId: string): (FileMetric | DirectoryMetric)[] {
  /**
   * Get all metrics (file and directory) for a repository
   */
  const fileMetrics = getFileMetrics({ repo_id: repoId });
  const directoryMetrics = getDirectoryMetrics({ repo_id: repoId });
  return [...fileMetrics, ...directoryMetrics];
}

export function getMetricsByCommit(commitHash: string): (FileMetric | DirectoryMetric)[] {
  /**
   * Get all metrics for a specific commit
   */
  const fileMetrics = getFileMetrics({ commit_hash: commitHash });
  const directoryMetrics = getDirectoryMetrics({ commit_hash: commitHash });
  return [...fileMetrics, ...directoryMetrics];
}
