# 🚀 LogLite SDK

The ultimate lightweight logging SDK for Node.js and Express applications. Automatically capture errors, track performance, and monitor your services in real-time with zero configuration overhead.

## 📦 Installation

```bash
npm install loglite-sdk
# or
yarn add loglite-sdk
```

## 🛠️ Quick Start

Initialize the logger with your project's API Key.

```javascript
import LogLite from 'loglite-sdk';

const logger = new LogLite({
  apiKey: 'your-project-api-key',
  service: 'auth-service',
  env: 'production' // Optional: development (default) | production | staging
});

// Start logging
logger.info('Application started successfully');
logger.warn('Database connection latency detected', { latency: '200ms' });
logger.error('Failed to process payment', { userId: '123', amount: 500 });
```

## 🚄 Express.js Integration (Auto-Capture)

LogLite can automatically capture all runtime errors in your Express application. Simply add the middleware at the **end** of your route definitions.

```javascript
import express from 'express';
import LogLite from 'loglite-sdk';

const app = express();
const logger = new LogLite({ apiKey: 'YOUR_API_KEY', service: 'web-api' });

app.get('/crash', (req, res) => {
  throw new Error('Something went wrong!'); // This will be auto-captured
});

// --- MUST BE ADDED AFTER ALL ROUTES ---
app.use(logger.errorHandler());

app.listen(3000);
```

## 🛡️ Features

### 1. Global Error Handlers
The SDK automatically hooks into `process.on('uncaughtException')` and `process.on('unhandledRejection')`. Even if your code crashes outside of an Express route, LogLite will record the stack trace before the process exits.

### 2. Automatic Metadata
Every log captured via the `errorHandler()` middleware automatically includes:
- **URL & Method**
- **Request Headers**
- **Query Parameters**
- **Client IP**
- **Full Stack Trace** (for errors)

### 3. Infinite Loop Prevention
The SDK includes built-in safeguards to ensure that if the logging server itself is down, the SDK won't enter an infinite retry loop that crashes your application.

## 📖 API Reference

### `new LogLite(config)`
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `apiKey` | String | Yes | Your project API Key from the LogLite Dashboard. |
| `service` | String | No | The name of your service (default: `default-service`). |
| `env` | String | No | Environment tag (default: `development`). |
| `ingestUrl` | String | No | Custom ingest URL for self-hosted instances. |

### `logger.info(message, meta)`
### `logger.warn(message, meta)`
### `logger.error(message, meta)`
### `logger.debug(message, meta)`

- `message`: (String) The log message.
- `meta`: (Object) Optional custom metadata to include with the log.

---

Built with ❤️ by the LogLite Team.
