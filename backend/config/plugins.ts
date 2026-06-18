import type { Core } from '@strapi/strapi';

/**
 * Upload provider switches on NODE_ENV:
 *   - production  → Google Cloud Storage (media persists across Cloud Run revisions;
 *                   the runtime service account's ADC is used — no key file needed).
 *   - development → Strapi's default local provider (files under public/uploads).
 */
const config = ({ env }: Core.Config.Shared.ConfigParams) => {
  if (env('NODE_ENV') !== 'production') {
    return {};
  }

  return {
    upload: {
      config: {
        provider: '@strapi-community/strapi-provider-upload-google-cloud-storage',
        providerOptions: {
          bucketName: env('GCS_BUCKET_NAME'),
          publicFiles: true,
          uniform: true,
          basePath: '',
          // The runtime SA has roles/storage.objectAdmin (object-level) but NOT
          // storage.buckets.get, so the provider's bucket.exists() probe 403s and
          // every upload 500s. Objects are managed fine without it — skip the probe.
          skipCheckBucket: true,
        },
      },
    },
  };
};

export default config;
