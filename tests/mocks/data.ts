import type {
  Tenant,
  TenantSettings,
  User,
  TenantUser,
  App,
  Customer,
  Ticket,
  Message,
  Draft,
  KnowledgeArticle,
} from '@/types/api'

let counter = 0
const nextId = () => `00000000-0000-0000-0000-${String(++counter).padStart(12, '0')}`

export const TENANT_ID = '11111111-1111-1111-1111-111111111111'
export const USER_ID = '22222222-2222-2222-2222-222222222222'
export const APP_ID = '33333333-3333-3333-3333-333333333333'
export const TICKET_ID = '44444444-4444-4444-4444-444444444444'
export const CUSTOMER_ID = '55555555-5555-5555-5555-555555555555'
export const DRAFT_ID = '66666666-6666-6666-6666-666666666666'
export const ARTICLE_ID = '77777777-7777-7777-7777-777777777777'

export function buildTenantSettings(overrides: Partial<TenantSettings> = {}): TenantSettings {
  return {
    auto_send_drafts: false,
    default_language: 'en',
    rag_top_k: 5,
    ai_service: 'deepseek',
    ai_model: 'deepseek-chat',
    draft_tone: 'professional',
    max_context_tokens: 4000,
    sync_lookback_minutes: 10,
    ...overrides,
  }
}

export function buildTenant(overrides: Partial<Tenant> = {}): Tenant {
  return {
    id: TENANT_ID,
    name: 'Test Company',
    slug: 'test-company',
    api_key: 'tk_test_apikey_123',
    settings: buildTenantSettings(),
    is_active: true,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z',
    ...overrides,
  }
}

export function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: USER_ID,
    email: 'admin@test.com',
    name: 'Test Admin',
    is_active: true,
    last_login_at: '2025-01-10T00:00:00.000Z',
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z',
    ...overrides,
  }
}

export function buildTenantUser(overrides: Partial<TenantUser> = {}): TenantUser {
  return {
    id: nextId(),
    tenant_id: TENANT_ID,
    user_id: USER_ID,
    role: 'owner',
    is_active: true,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z',
    tenant: buildTenant(),
    user: buildUser(),
    ...overrides,
  }
}

export function buildApp(overrides: Partial<App> = {}): App {
  return {
    id: APP_ID,
    tenant_id: TENANT_ID,
    code: 'intercom',
    type: 'ticket',
    role: 'both',
    name: 'Intercom Production',
    credentials: { access_token: 'tok_xxx' },
    webhook_secret: 'whsec_xxx',
    config: {},
    is_active: true,
    last_synced_at: '2025-01-10T00:00:00.000Z',
    last_error: null,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z',
    ...overrides,
  }
}

export function buildCustomer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: CUSTOMER_ID,
    tenant_id: TENANT_ID,
    external_id: 'ext_cust_001',
    email: 'customer@example.com',
    name: 'Jane Customer',
    phone: '+1234567890',
    metadata: { plan: 'pro', country: 'US' },
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z',
    ...overrides,
  }
}

export function buildMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: nextId(),
    ticket_id: TICKET_ID,
    tenant_id: TENANT_ID,
    external_id: `ext_msg_${counter}`,
    author_role: 'customer',
    author_id: null,
    author_name: 'Jane Customer',
    body: 'I need help with my account.',
    external_created_at: '2025-01-10T10:00:00.000Z',
    created_at: '2025-01-10T10:00:00.000Z',
    ...overrides,
  }
}

export function buildTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: TICKET_ID,
    tenant_id: TENANT_ID,
    customer_id: CUSTOMER_ID,
    input_app_id: APP_ID,
    output_app_id: null,
    external_id: 'ext_ticket_001',
    state: 'open',
    subject: 'Cannot access my account',
    initial_body: 'I need help with my account.',
    language: 'en',
    assignee_id: null,
    external_created_at: '2025-01-10T10:00:00.000Z',
    external_updated_at: '2025-01-10T10:00:00.000Z',
    synced_at: '2025-01-10T10:01:00.000Z',
    created_at: '2025-01-10T10:00:00.000Z',
    updated_at: '2025-01-10T10:00:00.000Z',
    customer: buildCustomer(),
    input_app: buildApp(),
    messages: [
      buildMessage(),
      buildMessage({ author_role: 'agent', author_name: 'Support Bot', body: 'Let me help you with that.' }),
    ],
    ...overrides,
  }
}

export function buildDraft(overrides: Partial<Draft> = {}): Draft {
  return {
    id: DRAFT_ID,
    ticket_id: TICKET_ID,
    tenant_id: TENANT_ID,
    prompt_context: 'RAG context...',
    draft_response: 'Hello Jane, I can help you reset your password. Please follow these steps...',
    ai_model: 'deepseek-chat',
    ai_tokens_used: 350,
    status: 'pending',
    reviewed_by: null,
    reviewed_at: null,
    created_at: '2025-01-10T10:05:00.000Z',
    ...overrides,
  }
}

export function buildKnowledgeArticle(overrides: Partial<KnowledgeArticle> = {}): KnowledgeArticle {
  return {
    id: ARTICLE_ID,
    tenant_id: TENANT_ID,
    external_id: null,
    title: 'How to Reset Your Password',
    content: 'To reset your password, go to Settings > Security > Reset Password...',
    category: 'Account',
    language: 'en',
    is_active: true,
    embedding_status: { total_chunks: 3, embedded_chunks: 3 },
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z',
    ...overrides,
  }
}
