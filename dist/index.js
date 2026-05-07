import axios from 'axios';
class LogLiteLogger {
    apiKey;
    service;
    ingestUrl;
    env;
    queue = [];
    isFlushing = false;
    apiClient;
    constructor(config) {
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
    async init() {
        try {
            const response = await this.apiClient.get('/auth/verify');
            console.log(`\x1b[32m[LogLite SDK] Connection verified. Project: ${response.data.project}\x1b[0m`);
            return true;
        }
        catch (error) {
            const msg = error.response?.data?.message || error.message;
            console.error(`\x1b[31m[LogLite SDK] INITIALIZATION FAILED: ${msg}\x1b[0m`);
            if (error.response?.status === 403 || error.response?.status === 401) {
                console.error(`\x1b[31m[LogLite SDK] Reason: Invalid API Key [${this.apiKey}]\x1b[0m`);
            }
            return false;
        }
    }
    setupGlobalHandlers() {
        if (typeof process !== 'undefined') {
            process.on('uncaughtException', (error) => {
                if (error?.message?.includes('LogLite SDK') || error?.stack?.includes('LogLiteLogger'))
                    return;
                this.error(`Uncaught Exception: ${error.message}`, { stack: error.stack, type: 'UNCAUGHT_EXCEPTION' });
                setTimeout(() => process.exit(1), 1000);
            });
            process.on('unhandledRejection', (reason) => {
                if (reason?.config?.url?.includes('/logs')) {
                    console.error(`\x1b[31m[LogLite SDK] Ingest failed: ${reason.response?.data?.message || reason.message}\x1b[0m`);
                    return;
                }
                this.error(`Unhandled Rejection: ${reason?.message || String(reason)}`, { type: 'UNHANDLED_REJECTION' });
            });
        }
    }
    async flush() {
        if (this.isFlushing || this.queue.length === 0)
            return;
        this.isFlushing = true;
        const batch = [...this.queue];
        this.queue = [];
        try {
            await this.apiClient.post('/logs', { logs: batch });
        }
        catch (error) {
            if (this.queue.length < 5000)
                this.queue = [...batch, ...this.queue];
        }
        finally {
            this.isFlushing = false;
        }
    }
    log(level, message, meta = {}) {
        const entry = {
            message: String(message),
            level,
            service: this.service,
            env: this.env,
            timestamp: Date.now(),
            meta: this.sanitizeMeta(meta)
        };
        this.queue.push(entry);
        if (this.queue.length >= 10 || level === 'error')
            this.flush();
        else
            setTimeout(() => this.flush(), 2000);
    }
    sanitizeMeta(meta) {
        try {
            return JSON.parse(JSON.stringify(meta));
        }
        catch (e) {
            return { _parseError: 'Circular reference' };
        }
    }
    info(message, meta) { this.log('info', message, meta); }
    warn(message, meta) { this.log('warn', message, meta); }
    error(message, meta) { this.log('error', message, meta); }
    debug(message, meta) { this.log('debug', message, meta); }
    errorHandler() {
        return (err, req, res, next) => {
            this.error(err.message || 'Express Error', { stack: err.stack, url: req.url, type: 'EXPRESS_ERROR' });
            next(err);
        };
    }
    middleware() { return this.errorHandler(); }
}
export const createLogger = (config) => {
    return new LogLiteLogger(config);
};
export default LogLiteLogger;
