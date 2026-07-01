import express, { Application, NextFunction, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import organizationRoutes from './routes/organizationRoutes';
import contactRoutes from './routes/contactRoutes';
import logger from './logger';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// HTTP request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info('http_request', {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration_ms: Date.now() - start,
    });
  });
  next();
});

// Routes
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'OK', message: 'Orion CRM API is running' });
});

app.post('/api/logs', (req: Request, res: Response) => {
  const validLevels = ['info', 'warn', 'error'];
  const level = validLevels.includes(req.body.level) ? req.body.level : 'info';
  const message = String(req.body.message ?? '').slice(0, 500);
  const meta = {
    source: 'frontend',
    url: typeof req.body.url === 'string' ? req.body.url.slice(0, 500) : undefined,
    method: typeof req.body.method === 'string' ? req.body.method.slice(0, 10) : undefined,
    status: typeof req.body.status === 'number' ? req.body.status : undefined,
    filename: typeof req.body.filename === 'string' ? req.body.filename.slice(0, 500) : undefined,
    line: typeof req.body.line === 'number' ? req.body.line : undefined,
    col: typeof req.body.col === 'number' ? req.body.col : undefined,
    reason: typeof req.body.reason === 'string' ? req.body.reason.slice(0, 500) : undefined,
  };
  logger.log(level, message, meta); // NOSONAR
  res.status(204).send();
});

app.use('/api/organizations', organizationRoutes);
app.use('/api/contacts', contactRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  logger.warn('route_not_found', { url: _req.originalUrl });
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('unhandled_error', { message: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  logger.info('server_started', { port: PORT });
});

export default app;
