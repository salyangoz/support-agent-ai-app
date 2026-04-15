import { describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/context/auth-context'
import KnowledgeBasePage from '@/pages/dashboard/knowledge/index'
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

describe('Knowledge Base', () => {
  it('renders the knowledge base page with search and add button', async () => {
    seedAuth()
    renderInRoute(`/t/:tenantId/knowledge`, <KnowledgeBasePage />, `/t/${TENANT_ID}/knowledge`)

    expect(screen.getByText('Knowledge Base')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/search articles/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add article/i })).toBeInTheDocument()
  })

  it('loads and displays articles', async () => {
    seedAuth()
    renderInRoute(`/t/:tenantId/knowledge`, <KnowledgeBasePage />, `/t/${TENANT_ID}/knowledge`)

    await waitFor(() => {
      expect(screen.getByText('How to Reset Your Password')).toBeInTheDocument()
      expect(screen.getByText('How to Update Payment Method')).toBeInTheDocument()
    })
  })

  it('shows article categories and status', async () => {
    seedAuth()
    renderInRoute(`/t/:tenantId/knowledge`, <KnowledgeBasePage />, `/t/${TENANT_ID}/knowledge`)

    await waitFor(() => {
      expect(screen.getByText('Account')).toBeInTheDocument()
      expect(screen.getByText('Billing')).toBeInTheDocument()
      expect(screen.getAllByText('Active').length).toBe(2)
    })
  })

  it('opens create modal when Add Article is clicked', async () => {
    seedAuth()
    const user = userEvent.setup()
    renderInRoute(`/t/:tenantId/knowledge`, <KnowledgeBasePage />, `/t/${TENANT_ID}/knowledge`)

    await user.click(screen.getByRole('button', { name: /add article/i }))

    await waitFor(() => {
      expect(screen.getByText('New Article')).toBeInTheDocument()
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/content/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument()
    })
  })

  it('opens edit modal with existing data when edit icon is clicked', async () => {
    seedAuth()
    const user = userEvent.setup()
    renderInRoute(`/t/:tenantId/knowledge`, <KnowledgeBasePage />, `/t/${TENANT_ID}/knowledge`)

    await waitFor(() => {
      expect(screen.getByText('How to Reset Your Password')).toBeInTheDocument()
    })

    // Click the first edit button (Pencil icon)
    const editButtons = screen.getAllByRole('button').filter((btn) => {
      const svg = btn.querySelector('svg')
      return svg && btn.closest('td')
    })
    // First edit button
    await user.click(editButtons[0])

    await waitFor(() => {
      expect(screen.getByText('Edit Article')).toBeInTheDocument()
      expect(screen.getByLabelText(/title/i)).toHaveValue('How to Reset Your Password')
    })
  })

  it('submits new article form', async () => {
    seedAuth()
    const user = userEvent.setup()
    renderInRoute(`/t/:tenantId/knowledge`, <KnowledgeBasePage />, `/t/${TENANT_ID}/knowledge`)

    await user.click(screen.getByRole('button', { name: /add article/i }))

    await waitFor(() => {
      expect(screen.getByText('New Article')).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText(/title/i), 'New Test Article')
    await user.type(screen.getByLabelText(/content/i), 'This is the article content for testing.')
    await user.type(screen.getByLabelText(/category/i), 'Testing')

    await user.click(screen.getByRole('button', { name: /create/i }))

    // Modal should close after successful creation
    await waitFor(() => {
      expect(screen.queryByText('New Article')).not.toBeInTheDocument()
    })
  })

  it('closes modal on cancel', async () => {
    seedAuth()
    const user = userEvent.setup()
    renderInRoute(`/t/:tenantId/knowledge`, <KnowledgeBasePage />, `/t/${TENANT_ID}/knowledge`)

    await user.click(screen.getByRole('button', { name: /add article/i }))

    await waitFor(() => {
      expect(screen.getByText('New Article')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /cancel/i }))

    await waitFor(() => {
      expect(screen.queryByText('New Article')).not.toBeInTheDocument()
    })
  })
})
