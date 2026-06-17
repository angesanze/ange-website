import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Server => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  app: {
    keys: env.array('APP_KEYS'),
  },
  // Behind Cloud Run's HTTPS proxy in production: trust X-Forwarded-* so Strapi
  // builds correct absolute URLs (admin, media) and cookies are marked secure.
  proxy: env.bool('IS_PROXIED', env('NODE_ENV') === 'production'),
  url: env('PUBLIC_URL', ''),
});

export default config;
