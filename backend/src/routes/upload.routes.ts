import { FastifyInstance, FastifyRequest } from 'fastify';
import { saveRepository, getRepositoryByName } from '../services/repo.service';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const REPOS_DIR = path.join(__dirname, '../../data/repos');

// Ensure repos directory exists
if (!fs.existsSync(REPOS_DIR)) {
  fs.mkdirSync(REPOS_DIR, { recursive: true });
}

export async function uploadRoutes(fastify: FastifyInstance) {
  // Clone from URL
  fastify.post('/clone', async (request: FastifyRequest<{ Body: { url: string; name?: string } }>, reply) => {
    try {
      const { url, name } = request.body;

      if (!url) {
        return reply.status(400).send({ error: 'URL is required' });
      }

      // Extract repo name from URL if not provided
      const repoName = name || url.split('/').pop()?.replace('.git', '') || 'unknown-repo';

      // Check if repository with same name exists
      const existing = getRepositoryByName(repoName);
      if (existing) {
        return reply.status(409).send({ error: 'Repository with this name already exists' });
      }

      // Create target path
      const repoId = crypto.randomUUID();
      const targetPath = path.join(REPOS_DIR, repoId);

      // Clone the repository
      fastify.log.info(`Cloning ${url} to ${targetPath}`);
      execSync(`git clone "${url}" "${targetPath}" 2>&1`, { timeout: 300000 });

      // Save to database
      const repo = saveRepository({
        name: repoName,
        path: targetPath,
        url
      });

      return reply.status(201).send({
        repo,
        message: 'Repository cloned successfully'
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Failed to clone repository',
        message: error.message
      });
    }
  });

  // Upload zip file
  fastify.post('/zip', async (request, reply) => {
    try {
      const data = await request.file();

      if (!data) {
        return reply.status(400).send({ error: 'No file uploaded' });
      }

      const repoName = (request.body as any)?.name || data.filename.replace('.zip', '');
      const repoId = crypto.randomUUID();
      const targetPath = path.join(REPOS_DIR, repoId);
      const zipPath = path.join(REPOS_DIR, `${repoId}.zip`);

      // Ensure directory exists
      fs.mkdirSync(targetPath, { recursive: true });

      // Save uploaded file
      const writeStream = fs.createWriteStream(zipPath);
      await data.pipe(writeStream);

      // Wait for file to be written
      await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });

      // Extract zip file
      fastify.log.info(`Extracting ${zipPath} to ${targetPath}`);
      execSync(`unzip -o "${zipPath}" -d "${targetPath}" 2>&1`, { timeout: 60000 });

      // Clean up zip file
      fs.unlinkSync(zipPath);

      // Find the actual repo path (might be nested in a subdirectory)
      let actualRepoPath = targetPath;
      const items = fs.readdirSync(targetPath);
      if (items.length === 1 && fs.statSync(path.join(targetPath, items[0])).isDirectory()) {
        actualRepoPath = path.join(targetPath, items[0]);
      }

      // Save to database
      const repo = saveRepository({
        name: repoName,
        path: actualRepoPath
      });

      return reply.status(201).send({
        repo,
        message: 'ZIP file uploaded and extracted successfully'
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Failed to upload ZIP file',
        message: error.message
      });
    }
  });
}
