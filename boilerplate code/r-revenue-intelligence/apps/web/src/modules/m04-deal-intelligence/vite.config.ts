import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  root: './deaboard_manager',
  server: {
    port: 5173,
  },
})
