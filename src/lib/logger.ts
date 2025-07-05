// Client-safe logger that works in both browser and Node.js environments

interface LoggerInterface {
  error: (message: string, meta?: any) => void;
  warn: (message: string, meta?: any) => void;
  info: (message: string, meta?: any) => void;
  debug: (message: string, meta?: any) => void;
}

class BrowserLogger implements LoggerInterface {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatMessage(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaString = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaString}`;
  }

  error(message: string, meta?: any): void {
    if (this.isDevelopment) {
      console.error(this.formatMessage('error', message, meta));
    } else {
      console.error(message, meta);
    }
  }

  warn(message: string, meta?: any): void {
    if (this.isDevelopment) {
      console.warn(this.formatMessage('warn', message, meta));
    } else {
      console.warn(message, meta);
    }
  }

  info(message: string, meta?: any): void {
    if (this.isDevelopment) {
      console.info(this.formatMessage('info', message, meta));
    }
    // In production, info logs are suppressed
  }

  debug(message: string, meta?: any): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, meta));
    }
    // In production, debug logs are suppressed
  }
}

// Create logger instance
const logger: LoggerInterface = new BrowserLogger();

// Server-side logger with Winston (only loaded on server)
if (typeof window === 'undefined') {
  // Dynamic import for server-side only
  const setupServerLogger = async () => {
    try {
      const { createLogger, format, transports } = await import('winston');
      const { combine, timestamp, json, colorize, printf } = format;

      const consoleLogFormat = combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        printf(({ timestamp: ts, level, message, ...meta }) => {
          const metaString = Object.keys(meta).length > 0 ? JSON.stringify(meta, null, 2) : '';
          return `[${ts}] ${level}: ${message}${metaString ? ' ' + metaString : ''}`;
        })
      );

      const winstonLogger = createLogger({
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        format: combine(timestamp(), json()),
        transports: [
          new transports.Console({
            format: process.env.NODE_ENV === 'development' ? consoleLogFormat : combine(timestamp(), json()),
            level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
          }),
        ],
        exitOnError: false,
      });

      // Override logger methods with Winston
      logger.error = (message: string, meta?: any) => winstonLogger.error(message, meta);
      logger.warn = (message: string, meta?: any) => winstonLogger.warn(message, meta);
      logger.info = (message: string, meta?: any) => winstonLogger.info(message, meta);
      logger.debug = (message: string, meta?: any) => winstonLogger.debug(message, meta);
    } catch (error) {
      console.error('Failed to setup Winston logger:', error);
    }
  };

  // Setup server logger
  setupServerLogger();
}

export default logger;