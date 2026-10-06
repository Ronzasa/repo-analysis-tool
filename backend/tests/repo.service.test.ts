import { saveRepository, getRepository, listRepositories, updateRepository, deleteRepository } from '../src/services/repo.service';
import { initDatabase, closeDatabase, runQuery } from '../src/database';

describe('Repository Service', () => {
  beforeAll(async () => {
    await initDatabase();
  });

  afterAll(() => {
    closeDatabase();
  });

  beforeEach(() => {
    // Clear all repositories before each test
    runQuery('DELETE FROM repositories');
  });

  describe('saveRepository', () => {
    it('should save a new repository', () => {
      const repo = saveRepository({
        name: 'test-repo',
        path: '/tmp/test-repo',
        url: 'https://github.com/test/repo.git'
      });

      expect(repo).toHaveProperty('id');
      expect(repo.name).toBe('test-repo');
      expect(repo.path).toBe('/tmp/test-repo');
      expect(repo.url).toBe('https://github.com/test/repo.git');
      expect(repo.created_at).toBeDefined();
      expect(repo.updated_at).toBeDefined();
    });

    it('should generate unique IDs', () => {
      const repo1 = saveRepository({ name: 'repo1', path: '/tmp/repo1' });
      const repo2 = saveRepository({ name: 'repo2', path: '/tmp/repo2' });

      expect(repo1.id).not.toBe(repo2.id);
    });
  });

  describe('getRepository', () => {
    it('should get a repository by ID', () => {
      const saved = saveRepository({
        name: 'test-repo',
        path: '/tmp/test-repo'
      });

      const retrieved = getRepository(saved.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.name).toBe('test-repo');
      expect(retrieved?.path).toBe('/tmp/test-repo');
    });

    it('should return null for non-existent ID', () => {
      const retrieved = getRepository('non-existent-id');
      expect(retrieved).toBeNull();
    });
  });

  describe('listRepositories', () => {
    it('should return all repositories', () => {
      saveRepository({ name: 'repo1', path: '/tmp/repo1' });
      saveRepository({ name: 'repo2', path: '/tmp/repo2' });
      saveRepository({ name: 'repo3', path: '/tmp/repo3' });

      const repos = listRepositories();

      expect(repos).toHaveLength(3);
    });

    it('should return empty array when no repositories', () => {
      const repos = listRepositories();
      expect(repos).toEqual([]);
    });
  });

  describe('updateRepository', () => {
    it('should update repository fields', () => {
      const repo = saveRepository({
        name: 'original-name',
        path: '/tmp/original-path'
      });

      const updated = updateRepository(repo.id, {
        name: 'updated-name',
        path: '/tmp/updated-path'
      });

      expect(updated).not.toBeNull();
      expect(updated?.name).toBe('updated-name');
      expect(updated?.path).toBe('/tmp/updated-path');
      expect(updated?.updated_at).toBeGreaterThanOrEqual(repo.updated_at);
    });

    it('should return null for non-existent ID', () => {
      const updated = updateRepository('non-existent-id', { name: 'test' });
      expect(updated).toBeNull();
    });
  });

  describe('deleteRepository', () => {
    it('should delete a repository', () => {
      const repo = saveRepository({
        name: 'test-repo',
        path: '/tmp/test-repo'
      });

      const deleted = deleteRepository(repo.id);
      expect(deleted).toBe(true);

      const retrieved = getRepository(repo.id);
      expect(retrieved).toBeNull();
    });

    it('should return false for non-existent ID', () => {
      const deleted = deleteRepository('non-existent-id');
      expect(deleted).toBe(false);
    });
  });
});
