import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import homeHandler from './api/home.js';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    watch: {
      ignored: ['**/node_modules/**', '**/.git/**', '**/.dev-shots/**'],
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'dev-api-home',
      configureServer(server) {
        server.middlewares.use('/api/home', async (request, response) => {
          try {
            await homeHandler(request, response);
          } catch (error) {
            console.error('[dev-api-home]', error);
            if (!response.headersSent) {
              response.statusCode = 500;
              response.setHeader('Content-Type', 'application/json');
              response.end(JSON.stringify({ message: '服务器内部错误' }));
            }
          }
        });
      },
    },
  ],
});
