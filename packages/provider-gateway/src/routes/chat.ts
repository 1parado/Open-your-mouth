import type { FastifyRequest, FastifyReply } from 'fastify';
import { HttpClient } from '../utils/http-client';
import { resolveProvider } from '../config/loader';
import type { AppConfig } from '../config/types';

export interface LLMRouteContext {
  config: AppConfig;
  logger: any;
}

export function registerLLMRoutes(app: any, context: LLMRouteContext) {
  app.post('/v1/chat/completions', async (request: FastifyRequest, reply: FastifyReply) => {
    const { config, logger } = context;
    const body = request.body as any;

    try {
      // Resolve provider
      const provider = resolveProvider(config, 'llm');
      const client = new HttpClient({ provider, logger });

      // Merge model from provider config
      const requestBody = {
        ...body,
        model: body.model || provider.model,
      };

      // Check if streaming is requested
      const isStreaming = body.stream === true;

      if (isStreaming) {
        // Stream response
        const response = await client.stream('/chat/completions', requestBody);

        reply.raw.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        });

        response.data.pipe(reply.raw);
      } else {
        // Normal JSON response
        const response = await client.post('/chat/completions', requestBody);
        reply.send(response.data);
      }
    } catch (error: any) {
      logger.error({ type: 'llm_error', error: error.message });

      const status = error.response?.status || 500;
      const message = error.response?.data?.error?.message || error.message || 'Internal server error';

      reply.status(status).send({
        error: {
          message,
          type: 'provider_error',
          code: status,
        },
      });
    }
  });
}
