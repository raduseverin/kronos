import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    globals: true,
    setupFiles: ['./electron/test/vitest-setup.js'],
    include: ['electron/**/*.test.js', 'src/**/*.test.{js,jsx}'],
    environment: 'node',
    environmentMatchGlobs: [
      ['src/**/*.test.jsx', 'jsdom'],
    ],
    pool: 'forks',
  },
})
