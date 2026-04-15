import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// React app lives in frontend/ — build from repo root with: npm run build
export default defineConfig({
  root: path.resolve(__dirname, 'frontend'),
  plugins: [react()],
})
