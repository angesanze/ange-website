import type { Core } from '@strapi/strapi';

const isProd = process.env.NODE_ENV === 'production';

// In production, allow the deployed frontend origin(s) via CORS_ORIGINS
// (comma-separated). Defaults to "*" so the public read API works out of the box;
// tighten by setting CORS_ORIGINS to the frontend URL.
const corsOrigin = isProd
  ? (process.env.CORS_ORIGINS?.split(',').map((s) => s.trim()).filter(Boolean) ?? ['*'])
  : ['http://localhost:5175', 'http://localhost:5173', 'http://localhost:4173'];

const config: Core.Config.Middlewares = [
  'strapi::logger',
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:'],
          // Media is served from Google Cloud Storage in production.
          'img-src': ["'self'", 'data:', 'blob:', 'https://storage.googleapis.com'],
          'media-src': ["'self'", 'data:', 'blob:', 'https://storage.googleapis.com'],
        },
      },
    },
  },
  {
    name: 'strapi::cors',
    config: { origin: corsOrigin },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];

export default config;
