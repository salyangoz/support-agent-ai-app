import { describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/context/auth-context'
import TicketsPage from '@/pages/dashboard/tickets/index'
import TicketDetailPage from '@/pages/dashboard/tickets/ticket-detail'
import { render } from '@testing-library/react'
import { TENANT_ID, TICKET_ID } from '../mocks/data'
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

describe('Tickets List', () => {
  it('renders the tickets page with filter and table', async () => {
    seedAuth()
    renderInRoute(`/t/:tenantId/tickets`, <TicketsPage />, `/t/${TENANT_ID}/tickets`)

    expect(screen.getByText('Tickets')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument() // state filter select

    await waitFor(() => {
      expect(screen.getByText('Cannot access my account')).toBeInTheDocument()
      expect(screen.getByText('Billing question')).toBeInTheDocument()
      expect(screen.getByText('Feature request')).toBeInTheDocument()
    })
  })

  it('displays ticket state badges', async () => {
    seedAuth()
    renderInRoute(`/t/:tenantId/tickets`, <TicketsPage />, `/t/${TENANT_ID}/tickets`)

    await waitFor(() => {
      expect(screen.getByText('open')).toBeInTheDocument()
      expect(screen.getByText('pending')).toBeInTheDocument()
      expect(screen.getByText('closed')).toBeInTheDocument()
    })
  })

  it('shows customer names', async () => {
    seedAuth()
    renderInRoute(`/t/:tenantId/tickets`, <TicketsPage />, `/t/${TENANT_ID}/tickets`)

    await waitFor(() => {
      expect(screen.getAllByText('Jane Customer').length).toBeGreaterThanOrEqual(1)
    })
  })

  it('shows pagination info', async () => {
    seedAuth()
    renderInRoute(`/t/:tenantId/tickets`, <TicketsPage />, `/t/${TENANT_ID}/tickets`)

    await waitFor(() => {
      expect(screen.getByText(/showing 3 of 3 tickets/i)).toBeInTheDocument()
    })
  })

  it('filters tickets by state', async () => {
    seedAuth()
    const user = userEvent.setup()
    renderInRoute(`/t/:tenantId/tickets`, <TicketsPage />, `/t/${TENANT_ID}/tickets`)

    await waitFor(() => {
      expect(screen.getByText('Cannot access my account')).toBeInTheDocument()
    })

    await user.selectOptions(screen.getByRole('combobox'), 'open')

    await waitFor(() => {
      expect(screen.getByText(/showing 1 of 1 tickets/i)).toBeInTheDocument()
    })
  })
})

describe('Ticket Detail', () => {
  it('renders ticket detail with messages', async () => {
    seedAuth()
    renderInRoute(
      `/t/:tenantId/tickets/:ticketId`,
      <TicketDetailPage />,
      `/t/${TENANT_ID}/tickets/${TICKET_ID}`,
    )

    await waitFor(() => {
      expect(screen.getByText('Cannot access my account')).toBeInTheDocument()
      expect(screen.getByText('I need help with my account.')).toBeInTheDocument()
      expect(screen.getByText('Let me help you with that.')).toBeInTheDocument()
    })
  })

  it('shows ticket details sidebar', async () => {
    seedAuth()
    renderInRoute(
      `/t/:tenantId/tickets/:ticketId`,
      <TicketDetailPage />,
      `/t/${TENANT_ID}/tickets/${TICKET_ID}`,
    )

    await waitFor(() => {
      expect(screen.getByText('Details')).toBeInTheDocument()
      expect(screen.getByText('Customer')).toBeInTheDocument()
      // "Jane Customer" appears in messages and sidebar
      expect(screen.getAllByText('Jane Customer').length).toBeGreaterThanOrEqual(2)
      expect(screen.getByText('customer@example.com')).toBeInTheDocument()
    })
  })

  it('shows generate draft button', async () => {
    seedAuth()
    renderInRoute(
      `/t/:tenantId/tickets/:ticketId`,
      <TicketDetailPage />,
      `/t/${TENANT_ID}/tickets/${TICKET_ID}`,
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /generate draft|awaiting customer/i })).toBeInTheDocument()
    })
  })

  it('renders existing drafts with approve/reject actions', async () => {
    seedAuth()
    renderInRoute(
      `/t/:tenantId/tickets/:ticketId`,
      <TicketDetailPage />,
      `/t/${TENANT_ID}/tickets/${TICKET_ID}`,
    )

    await waitFor(() => {
      expect(screen.getByText('AI Drafts')).toBeInTheDocument()
      expect(screen.getByText(/Hello Jane, I can help you reset your password/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /approve/i })).toBeInTheDocument()
    })
  })

  it('shows author role badges in messages', async () => {
    seedAuth()
    renderInRoute(
      `/t/:tenantId/tickets/:ticketId`,
      <TicketDetailPage />,
      `/t/${TENANT_ID}/tickets/${TICKET_ID}`,
    )

    await waitFor(() => {
      expect(screen.getByText('customer')).toBeInTheDocument()
      expect(screen.getByText('agent')).toBeInTheDocument()
    })
  })
})
