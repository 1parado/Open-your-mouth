import dotenv from 'dotenv';
dotenv.config();

import { buildApp, initializeDatabase } from './app';
import { logger } from './utils/logger';

const PORT = parseInt(process.env.API_PORT || '8080');
const HOST = process.env.API_HOST || '0.0.0.0';

async function main() {
  try {
    await initializeDatabase();
    const app = await buildApp();

    await app.listen({ port: PORT, host: HOST });
    logger.info(`API Service running at http://${HOST}:${PORT}`);
  } catch (err) {
    logger.error({ err }, 'Failed to start API Service');
    process.exit(1);
  }
}

main();