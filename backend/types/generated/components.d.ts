import type { Schema, Struct } from '@strapi/strapi';

export interface SharedCustomFont extends Struct.ComponentSchema {
  collectionName: 'components_shared_custom_fonts';
  info: {
    description: 'A web font to load site-wide. Add it here, then reference its family name in the heading / body / mono font fields.';
    displayName: 'Custom Font';
    icon: 'brush';
  };
  attributes: {
    family: Schema.Attribute.String & Schema.Attribute.Required;
    url: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedSocialLink extends Struct.ComponentSchema {
  collectionName: 'components_shared_social_links';
  info: {
    displayName: 'Social Link';
    icon: 'link';
  };
  attributes: {
    icon: Schema.Attribute.String;
    label: Schema.Attribute.String & Schema.Attribute.Required;
    url: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'shared.custom-font': SharedCustomFont;
      'shared.social-link': SharedSocialLink;
    }
  }
}
