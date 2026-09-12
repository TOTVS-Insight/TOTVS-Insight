import { defineConfig, type ServerOptions } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

const API_ALVO = 'http://127.0.0.1:8765'

/*
 * O backend só responde a requisições com Host e Origin locais — é a proteção
 * dele contra DNS rebinding, e ele escuta apenas em 127.0.0.1.
 *
 * Quando alguém abre o site pelo IP da máquina (http://192.168.0.10:8443), o
 * navegador manda esse IP nos dois cabeçalhos. Sem reescrever, o backend
 * devolve 403 e a tela mostra "serviço de análise indisponível".
 *
 * `changeOrigin` acerta o Host; o Origin precisa ser trocado à mão. Quem chamar
 * a porta 8765 direto pelo navegador continua bloqueado, que é o ponto da checagem.
 */
const proxyApi: NonNullable<ServerOptions['proxy']> = {
  '/api': {
    target: API_ALVO,
    changeOrigin: true,
    configure: (proxy) => {
      proxy.on('proxyReq', (requisicao) => requisicao.setHeader('origin', API_ALVO))
    },
  },
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    // `@/algo` resolve para `src/algo`.
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },

  server: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT || '8443'),
    strictPort: true,
    proxy: proxyApi,
  },

  preview: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT || '8443'),
    proxy: proxyApi,
  },
})
