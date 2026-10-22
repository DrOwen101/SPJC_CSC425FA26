import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Keep browser requests on the frontend's origin, including fallback ports.
      '/api': 'http://127.0.0.1:3000',
    },
  },
})

