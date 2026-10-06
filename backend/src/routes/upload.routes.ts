import { FastifyInstance, FastifyRequest } from 'fastify';

export async function uploadRoutes(fastify: FastifyInstance) {
  // Upload zip file
  fastify.post('/zip', async (request, reply) => {
    const data = await request.file();
    
    if (!data) {
      return reply.status(400).send({ error: 'No file uploaded' });
    }

    // TODO: Save file and trigger processing
    return { message: 'File uploaded successfully', filename: data.filename };
  });

  // Clone from URL
  fastify.post('/clone', async (request: FastifyRequest<{ Body: { url: string } }>, reply) => {
    const { url } = request.body;
    
    if (!url) {
      return reply.status(400).send({ error: 'URL is required' });
    }

    // TODO: Trigger clone operation
    return { message: 'Clone operation started', url };
  });
}
