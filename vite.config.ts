import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./", // importante para rutas relativas en producción
  plugins: [react()],

  server: {
    host: true,
    allowedHosts: "all"
  },

  preview: {
    host: true,
    allowedHosts: "all"
  }
});
