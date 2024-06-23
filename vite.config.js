import { defineConfig } from 'vite';

export default defineConfig({
    base: '/site/', // Set the base path to '/site/'
    build: {
        outDir: 'dist', // Specify the output directory
    },
    // Add any other Vite-specific configurations here
});