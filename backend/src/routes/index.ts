import { FastifyInstance } from 'fastify';
import { uploadRoutes } from './upload.routes';
import { repoRoutes } from './repo.routes';
import { metricsRoutes } from './metrics.routes';

export async function routes(fastify: FastifyInstance) {
  fastify.register(uploadRoutes, { prefix: '/upload' });
  fastify.register(repoRoutes, { prefix: '/repos' });
  fastify.register(metricsRoutes, { prefix: '/metrics' });
}
