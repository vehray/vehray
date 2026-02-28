import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { builtinModules } from 'node:module';
import path from 'path';

export default defineConfig({
  base: './',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue']
  },
  build: {
    rollupOptions: {
      external: [...builtinModules]
    }
  }
});
