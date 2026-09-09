import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    // `@/algo` resolve para `src/algo`.
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT || '8443'),
    strictPort: true,
    proxy: { '/api': 'http://127.0.0.1:8765' },
  },

  preview: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT || '8443'),
  },
})
