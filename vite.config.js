import { defineConfig } from 'vite'
import devServer from '@hono/vite-dev-server'

export default defineConfig({
  plugins: [
    devServer({
      entry: './src/entry.js'
    })
  ],
  server: {
    port: 3000
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true
    }
  },
  optimizeDeps: {
    include: ['bcryptjs']
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
}) 