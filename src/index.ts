import axios, { type AxiosInstance } from 'axios';

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

class LogLiteLogger {
  private apiKey: string;
  private service: string;
  private ingestUrl: string;
  private env: string;
  private queue: LogEntry[] = [];
  private isFlushing: boolean = false;
  private apiClient: AxiosInstance;

  constructor(config: LogLiteConfig) {
    this.apiKey = config.apiKey;
    this.service = config.service || 'default-service';
    this.ingestUrl = (config.ingestUrl || 'http://localhost:3001').replace(/\/$/, '');
    this.env = config.env || 'development';

    this.apiClient = axios.create({
      baseURL: this.ingestUrl,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': this.apiKey
      }
    });

    this.setupGlobalHandlers();
  }

  /**
   * Kiểm tra kết nối và API Key ngay lập tức
   */
  public async init() {
    try {
      const response = await this.apiClient.get('/auth/verify');
      console.log(`\x1b[32m[LogLite SDK] Connection verified. Project: ${response.data.project}\x1b[0m`);
      return true;
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message;
      console.error(`\x1b[31m[LogLite SDK] INITIALIZATION FAILED: ${msg}\x1b[0m`);
      if (error.response?.status === 403 || error.response?.status === 401) {
        console.error(`\x1b[31m[LogLite SDK] Reason: Invalid API Key [${this.apiKey}]\x1b[0m`);
      }
      return false;
    }
  }

  private setupGlobalHandlers() {
    if (typeof process !== 'undefined') {
      process.on('uncaughtException', (error: Error) => {
        if (error?.message?.includes('LogLite SDK') || error?.stack?.includes('LogLiteLogger')) return;
        this.error(`Uncaught Exception: ${error.message}`, { stack: error.stack, type: 'UNCAUGHT_EXCEPTION' });
        setTimeout(() => process.exit(1), 1000);
      });

      process.on('unhandledRejection', (reason: any) => {
        if (reason?.config?.url?.includes('/logs')) {
           console.error(`\x1b[31m[LogLite SDK] Ingest failed: ${reason.response?.data?.message || reason.message}\x1b[0m`);
           return;
        }
        this.error(`Unhandled Rejection: ${reason?.message || String(reason)}`, { type: 'UNHANDLED_REJECTION' });
      });
    }
  }

  private async flush() {
    if (this.isFlushing || this.queue.length === 0) return;
    this.isFlushing = true;
    const batch = [...this.queue];
    this.queue = [];
    try {
      await this.apiClient.post('/logs', { logs: batch });
    } catch (error) {
      if (this.queue.length < 5000) this.queue = [...batch, ...this.queue];
    } finally {
      this.isFlushing = false;
    }
  }

  private log(level: LogEntry['level'], message: string, meta: LogMeta = {}) {
    const entry: LogEntry = {
      message: String(message),
      level,
      service: this.service,
      env: this.env,
      timestamp: Date.now(),
      meta: this.sanitizeMeta(meta)
    };
    this.queue.push(entry);
    if (this.queue.length >= 10 || level === 'error') this.flush();
    else setTimeout(() => this.flush(), 2000);
  }

  private sanitizeMeta(meta: any): LogMeta {
    try { return JSON.parse(JSON.stringify(meta)); } catch (e) { return { _parseError: 'Circular reference' }; }
  }

  public info(message: string, meta?: LogMeta) { this.log('info', message, meta); }
  public warn(message: string, meta?: LogMeta) { this.log('warn', message, meta); }
  public error(message: string, meta?: LogMeta) { this.log('error', message, meta); }
  public debug(message: string, meta?: LogMeta) { this.log('debug', message, meta); }

  public errorHandler() {
    return (err: any, req: any, res: any, next: any) => {
      this.error(err.message || 'Express Error', { stack: err.stack, url: req.url, type: 'EXPRESS_ERROR' });
      next(err);
    };
  }

  public middleware() { return this.errorHandler(); }
}

export const createLogger = (config: LogLiteConfig) => {
  return new LogLiteLogger(config);
};

export default LogLiteLogger;
