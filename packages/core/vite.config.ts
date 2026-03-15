import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'StellarWalletConnectCore',
      formats: ['es', 'umd'],
      fileName: (format) => `index.${format === 'es' ? 'esm' : format}.js`,
    },
    rollupOptions: {
      external: ['@stellar/freighter-api', '@stellar/stellar-sdk'],
      output: {
        globals: {
          '@stellar/freighter-api': 'freighterApi',
          '@stellar/stellar-sdk': 'stellarSdk',
        },
      },
    },
  },
});
