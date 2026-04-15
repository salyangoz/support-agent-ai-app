import { describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'
import { renderWithProviders, seedAuth } from '../render'
import { buildUser, buildTenant, TENANT_ID } from '../mocks/data'
import CreateTenantPage from '@/pages/onboarding/create-tenant'

const SECOND_TENANT_ID = '99999999-9999-9999-9999-999999999999'

function seedAuthWithTenants(tenants: Array<{ id: string; name: string; slug: string; role: string }>) {
  seedAuth()
  server.use(
    http.get('/api/auth/me', () => {
      return HttpResponse.json({
        ...buildUser(),
        tenants,
      })
    }),
  )
}

describe('Onboarding – tenant list', () => {
  it('displays tenant names from the API response', async () => {
    seedAuthWithTenants([
      { id: TENANT_ID, name: 'Yengeç', slug: 'yengec', role: 'owner' },
      { id: SECOND_TENANT_ID, name: 'Acme Corp', slug: 'acme', role: 'admin' },
    ])
    renderWithProviders(<CreateTenantPage />)

    await waitFor(() => {
      expect(screen.getByText('Yengeç')).toBeInTheDocument()
    })
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
  })

  it('displays role badges for each tenant', async () => {
    seedAuthWithTenants([
      { id: TENANT_ID, name: 'Yengeç', slug: 'yengec', role: 'owner' },
      { id: SECOND_TENANT_ID, name: 'Acme Corp', slug: 'acme', role: 'admin' },
    ])
    renderWithProviders(<CreateTenantPage />)

    await waitFor(() => {
      expect(screen.getByText('owner')).toBeInTheDocument()
    })
    expect(screen.getByText('admin')).toBeInTheDocument()
  })

  it('renders tenant links pointing to /t/:tenantId', async () => {
    seedAuthWithTenants([
      { id: TENANT_ID, name: 'Yengeç', slug: 'yengec', role: 'owner' },
    ])
    renderWithProviders(<CreateTenantPage />)

    await waitFor(() => {
      expect(screen.getByText('Yengeç')).toBeInTheDocument()
    })

    const link = screen.getByRole('link', { name: /yengeç/i })
    expect(link).toHaveAttribute('href', `/t/${TENANT_ID}`)
  })

  it('shows empty state message when user has no tenants', async () => {
    seedAuthWithTenants([])
    renderWithProviders(<CreateTenantPage />)

    await waitFor(() => {
      expect(screen.getByText(/don't have any companies/i)).toBeInTheDocument()
    })
  })

  it('shows Create New Company button', async () => {
    seedAuthWithTenants([
      { id: TENANT_ID, name: 'Yengeç', slug: 'yengec', role: 'owner' },
    ])
    renderWithProviders(<CreateTenantPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create new company/i })).toBeInTheDocument()
    })
  })
})

describe('Onboarding – create tenant form', () => {
  it('shows the create form when clicking Create New Company', async () => {
    const user = userEvent.setup()
    seedAuthWithTenants([])
    renderWithProviders(<CreateTenantPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create new company/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /create new company/i }))

    expect(screen.getByLabelText(/company name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/url identifier/i)).toBeInTheDocument()
  })

  it('auto-generates slug from company name', async () => {
    const user = userEvent.setup()
    seedAuthWithTenants([])
    renderWithProviders(<CreateTenantPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create new company/i })).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: /create new company/i }))

    await user.type(screen.getByLabelText(/company name/i), 'My Company')

    expect(screen.getByLabelText(/url identifier/i)).toHaveValue('my-company')
  })

  it('slugifies Turkish characters', async () => {
    const user = userEvent.setup()
    seedAuthWithTenants([])
    renderWithProviders(<CreateTenantPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create new company/i })).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: /create new company/i }))

    await user.type(screen.getByLabelText(/company name/i), 'Şirketim Örnek')

    expect(screen.getByLabelText(/url identifier/i)).toHaveValue('sirketim-ornek')
  })

  it('submits and navigates on successful create', async () => {
    const user = userEvent.setup()
    seedAuthWithTenants([])

    server.use(
      http.post('/api/my/tenants', async ({ request }) => {
        const body = (await request.json()) as { name: string; slug: string }
        return HttpResponse.json(
          { id: SECOND_TENANT_ID, name: body.name, slug: body.slug },
          { status: 201 },
        )
      }),
    )

    renderWithProviders(<CreateTenantPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create new company/i })).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: /create new company/i }))

    await user.type(screen.getByLabelText(/company name/i), 'New Corp')
    await user.type(screen.getByLabelText(/url identifier/i), 'new-corp')
    await user.click(screen.getByRole('button', { name: /create company/i }))

    await waitFor(() => {
      expect(localStorage.getItem('activeTenantId')).toBe(SECOND_TENANT_ID)
    })
  })

  it('shows error message on failed create', async () => {
    const user = userEvent.setup()
    seedAuthWithTenants([])

    server.use(
      http.post('/api/my/tenants', () => {
        return HttpResponse.json({ error: 'Slug already taken' }, { status: 409 })
      }),
    )

    renderWithProviders(<CreateTenantPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create new company/i })).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: /create new company/i }))

    await user.type(screen.getByLabelText(/company name/i), 'Acme')
    await user.type(screen.getByLabelText(/url identifier/i), 'acme')
    await user.click(screen.getByRole('button', { name: /create company/i }))

    await waitFor(() => {
      expect(screen.getByText(/slug already taken/i)).toBeInTheDocument()
    })
  })

  it('shows back button when tenants exist', async () => {
    const user = userEvent.setup()
    seedAuthWithTenants([
      { id: TENANT_ID, name: 'Yengeç', slug: 'yengec', role: 'owner' },
    ])
    renderWithProviders(<CreateTenantPage />)

    await waitFor(() => {
      expect(screen.getByText('Yengeç')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /create new company/i }))
    expect(screen.getByLabelText(/company name/i)).toBeInTheDocument()

    await user.click(screen.getByText(/back to company list/i))
    expect(screen.getByText('Yengeç')).toBeInTheDocument()
  })
})
