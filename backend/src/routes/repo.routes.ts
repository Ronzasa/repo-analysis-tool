import { FastifyInstance } from 'fastify';
import { getAllRows, getOneRow, runQuery } from '../database';

export async function repoRoutes(fastify: FastifyInstance) {
  // List all repositories
  fastify.get('/', async () => {
    const repos = getAllRows('SELECT * FROM repositories');
    return { repos };
  });

  // Get single repository
  fastify.get('/:id', async (request) => {
    const { id } = request.params as { id: string };
    const repo = getOneRow('SELECT * FROM repositories WHERE id = ?', [id]);
    return { repo };
  });

  // Delete repository
  fastify.delete('/:id', async (request) => {
    const { id } = request.params as { id: string };
    runQuery('DELETE FROM repositories WHERE id = ?', [id]);
    return { message: 'Repository deleted' };
  });
}
