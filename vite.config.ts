import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    host: true,    // Permite la conexión desde cualquier host
    allowedHosts: 'all'  // Asegura que Vite acepte peticiones de cualquier host
  },

  preview: {
    port: 3000,
    host: true    // Asegura que esté accesible en cualquier entorno
  }
});
