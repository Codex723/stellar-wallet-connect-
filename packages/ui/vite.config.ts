import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'StellarWalletConnectUI',
      formats: ['es', 'umd'],
      fileName: (format) => `index.${format === 'es' ? 'esm' : format}.js`,
    },
    rollupOptions: {
      external: ['react', 'react-dom', '@stellar-wallet-connect/react'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          '@stellar-wallet-connect/react': 'StellarWalletConnectReact',
        },
      },
    },
  },
});
