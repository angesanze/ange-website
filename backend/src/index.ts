import type { Core } from '@strapi/strapi';
import { seed } from './seed';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   */
  register({ strapi }: { strapi: Core.Strapi }) {
    // App-level custom field used by category/section/post icon attributes
    // (referenced in schemas as "global::icon"). The admin UI for it lives in
    // src/admin/app.tsx.
    strapi.customFields.register({
      name: 'icon',
      type: 'string',
    });
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * Reconciles public read permissions and seeds sample content
   * the first time the database is empty.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    try {
      await seed(strapi);
    } catch (err) {
      strapi.log.error('[seed] failed to run');
      strapi.log.error(err as any);
    }
  },
};
