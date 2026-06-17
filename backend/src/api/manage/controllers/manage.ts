/**
 * Publish / unpublish a draft&publish document via the Document Service.
 * Only posts and thoughts use draft&publish; other types are always live.
 */
const PUBLISHABLE = new Set(['api::post.post', 'api::thought.thought']);

type Ctx = any;
declare const strapi: any;

function readArgs(ctx: Ctx): { uid?: string; documentId?: string } {
  const body = (ctx.request?.body ?? {}) as Record<string, unknown>;
  return { uid: body.uid as string | undefined, documentId: body.documentId as string | undefined };
}

export default {
  async publish(ctx: Ctx) {
    const { uid, documentId } = readArgs(ctx);
    if (!uid || !PUBLISHABLE.has(uid)) return ctx.badRequest(`uid must be one of: ${[...PUBLISHABLE].join(', ')}`);
    if (!documentId) return ctx.badRequest('documentId is required');
    try {
      const result = await strapi.documents(uid).publish({ documentId });
      ctx.body = { data: result };
    } catch (err: any) {
      strapi.log.error(`[manage.publish] ${err?.message ?? err}`);
      return ctx.badRequest('publish failed', { error: String(err?.message ?? err) });
    }
  },

  async unpublish(ctx: Ctx) {
    const { uid, documentId } = readArgs(ctx);
    if (!uid || !PUBLISHABLE.has(uid)) return ctx.badRequest(`uid must be one of: ${[...PUBLISHABLE].join(', ')}`);
    if (!documentId) return ctx.badRequest('documentId is required');
    try {
      const result = await strapi.documents(uid).unpublish({ documentId });
      ctx.body = { data: result };
    } catch (err: any) {
      strapi.log.error(`[manage.unpublish] ${err?.message ?? err}`);
      return ctx.badRequest('unpublish failed', { error: String(err?.message ?? err) });
    }
  },
};
