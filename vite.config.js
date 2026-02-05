import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    build: {
        outDir: 'dist', // Specify the output directory
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                valentine: resolve(__dirname, 'valentine.html'),
            },
        },
    },
    // Add any other Vite-specific configurations here
});