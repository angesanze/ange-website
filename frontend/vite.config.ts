import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// Port is configurable so the same config works on the host and inside Docker
// (where we map host:5175 -> container:5175 to keep HMR's websocket port aligned).
const port = Number(process.env.VITE_PORT) || 5173

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    host: true, // bind 0.0.0.0 — required when running in a container
    port,
    strictPort: true,
  },
})
