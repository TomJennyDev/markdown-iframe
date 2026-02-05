import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths(), {
      name: 'watch-public-markdown',

      configureServer(server) {
        const publicPath = path.resolve(__dirname, 'public')

        // Watch public folder
        server.watcher.add(publicPath)

        server.watcher.on('change', (file) => {
          if (file.endsWith('.md')) {
            console.log('Markdown file changed:', file)

            // Trigger HMR for markdown files
            server.ws.send({
              type: 'custom',
              event: 'markdown-update',
              data: {
                path: file,
                timestamp: Date.now()
              },
            })
          }
        })

        server.watcher.on('add', (file) => {
          if (file.endsWith('.md')) {
            console.log('Markdown file added:', file)

            server.ws.send({
              type: 'custom',
              event: 'markdown-added',
              data: {
                path: file,
                timestamp: Date.now()
              },
            })
          }
        })

        server.watcher.on('unlink', (file) => {
          if (file.endsWith('.md')) {
            console.log('Markdown file removed:', file)

            server.ws.send({
              type: 'custom',
              event: 'markdown-removed',
              data: {
                path: file,
                timestamp: Date.now()
              },
            })
          }
        })
      },

      handleHotUpdate({ file, server }) {
        if (file.endsWith('.md')) {
          console.log('HMR triggered for:', file)
          
          // Don't trigger full reload, let custom event handle it
          return []
        }
      }
    }],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.mjs',
  },
});
