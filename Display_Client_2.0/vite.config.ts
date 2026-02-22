import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  loadEnv(mode, process.cwd(), 'VITE_');

  return {
    plugins: [react()],
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
