import { http, HttpResponse } from 'msw'
import {
  TENANT_ID,
  USER_ID,
  APP_ID,
  TICKET_ID,
  DRAFT_ID,
  ARTICLE_ID,
  buildUser,
  buildTenantUser,
  buildTenant,
  buildApp,
  buildTicket,
  buildDraft,
  buildKnowledgeArticle,
  buildCustomer,
} from './data'

export const handlers = [
  // ── Auth ────────────────────────────────────────────────────────
  http.post('/api/auth/login', async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string }
    if (body.email === 'admin@test.com' && body.password === 'password123') {
      return HttpResponse.json({
        access_token: 'test_access_token',
        refresh_token: 'test_refresh_token',
      })
    }
    return HttpResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }),

  http.post('/api/auth/register', async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string; name: string }
    if (body.email === 'existing@test.com') {
      return HttpResponse.json({ error: 'Email is already registered' }, { status: 409 })
    }
    if (!body.email || !body.password || !body.name) {
      return HttpResponse.json({ error: 'email, password and name are required' }, { status: 400 })
    }
    if (body.password.length < 8) {
      return HttpResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }
    return HttpResponse.json(
      {
        access_token: 'test_access_token',
        refresh_token: 'test_refresh_token',
        user: buildUser({ email: body.email, name: body.name }),
      },
      { status: 201 },
    )
  }),

  http.post('/api/auth/refresh', () => {
    return HttpResponse.json({
      access_token: 'refreshed_access_token',
      refresh_token: 'refreshed_refresh_token',
    })
  }),

  http.get('/api/auth/me', ({ request }) => {
    const auth = request.headers.get('Authorization')
    if (!auth?.startsWith('Bearer ')) {
      return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const tenant = buildTenant()
    return HttpResponse.json({
      ...buildUser(),
      tenants: [
        { id: tenant.id, name: tenant.name, slug: tenant.slug, role: 'owner' },
      ],
    })
  }),

  http.post('/api/my/tenants', async ({ request }) => {
    const body = (await request.json()) as { name: string; slug: string }
    const tenant = buildTenant({ name: body.name, slug: body.slug, id: '99999999-9999-9999-9999-999999999999' })
    return HttpResponse.json(tenant, { status: 201 })
  }),

  http.post('/api/auth/change-password', () => {
    return HttpResponse.json({ message: 'Password changed' })
  }),

  // ── Tenants ─────────────────────────────────────────────────────
  http.get(`/api/tenants/${TENANT_ID}`, () => {
    return HttpResponse.json(buildTenant())
  }),

  http.get(`/api/my/tenants/${TENANT_ID}`, () => {
    return HttpResponse.json(buildTenant())
  }),

  http.put(`/api/tenants/${TENANT_ID}`, () => {
    return HttpResponse.json(buildTenant())
  }),

  http.patch(`/api/tenants/${TENANT_ID}`, () => {
    return HttpResponse.json(buildTenant())
  }),

  http.put(`/api/my/tenants/${TENANT_ID}`, () => {
    return HttpResponse.json(buildTenant())
  }),

  // ── Apps ─────────────────────────────────────────────────────────
  http.get(`/api/tenants/${TENANT_ID}/apps`, () => {
    return HttpResponse.json({
      data: [
        buildApp(),
        buildApp({
          id: '33333333-3333-3333-3333-333333333334',
          code: 'slack',
          type: 'notification',
          role: 'destination',
          name: 'Slack Notifications',
          is_active: true,
          last_synced_at: null,
        }),
      ],
    })
  }),

  http.get(`/api/tenants/${TENANT_ID}/apps/:appId`, ({ params }) => {
    return HttpResponse.json(buildApp({ id: params.appId as string }))
  }),

  http.post(`/api/tenants/${TENANT_ID}/apps`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json(
      buildApp({ ...body, id: '33333333-3333-3333-3333-333333333399' } as Partial<ReturnType<typeof buildApp>>),
      { status: 201 },
    )
  }),

  http.put(`/api/tenants/${TENANT_ID}/apps/:appId`, ({ params }) => {
    return HttpResponse.json(buildApp({ id: params.appId as string }))
  }),

  http.delete(`/api/tenants/${TENANT_ID}/apps/:appId`, () => {
    return HttpResponse.json({ message: 'Deleted' })
  }),

  http.post(`/api/tenants/${TENANT_ID}/apps/:appId/test`, () => {
    return HttpResponse.json({ success: true, message: 'Connection successful' })
  }),

  // ── Tickets ─────────────────────────────────────────────────────
  http.get(`/api/tenants/${TENANT_ID}/tickets`, ({ request }) => {
    const url = new URL(request.url)
    const state = url.searchParams.get('state')
    const tickets = [
      buildTicket(),
      buildTicket({
        id: '44444444-4444-4444-4444-444444444445',
        external_id: 'ext_ticket_002',
        subject: 'Billing question',
        state: 'pending',
      }),
      buildTicket({
        id: '44444444-4444-4444-4444-444444444446',
        external_id: 'ext_ticket_003',
        subject: 'Feature request',
        state: 'closed',
      }),
    ]
    const filtered = state ? tickets.filter((t) => t.state === state) : tickets
    return HttpResponse.json({
      data: filtered,
      pagination: { next_cursor: null, has_more: false, total: filtered.length },
    })
  }),

  http.get(`/api/tenants/${TENANT_ID}/tickets/:ticketId`, ({ params }) => {
    return HttpResponse.json(buildTicket({ id: params.ticketId as string }))
  }),

  http.post(`/api/tenants/${TENANT_ID}/tickets/sync`, () => {
    return HttpResponse.json({ message: 'Sync triggered' })
  }),

  // ── Drafts ──────────────────────────────────────────────────────
  http.get(`/api/tenants/${TENANT_ID}/tickets/:ticketId/drafts`, () => {
    return HttpResponse.json([buildDraft()])
  }),

  http.post(`/api/tenants/${TENANT_ID}/tickets/:ticketId/draft`, () => {
    return HttpResponse.json(buildDraft(), { status: 201 })
  }),

  http.get(`/api/tenants/${TENANT_ID}/drafts`, ({ request }) => {
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const drafts = [
      buildDraft(),
      buildDraft({ id: '66666666-6666-6666-6666-666666666667', status: 'approved' }),
      buildDraft({ id: '66666666-6666-6666-6666-666666666668', status: 'sent' }),
    ]
    const filtered = status ? drafts.filter((d) => d.status === status) : drafts
    return HttpResponse.json({ data: filtered, pagination: { next_cursor: null, has_more: false, total: filtered.length } })
  }),

  http.patch(`/api/tenants/${TENANT_ID}/drafts/:draftId`, async ({ params, request }) => {
    const body = (await request.json()) as { status: string }
    return HttpResponse.json(buildDraft({ id: params.draftId as string, status: body.status as Draft['status'] }))
  }),

  http.post(`/api/tenants/${TENANT_ID}/drafts/:draftId/send`, ({ params }) => {
    return HttpResponse.json(buildDraft({ id: params.draftId as string, status: 'sent' }))
  }),

  // ── Customers ───────────────────────────────────────────────────
  http.get(`/api/tenants/${TENANT_ID}/customers`, () => {
    return HttpResponse.json({
      data: [
        buildCustomer(),
        buildCustomer({
          id: '55555555-5555-5555-5555-555555555556',
          email: 'bob@example.com',
          name: 'Bob Smith',
        }),
      ],
      pagination: { next_cursor: null, has_more: false, total: 2 },
    })
  }),

  // ── Knowledge Articles ──────────────────────────────────────────
  http.get(`/api/tenants/${TENANT_ID}/knowledge-articles`, () => {
    return HttpResponse.json({
      data: [
        buildKnowledgeArticle(),
        buildKnowledgeArticle({
          id: '77777777-7777-7777-7777-777777777778',
          title: 'How to Update Payment Method',
          category: 'Billing',
        }),
      ],
      pagination: { next_cursor: null, has_more: false, total: 2 },
    })
  }),

  http.post(`/api/tenants/${TENANT_ID}/knowledge-articles`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json(
      buildKnowledgeArticle({ title: body.title as string }),
      { status: 201 },
    )
  }),

  http.put(`/api/tenants/${TENANT_ID}/knowledge-articles/:id`, () => {
    return HttpResponse.json(buildKnowledgeArticle())
  }),

  http.delete(`/api/tenants/${TENANT_ID}/knowledge-articles/:id`, () => {
    return HttpResponse.json({ message: 'Deleted' })
  }),

  http.post(`/api/tenants/${TENANT_ID}/knowledge-articles/:id/embed`, ({ params }) => {
    return HttpResponse.json({
      article_id: params.id,
      processed: 3,
      failed: 0,
      embedding_status: { total_chunks: 3, embedded_chunks: 3 },
    })
  }),

  http.post(`/api/tenants/${TENANT_ID}/knowledge-articles/embed`, () => {
    return HttpResponse.json({ processed: 6, failed: 0, pending: 0 })
  }),

  // ── Users ────────────────────────────────────────────────────────
  http.get(`/api/tenants/${TENANT_ID}/users`, () => {
    return HttpResponse.json([
      buildTenantUser(),
      buildTenantUser({
        user_id: '22222222-2222-2222-2222-222222222223',
        role: 'admin',
        user: buildUser({
          id: '22222222-2222-2222-2222-222222222223',
          email: 'agent@test.com',
          name: 'Agent User',
        }),
      }),
    ])
  }),

  http.post(`/api/tenants/${TENANT_ID}/users`, () => {
    return HttpResponse.json(buildTenantUser({ role: 'member' }), { status: 201 })
  }),

  http.delete(`/api/tenants/${TENANT_ID}/users/:userId`, () => {
    return HttpResponse.json({ message: 'Deleted' })
  }),
]

type Draft = { status: 'pending' | 'approved' | 'rejected' | 'sent' }
