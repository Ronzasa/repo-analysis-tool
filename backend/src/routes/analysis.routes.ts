import { FastifyInstance } from 'fastify';
import axios from 'axios';
import { getRepository } from '../services/repo.service';
import { saveFileMetric, saveDirectoryMetric } from '../services/metric.service';
import { saveAuthor, getAuthorByEmail } from '../services/author.service';
import { saveDatabase } from '../database';

export async function analysisRoutes(fastify: FastifyInstance) {
  // Trigger full analysis for a repository
  fastify.post('/analyze/:repoId', async (request, reply) => {
    try {
      const { repoId } = request.params as { repoId: string };
      const repo = getRepository(repoId);
      
      if (!repo) {
        reply.code(404);
        return { error: 'Repository not found' };
      }
      
      // Call Python git-service to calculate metrics
      const gitServiceUrl = process.env.GIT_SERVICE_URL || 'http://localhost:8000';
      
      fastify.log.info(`Starting analysis for repository: ${repo.name}`);
      
      // Trigger analysis in git-service
      const response = await axios.post(`${gitServiceUrl}/api/analyze`, {
        repo_path: repo.path,
        repo_id: repoId
      }, {
        timeout: 900000 // 15 minute timeout for large repos (100k+ commits)
      });
      
      const { file_metrics, directory_metrics, authors } = response.data;
      
      // Save authors to database
      for (const authorData of authors) {
        saveAuthor({
          id: authorData.id,
          name: authorData.name,
          email: authorData.email
        });
      }
      
      // Save file metrics to database
      for (const metric of file_metrics) {
        saveFileMetric({
          repo_id: repoId,
          file_path: metric.file_path,
          commit_hash: metric.commit_hash,
          author_id: metric.author_id,
          added_lines: metric.added_lines,
          removed_lines: metric.removed_lines,
          growth: metric.growth,
          churn: metric.churn
        });
      }
      
      // Save directory metrics to database
      for (const metric of directory_metrics) {
        saveDirectoryMetric({
          repo_id: repoId,
          dir_path: metric.dir_path,
          commit_hash: metric.commit_hash,
          author_id: metric.author_id,
          added_lines: metric.added_lines,
          removed_lines: metric.removed_lines,
          growth: metric.growth,
          churn: metric.churn
        });
      }
      
      // Save database to disk
      saveDatabase();
      
      return {
        message: 'Analysis completed successfully',
        repo_id: repoId,
        repo_name: repo.name,
        stats: {
          file_metrics_count: file_metrics.length,
          directory_metrics_count: directory_metrics.length,
          authors_count: authors.length
        }
      };
    } catch (error: any) {
      fastify.log.error(error);
      
      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
        reply.code(503);
        return { 
          error: 'Git service unavailable', 
          message: 'The git analysis service is not running. Please start it on port 8000.' 
        };
      }
      
      if (error.response) {
        reply.code(error.response.status);
        return { 
          error: 'Analysis failed', 
          message: error.response.data.message || error.message 
        };
      }
      
      reply.code(500);
      return { error: 'Analysis failed', message: error.message };
    }
  });

  // Get analysis status
  fastify.get('/analyze/:repoId/status', async (request, reply) => {
    try {
      const { repoId } = request.params as { repoId: string };
      const repo = getRepository(repoId);
      
      if (!repo) {
        reply.code(404);
        return { error: 'Repository not found' };
      }
      
      // Check if there are any metrics for this repo
      const { getMetricsByRepo } = await import('../services/metric.service');
      const metrics = getMetricsByRepo(repoId);
      
      return {
        repo_id: repoId,
        repo_name: repo.name,
        analyzed: metrics.length > 0,
        metrics_count: metrics.length,
        last_analyzed: repo.updated_at
      };
    } catch (error: any) {
      fastify.log.error(error);
      reply.code(500);
      return { error: 'Failed to get status', message: error.message };
    }
  });
}
