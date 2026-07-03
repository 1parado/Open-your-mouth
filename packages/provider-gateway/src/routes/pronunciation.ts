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

interface DimensionWeights {
  accuracy: number;
  fluency: number;
  completeness: number;
  prosody: number;
  naturalness: number;
}

interface PronunciationAssessmentBody {
  model?: string;
  language?: string;
  reference_text?: string;
  dimension_weights?: Partial<DimensionWeights>;
  [key: string]: unknown;
}

export interface PronunciationRouteContext {
  config: AppConfig;
  logger: FastifyBaseLogger;
}

export function registerPronunciationRoutes(app: FastifyInstance, context: PronunciationRouteContext) {
  app.post('/v1/pronunciation/assessments', async (
    request: FastifyRequest<{ Body: PronunciationAssessmentBody }>,
    reply: FastifyReply,
  ) => {
    const { config, logger } = context;
    const body = request.body;

    try {
      // Resolve provider
      const provider = resolveProvider(config, 'pronunciation');

      // Check if provider is available
      if (!provider.baseUrl || provider.baseUrl.includes('localhost')) {
        // Return mock data for now
        logger.info({ type: 'pronunciation_mock', message: 'Using mock pronunciation assessment' });

        const mockResponse = {
          id: `pron_${Date.now()}`,
          object: 'pronunciation.assessment',
          model: provider.model,
          language: body.language || 'en-US',
          reference_text: body.reference_text,
          scores: {
            accuracy: Math.floor(Math.random() * 30) + 70,
            fluency: Math.floor(Math.random() * 30) + 70,
            completeness: Math.floor(Math.random() * 20) + 80,
            prosody: Math.floor(Math.random() * 30) + 60,
            naturalness: Math.floor(Math.random() * 30) + 65,
            overall: 0,
          },
          issues: [],
        };

        // Calculate overall score
        const weights: DimensionWeights = {
          accuracy: 0.3,
          fluency: 0.25,
          completeness: 0.2,
          prosody: 0.15,
          naturalness: 0.1,
          ...body.dimension_weights,
        };

        mockResponse.scores.overall = Math.round(
          mockResponse.scores.accuracy * weights.accuracy +
          mockResponse.scores.fluency * weights.fluency +
          mockResponse.scores.completeness * weights.completeness +
          mockResponse.scores.prosody * weights.prosody +
          mockResponse.scores.naturalness * weights.naturalness
        );

        return reply.send(mockResponse);
      }

      // Real provider call
      const client = new HttpClient({ provider, logger });

      const requestBody = {
        ...body,
        model: body.model || provider.model,
      };

      const response = await client.post('/pronunciation/assessments', requestBody);
      reply.send(response.data);
    } catch (error: unknown) {
      const { status, message, logMessage } = getProviderErrorDetails(error);
      logger.error({ type: 'pronunciation_error', error: logMessage });

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
