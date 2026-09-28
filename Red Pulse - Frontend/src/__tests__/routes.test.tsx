import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '@/routes/AppRoutes';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function renderAtRoute(route: string) {
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={[route]}>
            <AppRoutes />
          </MemoryRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

describe('Routing & Protection', () => {
  it('renders homepage at root path', async () => {
    renderAtRoute('/');
    expect(screen.getAllByText(/Red Pulse/i).length).toBeGreaterThan(0);
  });

  it('redirects unauthorized users trying to access protected donor route to login', async () => {
    renderAtRoute('/donor/dashboard');
    expect(await screen.findByText(/Welcome back/i)).toBeInTheDocument();
  });

  it('renders 404 page for unknown paths', async () => {
    renderAtRoute('/random-unknown-path');
    expect(screen.getByText(/Page not found/i)).toBeInTheDocument();
  });
});
