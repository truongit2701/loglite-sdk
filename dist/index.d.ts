export interface LogLiteConfig {
    apiKey: string;
    service?: string;
    ingestUrl?: string;
    env?: 'development' | 'production' | 'staging' | string;
}
export interface LogMeta {
    [key: string]: any;
}
export interface LogEntry {
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
    /**
     * Kiểm tra kết nối và API Key ngay lập tức
     */
    init(): Promise<boolean>;
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
export declare const createLogger: (config: LogLiteConfig) => LogLiteLogger;
export default LogLiteLogger;
