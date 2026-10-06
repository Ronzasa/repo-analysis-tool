import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { config } from './config';
import { repoRoutes } from './routes/repo.routes';
import { metricRoutes } from './routes/metric.routes';
import { authorRoutes } from './routes/author.routes';
import { analysisRoutes } from './routes/analysis.routes';
import { uploadRoutes } from './routes/upload.routes';
import { initDatabase, closeDatabase } from './database';

const fastify = Fastify({
  logger: true,
});

// Register plugins
fastify.register(cors, {
  origin: true,
});

fastify.register(multipart, {
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024, // 2GB limit for large repos
  },
});

// Register routes
fastify.register(repoRoutes, { prefix: '/api/repos' });
fastify.register(metricRoutes, { prefix: '/api/metrics' });
fastify.register(authorRoutes, { prefix: '/api/authors' });
fastify.register(analysisRoutes, { prefix: '/api' });
fastify.register(uploadRoutes, { prefix: '/api/upload' });

// Health check
fastify.get('/health', async () => {
  return { status: 'healthy', timestamp: new Date().toISOString() };
});

// API info
fastify.get('/', async () => {
  return {
    name: 'Repository Analysis Tool API',
    version: '1.0.0',
    endpoints: {
      repositories: '/api/repos',
      metrics: '/api/metrics',
      authors: '/api/authors',
      analysis: '/api/analyze/:repoId'
    }
  };
});

// Start server
const start = async () => {
  try {
    // Initialize database
    await initDatabase();
    console.log('Database initialized');

    await fastify.listen({ port: config.port, host: '0.0.0.0' });
    console.log(`Backend API running on port ${config.port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  closeDatabase();
  await fastify.close();
  process.exit(0);
});

start();
