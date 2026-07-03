import type { FastifyRequest, FastifyReply } from 'fastify';
import { HttpClient } from '../utils/http-client';
import { resolveProvider } from '../config/loader';
import type { AppConfig } from '../config/types';
import type { MultipartFile } from '@fastify/multipart';

export interface AudioRouteContext {
  config: AppConfig;
  logger: any;
}

export function registerAudioRoutes(app: any, context: AudioRouteContext) {
  // ASR: POST /v1/audio/transcriptions
  app.post('/v1/audio/transcriptions', async (request: FastifyRequest, reply: FastifyReply) => {
    const { config, logger } = context;

    try {
      // Resolve provider
      const provider = resolveProvider(config, 'asr');
      const client = new HttpClient({ provider, logger });

      // Parse multipart form data
      const data = await request.file();
      if (!data) {
        return reply.status(400).send({
          error: {
            message: 'No file uploaded',
            type: 'invalid_request_error',
          },
        });
      }

      // Create FormData for upstream request
      const FormData = require('form-data');
      const formData = new FormData();
      formData.append('file', data.file, {
        filename: data.filename,
        contentType: data.mimetype,
      });

      // Add other fields from the original request
      const fields = (data as any).fields;
      if (fields) {
        for (const [key, value] of Object.entries(fields)) {
          formData.append(key, (value as any).value);
        }
      }

      // Add model if not provided
      if (!fields?.model) {
        formData.append('model', provider.model);
      }

      // Forward to upstream
      const response = await client.post('/audio/transcriptions', formData, {
        headers: formData.getHeaders(),
      });

      reply.send(response.data);
    } catch (error: any) {
      logger.error({ type: 'asr_error', error: error.message });

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

  // TTS: POST /v1/audio/speech
  app.post('/v1/audio/speech', async (request: FastifyRequest, reply: FastifyReply) => {
    const { config, logger } = context;
    const body = request.body as any;

    try {
      // Resolve provider
      const provider = resolveProvider(config, 'tts');
      const client = new HttpClient({ provider, logger });

      // Merge model from provider config
      const requestBody = {
        ...body,
        model: body.model || provider.model,
      };

      // Stream audio response
      const response = await client.stream('/audio/speech', requestBody);

      // Set appropriate headers for audio
      const contentType = body.format === 'mp3' ? 'audio/mpeg' :
                         body.format === 'opus' ? 'audio/opus' :
                         body.format === 'wav' ? 'audio/wav' :
                         'audio/mpeg';

      reply.raw.writeHead(200, {
        'Content-Type': contentType,
        'Transfer-Encoding': 'chunked',
      });

      response.data.pipe(reply.raw);
    } catch (error: any) {
      logger.error({ type: 'tts_error', error: error.message });

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
