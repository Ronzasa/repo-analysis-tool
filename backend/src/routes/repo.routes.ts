import { FastifyInstance } from 'fastify';
import {
  saveRepository,
  getRepository,
  listRepositories,
  updateRepository,
  deleteRepository,
  getRepositoryByName
} from '../services/repo.service';

export async function repoRoutes(fastify: FastifyInstance) {
  // List all repositories
  fastify.get('/', async (request, reply) => {
    try {
      const repos = listRepositories();
      return { repos, count: repos.length };
    } catch (error: any) {
      request.log.error(error);
      reply.code(500);
      return { error: 'Failed to list repositories', message: error.message };
    }
  });

  // Get single repository by ID
  fastify.get('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const repo = getRepository(id);
      
      if (!repo) {
        reply.code(404);
        return { error: 'Repository not found' };
      }
      
      return { repo };
    } catch (error: any) {
      request.log.error(error);
      reply.code(500);
      return { error: 'Failed to get repository', message: error.message };
    }
  });

  // Create new repository
  fastify.post('/', async (request, reply) => {
    try {
      const body = request.body as any;
      
      if (!body.name || !body.path) {
        reply.code(400);
        return { error: 'Name and path are required' };
      }
      
      // Check if repository with same name exists
      const existing = getRepositoryByName(body.name);
      if (existing) {
        reply.code(409);
        return { error: 'Repository with this name already exists' };
      }
      
      const repo = saveRepository({
        name: body.name,
        path: body.path,
        url: body.url
      });
      
      reply.code(201);
      return { repo, message: 'Repository created successfully' };
    } catch (error: any) {
      request.log.error(error);
      reply.code(500);
      return { error: 'Failed to create repository', message: error.message };
    }
  });

  // Update repository
  fastify.put('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const body = request.body as any;
      
      const existing = getRepository(id);
      if (!existing) {
        reply.code(404);
        return { error: 'Repository not found' };
      }
      
      const updated = updateRepository(id, body);
      
      return { repo: updated, message: 'Repository updated successfully' };
    } catch (error: any) {
      request.log.error(error);
      reply.code(500);
      return { error: 'Failed to update repository', message: error.message };
    }
  });

  // Delete repository
  fastify.delete('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      
      const deleted = deleteRepository(id);
      
      if (!deleted) {
        reply.code(404);
        return { error: 'Repository not found' };
      }
      
      return { message: 'Repository deleted successfully' };
    } catch (error: any) {
      request.log.error(error);
      reply.code(500);
      return { error: 'Failed to delete repository', message: error.message };
    }
  });
}
