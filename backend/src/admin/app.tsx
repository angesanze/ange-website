import type { StrapiApp } from '@strapi/strapi/admin';

export default {
  config: {
    locales: [],
  },
  register(app: StrapiApp) {
    // Visual icon picker (searchable lucide grid + emoji) for every icon field.
    // Must be in `register` (not `bootstrap`): only `register` receives the full
    // app instance with `customFields`.
    app.customFields.register({
      name: 'icon',
      type: 'string',
      intlLabel: { id: 'global.icon.label', defaultMessage: 'Icon' },
      intlDescription: {
        id: 'global.icon.description',
        defaultMessage: 'Pick an icon from the list, or paste an emoji.',
      },
      components: {
        Input: async () => import('./components/IconPicker'),
      },
    });
  },
};
