import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Ścieżka względna ("./") sprawia, że zbudowana aplikacja działa poprawnie
// niezależnie od tego, pod jakim podkatalogiem zostanie wystawiona
// (np. GitHub Pages: username.github.io/nazwa-repo/).
export default defineConfig({
  plugins: [react()],
  base: "./",
});
