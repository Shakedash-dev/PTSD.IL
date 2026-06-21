import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { fileURLToPath } from 'url'
import path from 'path'
import { BASE_PATH } from './base-path.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  logLevel: 'error', // suppress warnings (mostly Radix/third-party); change to 'warn' to debug build noise
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  base: BASE_PATH + '/',
  plugins: [
    react(),
  ]
});
