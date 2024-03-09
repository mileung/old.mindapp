import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
// TODO: why is there a red line under './manifest.json'
// @ts-ignore
import manifest from './manifest.json';

export default defineConfig({
	plugins: [react(), crx({ manifest })],
	// server: { port: 3000 }, // TODO: find a way to change ports
});
