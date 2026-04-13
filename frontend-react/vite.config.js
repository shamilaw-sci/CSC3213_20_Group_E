import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // මේක අලුතෙන් ගත්තා

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // මේක මෙතනට දැම්මා
  ],
})