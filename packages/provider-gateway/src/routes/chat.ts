import type {
  FastifyBaseLogger,
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from 'fastify';
import { HttpClient } from '../utils/http-client';
import { resolveProvider } from '../config/loader';
import type { AppConfig } from '../config/types';
import { getProviderErrorDetails } from '../utils/provider-error';

interface ChatCompletionBody {
  model?: string;
  stream?: boolean;
  [key: string]: unknown;
}

export interface LLMRouteContext {
  config: AppConfig;
  logger: FastifyBaseLogger;
}

export function registerLLMRoutes(app: FastifyInstance, context: LLMRouteContext) {
  app.post('/v1/chat/completions', async (
    request: FastifyRequest<{ Body: ChatCompletionBody }>,
    reply: FastifyReply,
  ) => {
    const { config, logger } = context;
    const body = request.body;

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
    } catch (error: unknown) {
      const { status, message, logMessage } = getProviderErrorDetails(error);
      logger.error({ type: 'llm_error', error: logMessage });

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
