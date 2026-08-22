import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
  },
  resolve: {
    alias: {
      '@predrag-miletic/bpds-storage.supabase': new URL('../../bpds-storage/supabase/index.ts', import.meta.url).pathname,
      '@predrag-miletic/bpds-storage.entities.shared-types': new URL('../../bpds-storage/entities/shared-types/index.ts', import.meta.url).pathname,
      '@predrag-miletic/bpds-storage.repository': new URL('../../bpds-storage/repository/index.ts', import.meta.url).pathname,
      '@predrag-miletic/bpds-storage.storage': new URL('../../bpds-storage/storage/index.ts', import.meta.url).pathname,
      '@predrag-miletic/bpds-people.entities.people': new URL('../../bpds-people/entities/people/index.ts', import.meta.url).pathname,
      '@predrag-miletic/bpds-people.people-service': new URL('../../bpds-people/people-service/index.ts', import.meta.url).pathname,
      '@predrag-miletic/bpds-practices.entities.practice': new URL('../../bpds-practices/entities/practice/index.ts', import.meta.url).pathname,
      '@predrag-miletic/bpds-practices.practice-service': new URL('../../bpds-practices/practice-service/index.ts', import.meta.url).pathname,
      '@predrag-miletic/bpds-methodology.entities.methodology': new URL('../../bpds-methodology/entities/methodology/index.ts', import.meta.url).pathname,
      '@predrag-miletic/bpds-methodology.drill-catalog': new URL('../../bpds-methodology/drill-catalog/index.ts', import.meta.url).pathname,
      '@predrag-miletic/bpds-methodology.modules-catalog': new URL('../../bpds-methodology/modules-catalog/index.ts', import.meta.url).pathname,
      '@predrag-miletic/bpds-methodology.practice-generator': new URL('../../bpds-methodology/practice-generator/index.ts', import.meta.url).pathname,
    },
  },
});    
