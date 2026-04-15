import { describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/context/auth-context'
import CustomersPage from '@/pages/dashboard/customers/index'
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

describe('Customers', () => {
  it('renders the customers page with search', async () => {
    seedAuth()
    renderInRoute(`/t/:tenantId/customers`, <CustomersPage />, `/t/${TENANT_ID}/customers`)

    expect(screen.getByText('Customers')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/search by email/i)).toBeInTheDocument()
  })

  it('loads and displays customers from the API', async () => {
    seedAuth()
    renderInRoute(`/t/:tenantId/customers`, <CustomersPage />, `/t/${TENANT_ID}/customers`)

    await waitFor(() => {
      expect(screen.getByText('Jane Customer')).toBeInTheDocument()
      expect(screen.getByText('Bob Smith')).toBeInTheDocument()
      expect(screen.getByText('customer@example.com')).toBeInTheDocument()
      expect(screen.getByText('bob@example.com')).toBeInTheDocument()
    })
  })

  it('shows pagination info', async () => {
    seedAuth()
    renderInRoute(`/t/:tenantId/customers`, <CustomersPage />, `/t/${TENANT_ID}/customers`)

    await waitFor(() => {
      expect(screen.getByText(/showing 2 of 2 customers/i)).toBeInTheDocument()
    })
  })

  it('has a search input that can be typed into', async () => {
    seedAuth()
    const user = userEvent.setup()
    renderInRoute(`/t/:tenantId/customers`, <CustomersPage />, `/t/${TENANT_ID}/customers`)

    const search = screen.getByPlaceholderText(/search by email/i)
    await user.type(search, 'jane')
    expect(search).toHaveValue('jane')
  })
})
