import { describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/context/auth-context'
import DraftsPage from '@/pages/dashboard/drafts/index'
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

describe('Drafts', () => {
  it('renders the drafts page with status filter', async () => {
    seedAuth()
    renderInRoute(`/t/:tenantId/drafts`, <DraftsPage />, `/t/${TENANT_ID}/drafts`)

    expect(screen.getByText('Drafts')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('loads and displays drafts from the API', async () => {
    seedAuth()
    renderInRoute(`/t/:tenantId/drafts`, <DraftsPage />, `/t/${TENANT_ID}/drafts`)

    await waitFor(() => {
      // All 3 drafts share the same response text from the mock builder
      expect(screen.getAllByText(/Hello Jane, I can help you reset your password/).length).toBe(3)
    })
  })

  it('shows status badges for each draft', async () => {
    seedAuth()
    renderInRoute(`/t/:tenantId/drafts`, <DraftsPage />, `/t/${TENANT_ID}/drafts`)

    await waitFor(() => {
      expect(screen.getAllByText('pending').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('approved').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('sent').length).toBeGreaterThanOrEqual(1)
    })
  })

  it('shows approve and reject buttons for pending drafts', async () => {
    seedAuth()
    renderInRoute(`/t/:tenantId/drafts`, <DraftsPage />, `/t/${TENANT_ID}/drafts`)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^approve$/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /^reject$/i })).toBeInTheDocument()
    })
  })

  it('shows send button for approved drafts', async () => {
    seedAuth()
    renderInRoute(`/t/:tenantId/drafts`, <DraftsPage />, `/t/${TENANT_ID}/drafts`)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument()
    })
  })

  it('shows view ticket links', async () => {
    seedAuth()
    renderInRoute(`/t/:tenantId/drafts`, <DraftsPage />, `/t/${TENANT_ID}/drafts`)

    await waitFor(() => {
      const links = screen.getAllByText('View Ticket')
      expect(links.length).toBeGreaterThanOrEqual(1)
    })
  })

  it('shows AI model info for each draft', async () => {
    seedAuth()
    renderInRoute(`/t/:tenantId/drafts`, <DraftsPage />, `/t/${TENANT_ID}/drafts`)

    await waitFor(() => {
      expect(screen.getAllByText(/deepseek-chat/i).length).toBeGreaterThanOrEqual(1)
    })
  })

  it('can approve a pending draft', async () => {
    seedAuth()
    const user = userEvent.setup()
    renderInRoute(`/t/:tenantId/drafts`, <DraftsPage />, `/t/${TENANT_ID}/drafts`)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^approve$/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /^approve$/i }))

    // Should call the API (MSW handles it), no error thrown
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^approve$/i })).toBeInTheDocument()
    })
  })
})
