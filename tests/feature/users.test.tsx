import { describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/context/auth-context'
import UsersPage from '@/pages/dashboard/users/index'
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

describe('Users', () => {
  it('renders the users page with invite button', async () => {
    seedAuth()
    renderInRoute(`/t/:tenantId/users`, <UsersPage />, `/t/${TENANT_ID}/users`)

    expect(screen.getByText('Team Members')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /invite user/i })).toBeInTheDocument()
  })

  it('loads and displays team members', async () => {
    seedAuth()
    renderInRoute(`/t/:tenantId/users`, <UsersPage />, `/t/${TENANT_ID}/users`)

    await waitFor(() => {
      expect(screen.getByText('Test Admin')).toBeInTheDocument()
      expect(screen.getByText('Agent User')).toBeInTheDocument()
      expect(screen.getByText('admin@test.com')).toBeInTheDocument()
      expect(screen.getByText('agent@test.com')).toBeInTheDocument()
    })
  })

  it('shows role badges', async () => {
    seedAuth()
    renderInRoute(`/t/:tenantId/users`, <UsersPage />, `/t/${TENANT_ID}/users`)

    await waitFor(() => {
      expect(screen.getByText('owner')).toBeInTheDocument()
      expect(screen.getByText('admin')).toBeInTheDocument()
    })
  })

  it('opens invite form when Invite User is clicked', async () => {
    seedAuth()
    const user = userEvent.setup()
    renderInRoute(`/t/:tenantId/users`, <UsersPage />, `/t/${TENANT_ID}/users`)

    await user.click(screen.getByRole('button', { name: /invite user/i }))

    expect(screen.getByText('Invite New Member')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/john doe/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/user@company.com/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/temp password/i)).toBeInTheDocument()
  })

  it('can fill and submit invite form', async () => {
    seedAuth()
    const user = userEvent.setup()
    renderInRoute(`/t/:tenantId/users`, <UsersPage />, `/t/${TENANT_ID}/users`)

    await user.click(screen.getByRole('button', { name: /invite user/i }))

    await user.type(screen.getByPlaceholderText(/john doe/i), 'New User')
    await user.type(screen.getByPlaceholderText(/user@company.com/i), 'new@test.com')
    await user.type(screen.getByPlaceholderText(/temp password/i), 'temppass123')

    await user.click(screen.getByRole('button', { name: /send invite/i }))

    // Form should close after successful invite
    await waitFor(() => {
      expect(screen.queryByText('Invite New Member')).not.toBeInTheDocument()
    })
  })

  it('can close invite form with cancel', async () => {
    seedAuth()
    const user = userEvent.setup()
    renderInRoute(`/t/:tenantId/users`, <UsersPage />, `/t/${TENANT_ID}/users`)

    await user.click(screen.getByRole('button', { name: /invite user/i }))
    expect(screen.getByText('Invite New Member')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByText('Invite New Member')).not.toBeInTheDocument()
  })
})
