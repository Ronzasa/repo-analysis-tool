import { saveFileMetric, saveDirectoryMetric, getFileMetrics, getDirectoryMetrics, getMetricsByRepo, getMetricsByCommit } from '../src/services/metric.service';
import { initDatabase, closeDatabase, runQuery } from '../src/database';

describe('Metric Service', () => {
  beforeAll(async () => {
    await initDatabase();
  });

  afterAll(() => {
    closeDatabase();
  });

  beforeEach(() => {
    // Clear all metrics before each test
    runQuery('DELETE FROM file_metrics');
    runQuery('DELETE FROM directory_metrics');
    runQuery('DELETE FROM repositories');
  });

  describe('File Metrics', () => {
    const repoId = 'test-repo-id';

    beforeEach(() => {
      // Create a test repository
      runQuery(
        'INSERT INTO repositories (id, name, path, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        [repoId, 'test-repo', '/tmp/test-repo', Date.now(), Date.now()]
      );
    });

    it('should save file metrics', () => {
      saveFileMetric({
        repo_id: repoId,
        file_path: 'src/index.ts',
        commit_hash: 'abc123',
        added_lines: 10,
        removed_lines: 5,
        growth: 5,
        churn: 15
      });

      const metrics = getFileMetrics({ repo_id: repoId, file_path: 'src/index.ts' });
      
      expect(metrics).toHaveLength(1);
      expect(metrics[0].added_lines).toBe(10);
      expect(metrics[0].removed_lines).toBe(5);
      expect(metrics[0].growth).toBe(5);
      expect(metrics[0].churn).toBe(15);
    });

    it('should save multiple file metrics for same file', () => {
      saveFileMetric({
        repo_id: repoId,
        file_path: 'src/index.ts',
        commit_hash: 'abc123',
        added_lines: 10,
        removed_lines: 5,
        growth: 5,
        churn: 15
      });

      saveFileMetric({
        repo_id: repoId,
        file_path: 'src/index.ts',
        commit_hash: 'def456',
        added_lines: 5,
        removed_lines: 2,
        growth: 3,
        churn: 7
      });

      const metrics = getFileMetrics({ repo_id: repoId, file_path: 'src/index.ts' });
      
      expect(metrics).toHaveLength(2);
    });

    it('should filter file metrics by author', () => {
      saveFileMetric({
        repo_id: repoId,
        file_path: 'src/index.ts',
        commit_hash: 'abc123',
        author_id: 'author1',
        added_lines: 10,
        removed_lines: 5,
        growth: 5,
        churn: 15
      });

      saveFileMetric({
        repo_id: repoId,
        file_path: 'src/index.ts',
        commit_hash: 'def456',
        author_id: 'author2',
        added_lines: 5,
        removed_lines: 2,
        growth: 3,
        churn: 7
      });

      const metrics = getFileMetrics({ 
        repo_id: repoId, 
        file_path: 'src/index.ts',
        author_id: 'author1'
      });
      
      expect(metrics).toHaveLength(1);
      expect(metrics[0].author_id).toBe('author1');
    });
  });

  describe('Directory Metrics', () => {
    const repoId = 'test-repo-id';

    beforeEach(() => {
      runQuery(
        'INSERT INTO repositories (id, name, path, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        [repoId, 'test-repo', '/tmp/test-repo', Date.now(), Date.now()]
      );
    });

    it('should save directory metrics', () => {
      saveDirectoryMetric({
        repo_id: repoId,
        dir_path: 'src',
        commit_hash: 'abc123',
        added_lines: 20,
        removed_lines: 10,
        growth: 10,
        churn: 30
      });

      const metrics = getDirectoryMetrics({ repo_id: repoId, dir_path: 'src' });
      
      expect(metrics).toHaveLength(1);
      expect(metrics[0].added_lines).toBe(20);
      expect(metrics[0].removed_lines).toBe(10);
      expect(metrics[0].growth).toBe(10);
      expect(metrics[0].churn).toBe(30);
    });

    it('should aggregate directory metrics from multiple commits', () => {
      saveDirectoryMetric({
        repo_id: repoId,
        dir_path: 'src',
        commit_hash: 'abc123',
        added_lines: 20,
        removed_lines: 10,
        growth: 10,
        churn: 30
      });

      saveDirectoryMetric({
        repo_id: repoId,
        dir_path: 'src',
        commit_hash: 'def456',
        added_lines: 15,
        removed_lines: 5,
        growth: 10,
        churn: 20
      });

      const metrics = getDirectoryMetrics({ repo_id: repoId, dir_path: 'src' });
      
      expect(metrics).toHaveLength(2);
    });
  });

  describe('Query Helpers', () => {
    const repoId = 'test-repo-id';

    beforeEach(() => {
      runQuery(
        'INSERT INTO repositories (id, name, path, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        [repoId, 'test-repo', '/tmp/test-repo', Date.now(), Date.now()]
      );
    });

    it('should get metrics by repository', () => {
      saveFileMetric({
        repo_id: repoId,
        file_path: 'src/index.ts',
        commit_hash: 'abc123',
        added_lines: 10,
        removed_lines: 5,
        growth: 5,
        churn: 15
      });

      saveFileMetric({
        repo_id: repoId,
        file_path: 'src/utils.ts',
        commit_hash: 'abc123',
        added_lines: 5,
        removed_lines: 2,
        growth: 3,
        churn: 7
      });

      const metrics = getMetricsByRepo(repoId);
      
      expect(metrics).toHaveLength(2);
    });

    it('should get metrics by commit', () => {
      saveFileMetric({
        repo_id: repoId,
        file_path: 'src/index.ts',
        commit_hash: 'abc123',
        added_lines: 10,
        removed_lines: 5,
        growth: 5,
        churn: 15
      });

      saveFileMetric({
        repo_id: repoId,
        file_path: 'src/utils.ts',
        commit_hash: 'abc123',
        added_lines: 5,
        removed_lines: 2,
        growth: 3,
        churn: 7
      });

      saveFileMetric({
        repo_id: repoId,
        file_path: 'src/index.ts',
        commit_hash: 'def456',
        added_lines: 3,
        removed_lines: 1,
        growth: 2,
        churn: 4
      });

      const metrics = getMetricsByCommit('abc123');
      
      expect(metrics).toHaveLength(2);
    });
  });
});
