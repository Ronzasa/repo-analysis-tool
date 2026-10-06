import { FastifyInstance } from 'fastify';
import {
  saveAuthor,
  getAuthor,
  getAuthorByEmail,
  listAuthors,
  mergeAuthors,
  listMergedAuthors,
  listActiveAuthors,
  deleteAuthor,
  getEffectiveAuthor
} from '../services/author.service';

export async function authorRoutes(fastify: FastifyInstance) {
  // List all authors
  fastify.get('/', async (request, reply) => {
    try {
      const query = request.query as any;
      let authors;
      
      if (query.filter === 'merged') {
        authors = listMergedAuthors();
      } else if (query.filter === 'active') {
        authors = listActiveAuthors();
      } else {
        authors = listAuthors();
      }
      
      return { authors, count: authors.length };
    } catch (error: any) {
      request.log.error(error);
      reply.code(500);
      return { error: 'Failed to list authors', message: error.message };
    }
  });

  // Get author by ID
  fastify.get('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const author = getAuthor(id);
      
      if (!author) {
        reply.code(404);
        return { error: 'Author not found' };
      }
      
      return { author };
    } catch (error: any) {
      request.log.error(error);
      reply.code(500);
      return { error: 'Failed to get author', message: error.message };
    }
  });

  // Get author by email
  fastify.get('/email/:email', async (request, reply) => {
    try {
      const { email } = request.params as { email: string };
      const author = getAuthorByEmail(email);
      
      if (!author) {
        reply.code(404);
        return { error: 'Author not found' };
      }
      
      return { author };
    } catch (error: any) {
      request.log.error(error);
      reply.code(500);
      return { error: 'Failed to get author', message: error.message };
    }
  });

  // Get effective author (following merge chain)
  fastify.get('/:id/effective', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const author = getEffectiveAuthor(id);
      
      if (!author) {
        reply.code(404);
        return { error: 'Author not found' };
      }
      
      return { author };
    } catch (error: any) {
      request.log.error(error);
      reply.code(500);
      return { error: 'Failed to get effective author', message: error.message };
    }
  });

  // Create new author
  fastify.post('/', async (request, reply) => {
    try {
      const body = request.body as any;
      
      if (!body.id || !body.name || !body.email) {
        reply.code(400);
        return { error: 'id, name, and email are required' };
      }
      
      saveAuthor({
        id: body.id,
        name: body.name,
        email: body.email,
        merged_into: body.merged_into
      });
      
      const author = getAuthor(body.id);
      
      reply.code(201);
      return { author, message: 'Author created successfully' };
    } catch (error: any) {
      request.log.error(error);
      reply.code(500);
      return { error: 'Failed to create author', message: error.message };
    }
  });

  // Merge authors
  fastify.post('/merge', async (request, reply) => {
    try {
      const body = request.body as any;
      
      if (!body.source_ids || !body.target_id) {
        reply.code(400);
        return { error: 'source_ids and target_id are required' };
      }
      
      if (!Array.isArray(body.source_ids) || body.source_ids.length === 0) {
        reply.code(400);
        return { error: 'source_ids must be a non-empty array' };
      }
      
      mergeAuthors(body.source_ids, body.target_id);
      
      return { 
        message: 'Authors merged successfully',
        merged_count: body.source_ids.length,
        target_id: body.target_id
      };
    } catch (error: any) {
      request.log.error(error);
      reply.code(500);
      return { error: 'Failed to merge authors', message: error.message };
    }
  });

  // Delete author
  fastify.delete('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      
      const author = getAuthor(id);
      if (!author) {
        reply.code(404);
        return { error: 'Author not found' };
      }
      
      deleteAuthor(id);
      
      return { message: 'Author deleted successfully' };
    } catch (error: any) {
      request.log.error(error);
      reply.code(500);
      return { error: 'Failed to delete author', message: error.message };
    }
  });
}
