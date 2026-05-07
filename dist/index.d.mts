interface LogLiteConfig {
    apiKey: string;
    service?: string;
    ingestUrl?: string;
    env?: 'development' | 'production' | 'staging' | string;
}
interface LogMeta {
    [key: string]: any;
}
interface LogEntry {
    message: string;
    level: 'info' | 'warn' | 'error' | 'debug';
    service: string;
    env: string;
    timestamp: number;
    meta?: LogMeta;
}
declare class LogLiteLogger {
    private apiKey;
    private service;
    private ingestUrl;
    private env;
    private queue;
    private isFlushing;
    private apiClient;
    constructor(config: LogLiteConfig);
    private setupGlobalHandlers;
    private flush;
    private log;
    private sanitizeMeta;
    info(message: string, meta?: LogMeta): void;
    warn(message: string, meta?: LogMeta): void;
    error(message: string, meta?: LogMeta): void;
    debug(message: string, meta?: LogMeta): void;
    errorHandler(): (err: any, req: any, res: any, next: any) => void;
    middleware(): (err: any, req: any, res: any, next: any) => void;
}
declare const createLogger: (config: LogLiteConfig) => LogLiteLogger;

export { type LogEntry, type LogLiteConfig, type LogMeta, createLogger, LogLiteLogger as default };
