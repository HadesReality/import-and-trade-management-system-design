import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Served from the site root by default. The GitHub Pages workflow sets BASE_PATH to
  // "/<repository-name>/" because project sites live under a sub-path.
  base: process.env.BASE_PATH ?? '/',
})
