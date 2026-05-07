// src/index.ts
import axios from "axios";
var LogLiteLogger = class {
  apiKey;
  service;
  ingestUrl;
  env;
  queue = [];
  isFlushing = false;
  apiClient;
  constructor(config) {
    this.apiKey = config.apiKey;
    this.service = config.service || "default-service";
    this.ingestUrl = config.ingestUrl || "http://localhost:3001";
    this.env = config.env || "development";
    this.apiClient = axios.create({
      baseURL: this.ingestUrl,
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": this.apiKey
      }
    });
    this.setupGlobalHandlers();
  }
  setupGlobalHandlers() {
    if (typeof process !== "undefined") {
      process.on("uncaughtException", (error) => {
        if (error?.message?.includes("LogLite SDK") || error?.stack?.includes("LogLiteLogger")) {
          console.error("[LogLite SDK] Internal error:", error.message);
          return;
        }
        this.error(`Uncaught Exception: ${error.message}`, {
          stack: error.stack,
          type: "UNCAUGHT_EXCEPTION"
        });
        setTimeout(() => process.exit(1), 1e3);
      });
      process.on("unhandledRejection", (reason) => {
        const isSDKError = reason?.config?.url?.includes("/logs") || reason?.message?.includes("LogLite SDK");
        if (isSDKError) {
          console.error(`[LogLite SDK] Ingest failed: ${reason.response?.data?.error || reason.message}`);
          return;
        }
        this.error(`Unhandled Rejection: ${reason?.message || String(reason)}`, {
          reason: JSON.stringify(reason),
          type: "UNHANDLED_REJECTION"
        });
      });
    }
  }
  async flush() {
    if (this.isFlushing || this.queue.length === 0) return;
    this.isFlushing = true;
    const batch = [...this.queue];
    this.queue = [];
    try {
      await this.apiClient.post("/logs", { logs: batch });
    } catch (error) {
      if (this.queue.length < 5e3) {
        this.queue = [...batch, ...this.queue];
      }
    } finally {
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
    if (this.queue.length >= 10 || level === "error") {
      this.flush();
    } else {
      setTimeout(() => this.flush(), 2e3);
    }
    if (this.env === "development") {
      const color = level === "error" ? "\x1B[31m" : level === "warn" ? "\x1B[33m" : "\x1B[32m";
      console.log(`${color}[LogLite] ${level.toUpperCase()}:\x1B[0m ${message}`);
    }
  }
  sanitizeMeta(meta) {
    try {
      const str = JSON.stringify(meta);
      return JSON.parse(str);
    } catch (e) {
      return { _parseError: "Meta data contained circular references or was non-serializable" };
    }
  }
  info(message, meta) {
    this.log("info", message, meta);
  }
  warn(message, meta) {
    this.log("warn", message, meta);
  }
  error(message, meta) {
    this.log("error", message, meta);
  }
  debug(message, meta) {
    this.log("debug", message, meta);
  }
  errorHandler() {
    return (err, req, res, next) => {
      this.error(err.message || "Express Error", {
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        headers: req.headers,
        query: req.query,
        body: req.body,
        type: "EXPRESS_ERROR"
      });
      next(err);
    };
  }
  middleware() {
    return this.errorHandler();
  }
};
var createLogger = (config) => {
  return new LogLiteLogger(config);
};
var index_default = LogLiteLogger;
export {
  createLogger,
  index_default as default
};
