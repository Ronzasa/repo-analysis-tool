import supertest from 'supertest';
import Fastify, { FastifyInstance } from 'fastify';
import { repoRoutes } from '../src/routes/repo.routes';
import { initDatabase, closeDatabase, runQuery } from '../src/database';

describe('Repository API', () => {
  let fastify: FastifyInstance;
  let request: any;

  beforeAll(async () => {
    await initDatabase();
    fastify = Fastify();
    fastify.register(repoRoutes, { prefix: '/api/repos' });
    await fastify.ready();
    request = supertest(fastify.server);
  });

  afterAll(async () => {
    await fastify.close();
    closeDatabase();
  });

  beforeEach(() => {
    runQuery('DELETE FROM repositories');
  });

  describe('GET /api/repos', () => {
    it('should list all repositories', async () => {
      runQuery(
        'INSERT INTO repositories (id, name, path, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        ['repo1', 'test-repo-1', '/tmp/repo1', Date.now(), Date.now()]
      );
      runQuery(
        'INSERT INTO repositories (id, name, path, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        ['repo2', 'test-repo-2', '/tmp/repo2', Date.now(), Date.now()]
      );

      const response = await request.get('/api/repos').expect(200);

      expect(response.body.repos).toHaveLength(2);
      expect(response.body.count).toBe(2);
    });

    it('should return empty array when no repositories', async () => {
      const response = await request.get('/api/repos').expect(200);

      expect(response.body.repos).toEqual([]);
      expect(response.body.count).toBe(0);
    });
  });

  describe('GET /api/repos/:id', () => {
    it('should get repository by ID', async () => {
      runQuery(
        'INSERT INTO repositories (id, name, path, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        ['repo1', 'test-repo', '/tmp/repo', Date.now(), Date.now()]
      );

      const response = await request.get('/api/repos/repo1').expect(200);

      expect(response.body.repo).toBeDefined();
      expect(response.body.repo.id).toBe('repo1');
      expect(response.body.repo.name).toBe('test-repo');
    });

    it('should return 404 for non-existent repository', async () => {
      const response = await request.get('/api/repos/nonexistent').expect(404);

      expect(response.body.error).toBe('Repository not found');
    });
  });

  describe('POST /api/repos', () => {
    it('should create new repository', async () => {
      const response = await request
        .post('/api/repos')
        .send({
          name: 'new-repo',
          path: '/tmp/new-repo',
          url: 'https://github.com/test/repo.git'
        })
        .expect(201);

      expect(response.body.repo).toBeDefined();
      expect(response.body.repo.name).toBe('new-repo');
      expect(response.body.repo.path).toBe('/tmp/new-repo');
      expect(response.body.message).toBe('Repository created successfully');
    });

    it('should return 400 when name is missing', async () => {
      const response = await request
        .post('/api/repos')
        .send({ path: '/tmp/repo' })
        .expect(400);

      expect(response.body.error).toBe('Name and path are required');
    });

    it('should return 400 when path is missing', async () => {
      const response = await request
        .post('/api/repos')
        .send({ name: 'test-repo' })
        .expect(400);

      expect(response.body.error).toBe('Name and path are required');
    });

    it('should return 409 when repository name already exists', async () => {
      runQuery(
        'INSERT INTO repositories (id, name, path, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        ['repo1', 'existing-repo', '/tmp/repo1', Date.now(), Date.now()]
      );

      const response = await request
        .post('/api/repos')
        .send({ name: 'existing-repo', path: '/tmp/repo2' })
        .expect(409);

      expect(response.body.error).toBe('Repository with this name already exists');
    });
  });

  describe('PUT /api/repos/:id', () => {
    it('should update repository', async () => {
      runQuery(
        'INSERT INTO repositories (id, name, path, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        ['repo1', 'old-name', '/tmp/old-path', Date.now(), Date.now()]
      );

      const response = await request
        .put('/api/repos/repo1')
        .send({ name: 'new-name', path: '/tmp/new-path' })
        .expect(200);

      expect(response.body.repo.name).toBe('new-name');
      expect(response.body.repo.path).toBe('/tmp/new-path');
      expect(response.body.message).toBe('Repository updated successfully');
    });

    it('should return 404 for non-existent repository', async () => {
      const response = await request
        .put('/api/repos/nonexistent')
        .send({ name: 'new-name' })
        .expect(404);

      expect(response.body.error).toBe('Repository not found');
    });
  });

  describe('DELETE /api/repos/:id', () => {
    it('should delete repository', async () => {
      runQuery(
        'INSERT INTO repositories (id, name, path, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        ['repo1', 'test-repo', '/tmp/repo', Date.now(), Date.now()]
      );

      const response = await request.delete('/api/repos/repo1').expect(200);

      expect(response.body.message).toBe('Repository deleted successfully');
    });

    it('should return 404 for non-existent repository', async () => {
      const response = await request.delete('/api/repos/nonexistent').expect(404);

      expect(response.body.error).toBe('Repository not found');
    });
  });
});
