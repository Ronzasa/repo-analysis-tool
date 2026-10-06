import supertest from 'supertest';
import Fastify, { FastifyInstance } from 'fastify';
import { authorRoutes } from '../src/routes/author.routes';
import { initDatabase, closeDatabase, runQuery } from '../src/database';

describe('Author API', () => {
  let fastify: FastifyInstance;
  let request: any;

  beforeAll(async () => {
    await initDatabase();
    fastify = Fastify();
    fastify.register(authorRoutes, { prefix: '/api/authors' });
    await fastify.ready();
    request = supertest(fastify.server);
  });

  afterAll(async () => {
    await fastify.close();
    closeDatabase();
  });

  beforeEach(() => {
    runQuery('DELETE FROM authors');
  });

  describe('GET /api/authors', () => {
    it('should list all authors', async () => {
      runQuery(
        'INSERT INTO authors (id, name, email) VALUES (?, ?, ?)',
        ['author1', 'John Doe', 'john@example.com']
      );
      runQuery(
        'INSERT INTO authors (id, name, email) VALUES (?, ?, ?)',
        ['author2', 'Jane Doe', 'jane@example.com']
      );

      const response = await request.get('/api/authors').expect(200);

      expect(response.body.authors).toHaveLength(2);
      expect(response.body.count).toBe(2);
    });

    it('should filter merged authors', async () => {
      runQuery(
        'INSERT INTO authors (id, name, email, merged_into) VALUES (?, ?, ?, ?)',
        ['author1', 'John Doe', 'john@example.com', null]
      );
      runQuery(
        'INSERT INTO authors (id, name, email, merged_into) VALUES (?, ?, ?, ?)',
        ['author2', 'J. Doe', 'j.doe@example.com', 'author1']
      );

      const response = await request
        .get('/api/authors?filter=merged')
        .expect(200);

      expect(response.body.authors).toHaveLength(1);
      expect(response.body.authors[0].id).toBe('author2');
    });

    it('should filter active authors', async () => {
      runQuery(
        'INSERT INTO authors (id, name, email, merged_into) VALUES (?, ?, ?, ?)',
        ['author1', 'John Doe', 'john@example.com', null]
      );
      runQuery(
        'INSERT INTO authors (id, name, email, merged_into) VALUES (?, ?, ?, ?)',
        ['author2', 'J. Doe', 'j.doe@example.com', 'author1']
      );

      const response = await request
        .get('/api/authors?filter=active')
        .expect(200);

      expect(response.body.authors).toHaveLength(1);
      expect(response.body.authors[0].id).toBe('author1');
    });
  });

  describe('GET /api/authors/:id', () => {
    it('should get author by ID', async () => {
      runQuery(
        'INSERT INTO authors (id, name, email) VALUES (?, ?, ?)',
        ['author1', 'John Doe', 'john@example.com']
      );

      const response = await request.get('/api/authors/author1').expect(200);

      expect(response.body.author).toBeDefined();
      expect(response.body.author.id).toBe('author1');
      expect(response.body.author.name).toBe('John Doe');
    });

    it('should return 404 for non-existent author', async () => {
      const response = await request.get('/api/authors/nonexistent').expect(404);

      expect(response.body.error).toBe('Author not found');
    });
  });

  describe('GET /api/authors/email/:email', () => {
    it('should get author by email', async () => {
      runQuery(
        'INSERT INTO authors (id, name, email) VALUES (?, ?, ?)',
        ['author1', 'John Doe', 'john@example.com']
      );

      const response = await request
        .get('/api/authors/email/john@example.com')
        .expect(200);

      expect(response.body.author).toBeDefined();
      expect(response.body.author.email).toBe('john@example.com');
    });

    it('should return 404 for non-existent email', async () => {
      const response = await request
        .get('/api/authors/email/nonexistent@example.com')
        .expect(404);

      expect(response.body.error).toBe('Author not found');
    });
  });

  describe('POST /api/authors', () => {
    it('should create new author', async () => {
      const response = await request
        .post('/api/authors')
        .send({
          id: 'author1',
          name: 'John Doe',
          email: 'john@example.com'
        })
        .expect(201);

      expect(response.body.author).toBeDefined();
      expect(response.body.author.id).toBe('author1');
      expect(response.body.author.name).toBe('John Doe');
      expect(response.body.message).toBe('Author created successfully');
    });

    it('should return 400 when required fields are missing', async () => {
      const response = await request
        .post('/api/authors')
        .send({ name: 'John Doe' })
        .expect(400);

      expect(response.body.error).toBe('id, name, and email are required');
    });
  });

  describe('POST /api/authors/merge', () => {
    it('should merge authors', async () => {
      runQuery(
        'INSERT INTO authors (id, name, email) VALUES (?, ?, ?)',
        ['author1', 'John Doe', 'john@example.com']
      );
      runQuery(
        'INSERT INTO authors (id, name, email) VALUES (?, ?, ?)',
        ['author2', 'J. Doe', 'j.doe@example.com']
      );
      runQuery(
        'INSERT INTO authors (id, name, email) VALUES (?, ?, ?)',
        ['author3', 'John D.', 'jd@example.com']
      );

      const response = await request
        .post('/api/authors/merge')
        .send({
          source_ids: ['author2', 'author3'],
          target_id: 'author1'
        })
        .expect(200);

      expect(response.body.message).toBe('Authors merged successfully');
      expect(response.body.merged_count).toBe(2);
      expect(response.body.target_id).toBe('author1');
    });

    it('should return 400 when source_ids is missing', async () => {
      const response = await request
        .post('/api/authors/merge')
        .send({ target_id: 'author1' })
        .expect(400);

      expect(response.body.error).toBe('source_ids and target_id are required');
    });

    it('should return 400 when source_ids is empty', async () => {
      const response = await request
        .post('/api/authors/merge')
        .send({ source_ids: [], target_id: 'author1' })
        .expect(400);

      expect(response.body.error).toBe('source_ids must be a non-empty array');
    });
  });

  describe('DELETE /api/authors/:id', () => {
    it('should delete author', async () => {
      runQuery(
        'INSERT INTO authors (id, name, email) VALUES (?, ?, ?)',
        ['author1', 'John Doe', 'john@example.com']
      );

      const response = await request.delete('/api/authors/author1').expect(200);

      expect(response.body.message).toBe('Author deleted successfully');
    });

    it('should return 404 for non-existent author', async () => {
      const response = await request.delete('/api/authors/nonexistent').expect(404);

      expect(response.body.error).toBe('Author not found');
    });
  });
});
