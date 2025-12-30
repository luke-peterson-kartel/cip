import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
export default defineConfig({
    plugins: [react()],
    base: process.env.GITHUB_PAGES ? '/cip-frontend/' : '/', // Will deploy to https://kartel-ai.github.io/cip-frontend/
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
