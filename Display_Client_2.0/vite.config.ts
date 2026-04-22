import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const projectRoot = process.cwd();
  loadEnv(mode, projectRoot, 'VITE_');

  return {
    root: projectRoot,
    plugins: [react()],
    resolve: {
      preserveSymlinks: true
    },
    server: {
      host: true,
      port: 5173,
      strictPort: true
    },
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? '0.0.0')
    }
  };
});
