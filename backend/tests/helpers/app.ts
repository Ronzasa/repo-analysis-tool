import Fastify from 'fastify';
import { routes } from '../src/routes';

export async function buildTestApp() {
  const app = Fastify({
    logger: false,
  });

  await app.register(routes);

  return app;
}
