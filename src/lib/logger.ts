import { Logform, transports as WinstonTransports, format, createLogger } from 'winston';

const nodeEnv = process.env.NODE_ENV || 'development';

const { combine, timestamp, json, colorize, printf } = format;

// Define types for printf arguments for clarity
interface PrintfInfo extends Logform.TransformableInfo {
  timestamp?: string; // Timestamp might not always be pre-formatted depending on order
  level: string;
  message: string;
  [key: string]: any; // Acknowledging meta can have various properties
}

const consoleLogFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // This adds 'timestamp' to info
  printf((info) => {
    const { timestamp: ts, level, message, ...meta } = info as PrintfInfo;
    // Basic meta stringification, symbols might be ignored by JSON.stringify by default
    const metaString = Object.keys(meta).length > 0 ? JSON.stringify(meta, null, 2) : '';
    return `[${ts || new Date().toISOString()}] ${level}: ${message}${metaString ? ' ' + metaString : ''}`;
  })
);

const configuredTransports: WinstonTransports.ConsoleTransportInstance[] = [
  new WinstonTransports.Console({
    format: nodeEnv === 'development' ? consoleLogFormat : combine(timestamp(), json()),
    level: nodeEnv === 'production' ? 'info' : 'debug',
  }),
];

// TODO: Add Firestore transport for production as per logging-rules.mdc
// if (nodeEnv === 'production') {
//   transports.push(new WinstonFirestore({ /* Firestore config */ }));
// }

const logger = createLogger({
  level: nodeEnv === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp(), // Ensures timestamp is available if not using consoleLogFormat
    json()
  ),
  transports: configuredTransports,
  exitOnError: false, // Do not exit on handled exceptions
});

export default logger; 