# 🚀 LogLite SDK

The professional, high-performance logging SDK for the LogLite platform. Secure, centralized, and easy to integrate.

## 📦 Installation

```bash
npm install @truogvanzzzzz/loglite-sdk
# or
yarn add @truogvanzzzzz/loglite-sdk
```

## 🛠️ Quick Start

Initialize the logger with your project's **API Key** and **Ingest URL** (obtained from the LogLite Dashboard).

```typescript
import { createLogger } from '@truogvanzzzzz/loglite-sdk';

const logger = createLogger({
  apiKey: 'your-project-api-key',
  ingestUrl: 'https://logs.your-domain.com', // Mandatory: Your LogLite server URL
  service: 'inventory-service',
  env: 'production'
});

// Best Practice: Verify connection on startup
await logger.init();

// Simple logging
logger.info('User logged in', { userId: 'user_123' });
logger.error('Payment failed', { amount: 50, currency: 'USD' });
```

## 🌐 Express.js Integration

Automatically capture all unhandled errors and request-related logs.

```javascript
import express from 'express';
import { createLogger } from '@truogvanzzzzz/loglite-sdk';

const app = express();
const logger = createLogger({ 
  apiKey: 'YOUR_API_KEY', 
  ingestUrl: 'http://localhost:3001',
  service: 'web-api' 
});

// 1. Handshake with server
await logger.init();

app.use(express.json());

// 2. Use middleware to capture request errors
app.use(logger.middleware());

app.get('/', (req, res) => {
  logger.info('Visited home');
  res.send('Hello World');
});

// 3. Error handler middleware (Place at the END)
app.use(logger.errorHandler());

app.listen(3000);
```

## ⚙️ Configuration

| Property | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `apiKey` | `string` | **Yes** | Your project's unique API key. |
| `ingestUrl` | `string` | **Yes** | The URL of your LogLite ingestion server. |
| `service` | `string` | No | Name of the service (default: `default-service`). |
| `env` | `string` | No | Environment (e.g., `production`, `development`). |

## 🛡️ Features

- **Centralized Storage**: Logs are securely stored in a high-performance central database.
- **Auto-Capture**: Automatically captures `Uncaught Exceptions` and `Unhandled Rejections`.
- **Async & Non-blocking**: Uses internal queuing and batching to ensure zero impact on application performance.
- **Type-Safe**: Built with TypeScript for a superior developer experience.

---
© 2026 LogLite Platform. All rights reserved.
