// Simple logger that works in both client and server environments
interface Logger {
  error: (message: string, meta?: any) => void;
  warn: (message: string, meta?: any) => void;
  info: (message: string, meta?: any) => void;
  debug: (message: string, meta?: any) => void;
}

const createLogger = (): Logger => {
  const log = (level: string, message: string, meta?: any) => {
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
    error: (message: string, meta?: any) => log('error', message, meta),
    warn: (message: string, meta?: any) => log('warn', message, meta),
    info: (message: string, meta?: any) => log('info', message, meta),
    debug: (message: string, meta?: any) => log('debug', message, meta),
  };
};

const logger = createLogger();
export default logger;
