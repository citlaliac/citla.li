const { createProxyMiddleware } = require('http-proxy-middleware');

/** Dev proxy for Church Calendar API (no browser CORS on upstream). */
module.exports = function setupProxy(app) {
  app.use(
    '/api/liturgical',
    createProxyMiddleware({
      target: 'https://calapi.inadiutorium.cz',
      changeOrigin: true,
      pathRewrite: {
        '^/api/liturgical': '/api/v0/en/calendars/general-en',
      },
    })
  );
};
