/**
 * @file vite.config.js
 * @description Frontend build configuration and deployment metadata.
 */
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'

// Short git hash injected into locale file URLs for cache busting
let buildHash = 'dev';
try {
  buildHash = execSync('git rev-parse --short HEAD').toString().trim();
} catch {
  buildHash = Date.now().toString(36);
}

/** Escape public deployment text before inserting it into HTML. */
const htmlText = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), 'VITE_'), ...process.env };
  const name = String(env.VITE_BRAND_NAME || '').trim() || 'Wewigo';
  return {
  plugins: [react(), {
    name: 'deployment-brand-metadata',
    transformIndexHtml(html) {
      return html.replace('<title>Wewigo</title>', `<title>${htmlText(name)} — Academic management</title>`)
        .replace('</head>', `<meta name="description" content="Academic operations, finances and campus teams in one connected workspace."><meta property="og:title" content="${htmlText(name)} — Academic management"><meta property="og:description" content="Academic operations, finances and campus teams in one connected workspace."><meta property="og:type" content="website"></head>`);
    },
  }],
  define: {
    // Available in code as import.meta.env.VITE_BUILD_HASH
    'import.meta.env.VITE_BUILD_HASH': JSON.stringify(buildHash),
  },
};
})
