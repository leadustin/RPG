import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Dieser Block ist die Lösung für das "react-rnd"-Problem
  optimizeDeps: {
    include: [
      'react-rnd',
      'clsx' 
    ],
  },
  
  // Optional: Setzt den Port wieder auf 3000, wie du es gewohnt bist
  server: {
    port: 3000,
  },
});