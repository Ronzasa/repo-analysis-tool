import { FastifyInstance } from 'fastify';
import {
  getFileMetrics,
  getDirectoryMetrics,
  getMetricsByRepo,
  getMetricsByCommit,
  getAggregatedFileMetrics,
  getAggregatedDirectoryMetrics
} from '../services/metric.service';

export async function metricRoutes(fastify: FastifyInstance) {
  // Get all metrics for a repository
  fastify.get('/repo/:repoId', async (request, reply) => {
    try {
      const { repoId } = request.params as { repoId: string };
      const metrics = getMetricsByRepo(repoId);
      return { metrics, count: metrics.length };
    } catch (error: any) {
      request.log.error(error);
      reply.code(500);
      return { error: 'Failed to get metrics', message: error.message };
    }
  });

  // Get metrics for a specific commit
  fastify.get('/commit/:commitHash', async (request, reply) => {
    try {
      const { commitHash } = request.params as { commitHash: string };
      const metrics = getMetricsByCommit(commitHash);
      return { metrics, count: metrics.length };
    } catch (error: any) {
      request.log.error(error);
      reply.code(500);
      return { error: 'Failed to get metrics', message: error.message };
    }
  });

  // Get file metrics with filters
  fastify.get('/file', async (request, reply) => {
    try {
      const query = request.query as any;
      const filters = {
        repo_id: query.repo_id,
        file_path: query.file_path,
        commit_hash: query.commit_hash,
        author_id: query.author_id,
        start_time: query.start_time ? parseInt(query.start_time) : undefined,
        end_time: query.end_time ? parseInt(query.end_time) : undefined
      };
      
      const metrics = getFileMetrics(filters);
      return { metrics, count: metrics.length };
    } catch (error: any) {
      request.log.error(error);
      reply.code(500);
      return { error: 'Failed to get file metrics', message: error.message };
    }
  });

  // Get aggregated file metrics
  fastify.get('/file/aggregated', async (request, reply) => {
    try {
      const query = request.query as any;
      
      if (!query.repo_id || !query.file_path) {
        reply.code(400);
        return { error: 'repo_id and file_path are required' };
      }
      
      const metrics = getAggregatedFileMetrics(query.repo_id, query.file_path);
      return { metrics };
    } catch (error: any) {
      request.log.error(error);
      reply.code(500);
      return { error: 'Failed to get aggregated metrics', message: error.message };
    }
  });

  // Get directory metrics with filters
  fastify.get('/directory', async (request, reply) => {
    try {
      const query = request.query as any;
      const filters = {
        repo_id: query.repo_id,
        dir_path: query.dir_path,
        commit_hash: query.commit_hash,
        author_id: query.author_id,
        start_time: query.start_time ? parseInt(query.start_time) : undefined,
        end_time: query.end_time ? parseInt(query.end_time) : undefined
      };
      
      const metrics = getDirectoryMetrics(filters);
      return { metrics, count: metrics.length };
    } catch (error: any) {
      request.log.error(error);
      reply.code(500);
      return { error: 'Failed to get directory metrics', message: error.message };
    }
  });

  // Get aggregated directory metrics
  fastify.get('/directory/aggregated', async (request, reply) => {
    try {
      const query = request.query as any;
      
      if (!query.repo_id || !query.dir_path) {
        reply.code(400);
        return { error: 'repo_id and dir_path are required' };
      }
      
      const metrics = getAggregatedDirectoryMetrics(query.repo_id, query.dir_path);
      return { metrics };
    } catch (error: any) {
      request.log.error(error);
      reply.code(500);
      return { error: 'Failed to get aggregated metrics', message: error.message };
    }
  });
}
