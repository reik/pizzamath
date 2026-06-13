import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const frontendPort = parseInt(env.VITE_PORT ?? '5175');
  const backendPort = parseInt(env.BACKEND_PORT ?? '3001');
  const backendOrigin = `http://localhost:${backendPort}`;

  return {
  base: "/pizzamath/",
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'base-redirect',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url === '/pizzamath') {
            req.url = '/pizzamath/'
          }
          next()
        })
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: frontendPort,
    strictPort: true,
    proxy: {
      "/api": backendOrigin,
      "/uploads": backendOrigin,
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: true,
    exclude: ["node_modules", "dist", "cypress", "server/**"],
  },
  };
});
