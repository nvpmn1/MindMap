import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { logger } from './utils/logger';
import { env } from './utils/env';
import { initializeObservability, captureException, flushObservability } from './observability';

initializeObservability();

process.on('unhandledRejection', (reason) => {
  captureException(reason, { event: 'unhandledRejection' });
  logger.error({ reason }, 'Unhandled promise rejection');
  void (async () => {
    await flushObservability();
  })();
});

process.on('uncaughtException', (error) => {
  captureException(error, { event: 'uncaughtException' });
  logger.fatal({ error }, 'Uncaught exception');
  void (async () => {
    await flushObservability();
    process.exit(1);
  })();
});

const PORT = env.PORT;
const HOST = '0.0.0.0'; // Bind to all interfaces (required for Render/Docker)

app.listen(PORT, HOST, () => {
  logger.info(`🚀 Server running on ${HOST}:${PORT}`);
  logger.info(`📍 Environment: ${env.NODE_ENV}`);
  logger.info(`🔗 Frontend URL: ${env.FRONTEND_URL}`);
});
