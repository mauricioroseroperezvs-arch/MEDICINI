import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carga las variables de entorno para que process.env funcione
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    // Asegura que Vite sirva desde la raíz actual
    root: '',
    server: {
      port: 5173,
    },
    preview: {
      port: Number(process.env.PORT) || 3000,
      host: true
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    }
  };
});