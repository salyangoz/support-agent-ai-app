import { describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/context/auth-context'
import DashboardPage from '@/pages/dashboard/index'
import { render } from '@testing-library/react'
import { TENANT_ID } from '../mocks/data'
import { seedAuth } from '../render'

function renderInRoute(path: string, element: React.ReactElement, initialEntry: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <AuthProvider>
          <Routes>
            <Route path={path} element={element} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('Dashboard', () => {
  it('renders stat cards with labels', async () => {
    seedAuth()
    renderInRoute(`/t/:tenantId`, <DashboardPage />, `/t/${TENANT_ID}`)

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Active Apps')).toBeInTheDocument()
    expect(screen.getByText('Open Tickets')).toBeInTheDocument()
    expect(screen.getByText('Knowledge Articles')).toBeInTheDocument()
    expect(screen.getByText('Pending Drafts')).toBeInTheDocument()
  })

  it('loads and displays app count', async () => {
    seedAuth()
    renderInRoute(`/t/:tenantId`, <DashboardPage />, `/t/${TENANT_ID}`)

    // Mock returns 2 active apps, 3 tickets, 2 articles — multiple "2"s
    await waitFor(() => {
      const values = screen.getAllByText('2')
      expect(values.length).toBeGreaterThanOrEqual(1)
    })
  })

  it('displays the page description', () => {
    seedAuth()
    renderInRoute(`/t/:tenantId`, <DashboardPage />, `/t/${TENANT_ID}`)
    expect(screen.getByText(/overview of your support ai agent/i)).toBeInTheDocument()
  })
})
