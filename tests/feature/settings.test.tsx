import { describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/context/auth-context'
import SettingsPage from '@/pages/dashboard/settings/index'
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

function renderSettings() {
  seedAuth()
  return renderInRoute(`/t/:tenantId/settings`, <SettingsPage />, `/t/${TENANT_ID}/settings`)
}

describe('Settings – Tabs', () => {
  it('renders 4 tabs: General, AI Model, Embedding, Advanced', async () => {
    renderSettings()

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /general/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /ai model/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /embedding/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /advanced/i })).toBeInTheDocument()
    })
  })

  it('shows General tab as active by default', async () => {
    renderSettings()

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /general/i })).toHaveAttribute('aria-selected', 'true')
    })
  })
})

describe('Settings – General tab', () => {
  it('loads tenant name from API', async () => {
    renderSettings()

    await waitFor(() => {
      expect(screen.getByLabelText(/tenant name/i)).toHaveValue('Test Company')
    })
  })

  it('shows API key as readonly', async () => {
    renderSettings()

    await waitFor(() => {
      const apiKeyInput = screen.getByDisplayValue('tk_test_apikey_123')
      expect(apiKeyInput).toHaveAttribute('readonly')
    })
  })

  it('shows webhook URL with tenant slug', async () => {
    renderSettings()

    await waitFor(() => {
      const webhookInput = screen.getByDisplayValue(/\/api\/webhooks\/test-company\//)
      expect(webhookInput).toBeInTheDocument()
    })
  })

  it('can save tenant name', async () => {
    const user = userEvent.setup()
    renderSettings()

    await waitFor(() => {
      expect(screen.getByLabelText(/tenant name/i)).toHaveValue('Test Company')
    })

    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(screen.getByText(/settings saved successfully/i)).toBeInTheDocument()
    })
  })
})

describe('Settings – AI Configuration tab', () => {
  it('shows AI fields after clicking the tab', async () => {
    const user = userEvent.setup()
    renderSettings()

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /ai model/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('tab', { name: /ai model/i }))

    await waitFor(() => {
      expect(document.getElementById('ai_model')).toHaveValue('deepseek-chat')
      expect(screen.getByLabelText(/rag top k/i)).toHaveValue(5)
    })
  })

  it('shows tone and language selectors', async () => {
    const user = userEvent.setup()
    renderSettings()

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /ai model/i })).toBeInTheDocument()
    })
    await user.click(screen.getByRole('tab', { name: /ai model/i }))

    await waitFor(() => {
      expect(screen.getByLabelText(/tone/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^language$/i)).toBeInTheDocument()
    })
  })

  it('shows auto-send drafts checkbox in General tab', async () => {
    renderSettings()

    await waitFor(() => {
      expect(screen.getByLabelText(/auto-send drafts/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/auto-send drafts/i)).not.toBeChecked()
      expect(screen.getByLabelText(/auto-generate knowledge base/i)).toBeInTheDocument()
    })
  })
})

describe('Settings – Advanced tab', () => {
  it('shows advanced fields after clicking the tab', async () => {
    const user = userEvent.setup()
    renderSettings()

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /advanced/i })).toBeInTheDocument()
    })
    await user.click(screen.getByRole('tab', { name: /advanced/i }))

    await waitFor(() => {
      expect(screen.getByLabelText(/max context tokens/i)).toHaveValue(4000)
      expect(screen.getByLabelText(/sync lookback/i)).toHaveValue(10)
    })
  })
})
