import winston from 'winston';
import { LogstashTransport } from './logstashTransport';

const transports: winston.transport[] = [
  new winston.transports.Console(),
];

if (process.env.LOGSTASH_HOST) {
  transports.push(
    new LogstashTransport({
      host: process.env.LOGSTASH_HOST,
      port: Number(process.env.LOGSTASH_PORT) || 5000,
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
