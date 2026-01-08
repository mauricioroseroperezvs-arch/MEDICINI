import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carga las variables de entorno para que process.env funcione
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    server: {
      // En desarrollo local
      port: 5173,
    },
    preview: {
      // En modo preview/producción, usa el puerto asignado por el sistema o el 3000
      port: Number(process.env.PORT) || 3000,
      host: true
    },
    define: {
      // Esto inyecta la API Key de manera segura en el cliente
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    }
  };
});