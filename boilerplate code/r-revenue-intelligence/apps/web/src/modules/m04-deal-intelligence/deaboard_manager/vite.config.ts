import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared/components/RoleBadge/RoleBadge': path.resolve(__dirname, './components/RoleBadge.tsx'),
    },
  },
})
