import fs from 'fs';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const faviconSvgPath = path.resolve(__dirname, 'public/favicon.svg');

function faviconIcoFallback() {
  const handler = (_req: any, res: any, next: () => void) => {
    if (_req.url === '/favicon.ico' || _req.url?.startsWith('/favicon.ico?')) {
      try {
        const svg = fs.readFileSync(faviconSvgPath);
        res.setHeader('Content-Type', 'image/svg+xml');
        res.end(svg);
      } catch {
        next();
      }
      return;
    }
    next();
  };
  return {
    name: 'favicon-ico-fallback',
    configureServer(server: { middlewares: { use: (fn: typeof handler) => void } }) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server: { middlewares: { use: (fn: typeof handler) => void } }) {
      server.middlewares.use(handler);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3003,
      host: '0.0.0.0',
    },
    plugins: [react(), faviconIcoFallback()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunks - split heavy dependencies
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-charts': ['recharts'],
            'vendor-ui': ['lucide-react'],
            'vendor-xlsx': ['xlsx'],
          },
        },
      },
      chunkSizeWarningLimit: 600, // KB
    },
  };
});
