import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';

const adminDevRoutes = {
  name: 'pbm-admin-dev-routes',
  configureServer(server) {
    server.middlewares.use((request, _response, next) => {
      const pathname = (request.url || '').split('?')[0];

      if (pathname === '/admin' || pathname.startsWith('/admin/')) {
        request.url = '/admin/index.html';
      }

      next();
    });
  },
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:5000';

  return {
    plugins: [adminDevRoutes, vue()],
    build: {
      outDir: '../api/dist/website',
      emptyOutDir: true,
    },
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/uploads': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('../admin/src', import.meta.url)),
      },
    },
  };
});
