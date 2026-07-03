import { createApp } from './app';

async function start() {
  try {
    const app = await createApp();
    const port = parseInt(process.env.PORT || '8090');
    const host = process.env.HOST || '0.0.0.0';

    await app.listen({ port, host });

    app.log.info(`Provider Gateway started on http://${host}:${port}`);
    app.log.info('Available endpoints:');
    app.log.info('  POST /v1/chat/completions');
    app.log.info('  POST /v1/audio/transcriptions');
    app.log.info('  POST /v1/audio/speech');
    app.log.info('  POST /v1/pronunciation/assessments');
    app.log.info('  GET  /health');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
