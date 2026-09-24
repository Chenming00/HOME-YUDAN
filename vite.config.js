import { defineConfig, loadEnv } from 'vite';
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
        // Vite 只把 VITE_ 前缀变量写进 import.meta.env；服务端 handler 需要显式从 .env 合并 YUDAN_* 变量
        const env = loadEnv(server.config.mode, server.config.envDir || process.cwd(), '');
        for (const [key, value] of Object.entries(env)) {
          if (key.startsWith('YUDAN_') && process.env[key] === undefined) process.env[key] = value;
        }
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
