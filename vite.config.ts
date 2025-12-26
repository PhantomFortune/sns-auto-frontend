import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 8080,
    allowedHosts: [
      "floodlike-crysta-nondrying.ngrok-free.dev",
    ],
    // Disable host check in development for ngrok compatibility
    ...(mode === "development" && {
      strictPort: false,
      // Allow all hosts in development (useful for dynamic ngrok URLs)
      // This can be set via environment variable: VITE_ALLOWED_HOSTS
    }),
    hmr: {
      clientPort: 8080,
    },

    proxy: {
      "/api": {
        // Use backend URL from environment, defaulting to localhost
        target: process.env.VITE_BACKEND_URL || "http://localhost:8000",
        changeOrigin: true,
        secure: false,
        ws: true, // Enable websocket proxying
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Production build optimizations
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-select', '@radix-ui/react-tabs'],
        },
      },
    },
  },
  
}));
