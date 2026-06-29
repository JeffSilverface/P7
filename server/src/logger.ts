import winston from 'winston';
import LokiTransport from 'winston-loki';

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }),
];

if (process.env.LOKI_HOST) {
  transports.push(
    new LokiTransport({
      host: process.env.LOKI_HOST,
      labels: { app: 'p7-server' },
      json: true,
      format: winston.format.json(),
      replaceTimestamp: true,
      onConnectionError: (err) => console.error('Loki connection error:', err),
    })
  );
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'p7-server' },
  transports,
});

export default logger;
