import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import homeHandler from './api/home.js';

export default defineConfig({
  server: {
    watch: {
      ignored: ['**/node_modules/**', '**/.git/**', '**/.dev-shots/**'],
    },
  },
  plugins: [
    react(),
    {
      name: 'dev-api-home',
      configureServer(server) {
        server.middlewares.use('/api/home', async (request, response) => {
          let statusCode = 200;
          response.status = (code) => {
            statusCode = code;
            return response;
          };
          response.json = (payload) => {
            response.statusCode = statusCode;
            response.setHeader('Content-Type', 'application/json');
            response.end(JSON.stringify(payload));
          };
          try {
            await homeHandler(request, response);
          } catch (error) {
            if (!response.headersSent) response.statusCode = 500;
            response.end(JSON.stringify({ message: String(error) }));
          }
        });
      },
    },
  ],
});
