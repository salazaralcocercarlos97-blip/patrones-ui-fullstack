import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// El frontend corre en el puerto 5173 y reenvía todo lo que empieza con /api
// al backend Express del puerto 3001 (así el navegador habla con un solo origen).
const API = `http://127.0.0.1:${process.env.API_PUERTO || 3001}`;

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': API },
  },
  preview: {
    proxy: { '/api': API },
  },
});
