import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { SITE } from "./src/config/site";

// Fills the website name/description in index.html from src/config/site.ts
const siteMeta = {
  name: "site-meta",
  transformIndexHtml: (html: string) =>
    html.replace(/%SITE_NAME%/g, SITE.name).replace(/%SITE_DESCRIPTION%/g, SITE.description),
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), siteMeta, mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
