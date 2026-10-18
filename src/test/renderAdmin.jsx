import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from '@/lib/LanguageContext';
import { ValidationProvider } from '@/contexts/ValidationContext';
import AdminGate from '@/components/admin/AdminGate';

// /admin exactly as the router mounts it: the gate, its frame and the
// staged-changes provider. Under vitest the read-only preview is on
// (src/lib/adminPreview.js), so this needs no session and reads sample data.
export function renderAdmin() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={client}>
      <LanguageProvider>
        <ValidationProvider>
          <MemoryRouter initialEntries={['/admin']}>
            <AdminGate />
          </MemoryRouter>
        </ValidationProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}
