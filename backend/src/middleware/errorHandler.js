/**
 * Centralized error handler.
 * Must be registered LAST in Express middleware chain.
 */

import logger from '../utils/logger.js';

const errorHandler = (err, req, res, next) => {
  logger.error('[Server] Unhandled error', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  const status = err.status || err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'An unexpected error occurred'
    : err.message;

  res.status(status).json({ error: message, code: err.code || 'INTERNAL_ERROR' });
};

export default errorHandler;
