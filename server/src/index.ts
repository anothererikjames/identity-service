import express from 'express';
import pinoHttp from 'pino-http';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import { middleware as openApiValidator } from 'express-openapi-validator';
import { fileURLToPath } from 'url';
import { router as identitiesRouter } from './routes/identities.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = pino({ level: process.env.LOG_LEVEL ?? 'info', base: { service: 'identity-service' } });
const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(pinoHttp({ logger, customProps: (req) => ({
  correlation_id: req.headers['x-correlation-id'] ?? ''
}) }));

// Health endpoints — NOT validated against OpenAPI
app.get('/healthz', (_req, res) => res.json({ status: 'ok' }));
app.get('/readyz',  (_req, res) => res.json({ ready: true }));
app.get('/meta',    (_req, res) => res.json({
  service: 'identity-service',
  version: '1.0.0',
  build: process.env.BUILD_SHA ?? 'dev',
  dependencies: {

  }
}));

// OpenAPI validation (best effort; disabled if spec missing)
const specPath = path.resolve(__dirname, '../openapi.yaml');
if (fs.existsSync(specPath)) {
  try {
    app.use(openApiValidator({
      apiSpec: specPath,
      validateRequests: true,
      validateResponses: false, // lenient for demo
      ignorePaths: /(\/healthz|\/readyz|\/meta)/,
    }));
  } catch (e) { logger.warn({err:e}, 'openapi validator failed to init'); }
}

// Routes
app.use('/v1', identitiesRouter);

// Problem+JSON error handler
app.use((err: any, req: any, res: any, _next: any) => {
  const status = err.status ?? 500;
  res.status(status).type('application/problem+json').json({
    type: `https://errors.meridianfs.example/${err.name ?? 'error'}`,
    title: err.message ?? 'Internal error',
    status,
    detail: err.errors ? JSON.stringify(err.errors) : undefined,
    correlation_id: req.headers['x-correlation-id'] ?? undefined,
  });
});

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => logger.info({ port }, 'identity-service listening'));
