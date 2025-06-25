import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.STRIPE_PUBLISHABLE_KEY': JSON.stringify(env.STRIPE_PUBLISHABLE_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
          '@modelcontextprotocol/sdk/types.js': path.resolve(__dirname, 'node_modules/@modelcontextprotocol/sdk/dist/esm/types.js'),
          'services': path.resolve(__dirname, './src/services'),
          'components': path.resolve(__dirname, './components')
        }
      },
      optimizeDeps: {
        exclude: ['@google/generative-ai'],
      },
    };
});
