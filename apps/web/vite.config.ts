import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Bind to all interfaces (not just localhost) so the dev server is
    // reachable from other devices on the LAN — e.g. scanning a share
    // link's QR code from a phone.
    host: true,
  },
});
