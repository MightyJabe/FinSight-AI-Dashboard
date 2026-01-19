// Simple logger that works in both client and server environments
interface Logger {
  error: (message: string, meta?: Record<string, unknown>) => void;
  warn: (message: string, meta?: Record<string, unknown>) => void;
  info: (message: string, meta?: Record<string, unknown>) => void;
  debug: (message: string, meta?: Record<string, unknown>) => void;
}

const createLogger = (): Logger => {
  const log = (level: string, message: string, meta?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level,
      message,
      service: 'finsight-ai-dashboard',
      ...meta,
    };

    if (typeof window !== 'undefined') {
      // Client-side logging
      const consoleFn = console[level as keyof Console] as (...args: any[]) => void;
      if (typeof consoleFn === 'function') {
        consoleFn(`[${level.toUpperCase()}] ${message}`, meta || '');
      }
    } else {
      // Server-side logging
      console.log(JSON.stringify(logData));
    }
  };

  return {
    error: (message: string, meta?: Record<string, unknown>) => log('error', message, meta),
    warn: (message: string, meta?: Record<string, unknown>) => log('warn', message, meta),
    info: (message: string, meta?: Record<string, unknown>) => log('info', message, meta),
    debug: (message: string, meta?: Record<string, unknown>) => log('debug', message, meta),
  };
};

const logger = createLogger();
export default logger;
