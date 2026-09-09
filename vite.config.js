import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" para que funcione servido desde GitHub Pages en una subcarpeta
// (ej: usuario.github.io/costos-gastronomia/), no solo en la raíz de un dominio.
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "dist",
  },
});
