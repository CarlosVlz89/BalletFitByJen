import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // AQUÍ ESTÁ LA MAGIA: El nombre exacto de tu repositorio entre barras
  base: '/BalletFitByJen/',
})