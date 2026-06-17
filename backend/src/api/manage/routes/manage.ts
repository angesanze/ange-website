/**
 * Routes used by the MCP server to publish/unpublish draft & publish entries
 * (the content REST API can't publish on its own). Callable with a full-access
 * API token.
 */
export default {
  routes: [
    { method: 'POST', path: '/manage/publish', handler: 'manage.publish', config: { policies: [] } },
    { method: 'POST', path: '/manage/unpublish', handler: 'manage.unpublish', config: { policies: [] } },
  ],
};
