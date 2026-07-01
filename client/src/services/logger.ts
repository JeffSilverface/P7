const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

type LogLevel = 'info' | 'warn' | 'error';

function send(level: LogLevel, message: string, meta: Record<string, unknown> = {}) {
  navigator.sendBeacon(
    `${API_BASE_URL}/logs`,
    new Blob([JSON.stringify({ level, message, ...meta })], { type: 'application/json' })
  );
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => send('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => send('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => send('error', message, meta),
};

export function initGlobalErrorHandlers() {
  globalThis.addEventListener('error', (event) => {
    logger.error('js_error', {
      message: event.message,
      filename: event.filename,
      line: event.lineno,
      col: event.colno,
    });
  });

  globalThis.addEventListener('unhandledrejection', (event) => {
    logger.error('unhandled_promise', {
      reason: String(event.reason),
    });
  });
}
