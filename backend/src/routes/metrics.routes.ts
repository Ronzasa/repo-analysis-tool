import { FastifyInstance, FastifyRequest } from 'fastify';
import axios from 'axios';
import { config } from '../config';

export async function metricsRoutes(fastify: FastifyInstance) {
  // Get file metrics
  fastify.get('/file/:repoId/:filePath', async (request) => {
    const { repoId, filePath } = request.params as { repoId: string; filePath: string };
    // TODO: Fetch from git service
    return { file: filePath, metrics: {} };
  });

  // Get directory metrics
  fastify.get('/directory/:repoId/:dirPath', async (request) => {
    const { repoId, dirPath } = request.params as { repoId: string; dirPath: string };
    // TODO: Fetch from git service
    return { directory: dirPath, metrics: {} };
  });

  // Get repository metrics
  fastify.get('/repo/:repoId', async (request) => {
    const { repoId } = request.params as { repoId: string };
    // TODO: Fetch from git service
    return { repoId, metrics: {} };
  });

  // Get author metrics
  fastify.get('/author/:repoId/:author', async (request) => {
    const { repoId, author } = request.params as { repoId: string; author: string };
    // TODO: Fetch from git service
    return { author, metrics: {} };
  });
}
