import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'three-core',
              test: /node_modules[\\/]three[\\/]build[\\/]three\.core\.js$/,
              maxSize: 360 * 1024,
              priority: 40
            },
            {
              name: 'three',
              test: /node_modules[\\/]three[\\/]/,
              maxSize: 360 * 1024,
              priority: 30
            },
            {
              name: 'react-vendor',
              test: /node_modules[\\/](react|react-dom)[\\/]/,
              priority: 20
            },
            {
              name: 'icons',
              test: /node_modules[\\/]lucide-react[\\/]/,
              priority: 10
            }
          ]
        }
      }
    }
  },
  test: {
    environment: 'node',
    globals: true
  }
});
