import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const port = Number(env.PORT || process.env.PORT || 3020);

  return {
    root: './src',
    server: {
      host: '0.0.0.0',
      port,
      strictPort: true,
    },
  };
});
