import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'

// Short git hash injected into locale file URLs for cache busting
let buildHash = 'dev';
try {
  buildHash = execSync('git rev-parse --short HEAD').toString().trim();
} catch {
  buildHash = Date.now().toString(36);
}

export default defineConfig({
  plugins: [react()],
  define: {
    // Available in code as import.meta.env.VITE_BUILD_HASH
    'import.meta.env.VITE_BUILD_HASH': JSON.stringify(buildHash),
  },
})
