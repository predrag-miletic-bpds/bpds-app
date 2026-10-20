import { defineConfig } from 'vite';
import base from './vite.config.js';

export default defineConfig({
  ...base,
  preview: { allowedHosts: ['wib5fgop3010.workspaces.bit.cloud'] },
});
