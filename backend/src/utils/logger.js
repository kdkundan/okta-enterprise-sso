/**
 * Lightweight structured logger.
 * In production, swap this for Winston or Pino for JSON log output
 * compatible with log aggregators (Datadog, CloudWatch, ELK).
 */

const levels = { info: 'INFO', warn: 'WARN', error: 'ERROR', debug: 'DEBUG' };

const log = (level, message, meta = {}) => {
  const entry = {
    timestamp: new Date().toISOString(),
    level: levels[level] || level.toUpperCase(),
    message,
    ...meta,
  };
  if (level === 'error') {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
};

const logger = {
  info:  (msg, meta) => log('info', msg, meta),
  warn:  (msg, meta) => log('warn', msg, meta),
  error: (msg, meta) => log('error', msg, meta),
  debug: (msg, meta) => { if (process.env.NODE_ENV !== 'production') log('debug', msg, meta); },
};

export default logger;
