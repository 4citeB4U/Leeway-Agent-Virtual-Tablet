import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {execSync} from 'child_process';
import path from 'path';
import {defineConfig} from 'vite';

// Bind the installed-version manifest to the commit that actually produced this
// build. A hardcoded SHA goes stale after every push and produces false update
// flags in Update Center.
function installedCommit(): string {
  try {
    return execSync('git rev-parse HEAD', {cwd: __dirname, encoding: 'utf8'}).trim();
  } catch {
    return '';
  }
}

export default defineConfig(() => {
  return {
    // GitHub Pages serves the built tablet below the repository path. Keep the
    // default root path for the local Express workstation and local Vite use.
    base: process.env.VITE_BASE_PATH || '/',
    define: {
      __LEEWAY_INSTALLED_COMMIT__: JSON.stringify(installedCommit()),
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
