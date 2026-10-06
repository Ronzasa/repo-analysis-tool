import { FastifyInstance } from 'fastify';
import { Database } from '../database';

export async function repoRoutes(fastify: FastifyInstance) {
  // List all repositories
  fastify.get('/', async () => {
    const db = Database.getInstance();
    const repos = db.prepare('SELECT * FROM repositories').all();
    return { repos };
  });

  // Get single repository
  fastify.get('/:id', async (request) => {
    const { id } = request.params as { id: string };
    const db = Database.getInstance();
    const repo = db.prepare('SELECT * FROM repositories WHERE id = ?').get(id);
    return { repo };
  });

  // Delete repository
  fastify.delete('/:id', async (request) => {
    const { id } = request.params as { id: string };
    const db = Database.getInstance();
    db.prepare('DELETE FROM repositories WHERE id = ?').run(id);
    return { message: 'Repository deleted' };
  });
}
