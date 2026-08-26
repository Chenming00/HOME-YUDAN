import React from 'react';
import { renderToString } from 'react-dom/server';
import { createServer } from 'vite';

const server = await createServer({
  appType: 'custom',
  logLevel: 'error',
  server: { middlewareMode: true, hmr: false, watch: null },
});

try {
  const { App, AppErrorBoundary } = await server.ssrLoadModule('/src/main.jsx');
  const html = renderToString(
    React.createElement(AppErrorBoundary, null, React.createElement(App)),
  );
  if (!html.includes('shell')) throw new Error('App smoke render returned incomplete markup');
  process.stdout.write('React smoke render passed\n');
} finally {
  await server.close();
}