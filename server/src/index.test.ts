import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';

vi.mock('./logger', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    log: vi.fn(),
  },
}));

import app from './index';

describe('GET /api/health', () => {
  it('returns 200 with status OK', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('OK');
  });
});

describe('POST /api/logs', () => {
  it('accepts valid log and returns 204', async () => {
    const res = await request(app)
      .post('/api/logs')
      .send({ level: 'info', message: 'test log' });
    expect(res.status).toBe(204);
  });

  it('defaults to info level for unknown levels', async () => {
    const res = await request(app)
      .post('/api/logs')
      .send({ level: 'critical', message: 'test' });
    expect(res.status).toBe(204);
  });

  it('truncates message over 500 chars', async () => {
    const res = await request(app)
      .post('/api/logs')
      .send({ level: 'error', message: 'x'.repeat(600) });
    expect(res.status).toBe(204);
  });

  it('accepts all optional meta fields', async () => {
    const res = await request(app)
      .post('/api/logs')
      .send({
        level: 'error',
        message: 'api_error',
        url: '/api/contacts',
        method: 'GET',
        status: 500,
        filename: 'App.tsx',
        line: 42,
        col: 10,
        reason: 'Network Error',
      });
    expect(res.status).toBe(204);
  });

  it('ignores non-string/non-number meta fields', async () => {
    const res = await request(app)
      .post('/api/logs')
      .send({ level: 'warn', message: 'test', url: 123, status: 'bad', line: 'nope' });
    expect(res.status).toBe(204);
  });
});

describe('Unknown routes', () => {
  it('returns 404 for unknown route', async () => {
    const res = await request(app).get('/api/unknown');
    expect(res.status).toBe(404);
  });
});
