import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import api from '@/lib/api'
import type { User, AuthTokens, LoginRequest, RegisterRequest, RegisterResponse, CreateTenantRequest } from '@/types/api'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  activeTenantId: string | null
  activeRole: string | null
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<string | null>
  register: (data: RegisterRequest) => Promise<string | null>
  logout: () => void
  setActiveTenant: (tenantId: string) => void
  createTenant: (data: CreateTenantRequest) => Promise<string>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    activeTenantId: null,
    activeRole: null,
  })

  const fetchMe = useCallback(async (): Promise<string | null> => {
    try {
      interface MeTenant { id: string; name: string; slug: string; role: string }
      const { data } = await api.get<User & { tenants?: MeTenant[] }>('/auth/me')
      const raw = data.tenant_users ?? data.tenants ?? []
      const tenantUsers = raw.map((item) => {
        if ('tenant_id' in item) return item
        const t = item as unknown as MeTenant
        return {
          id: t.id,
          tenant_id: t.id,
          user_id: data.id,
          role: (t.role ?? 'member') as 'owner' | 'admin' | 'member',
          is_active: true,
          created_at: data.created_at,
          updated_at: data.updated_at,
          tenant: { id: t.id, name: t.name, slug: t.slug, api_key: '', settings: {}, is_active: true, created_at: data.created_at, updated_at: data.updated_at },
        }
      })
      const storedTenantId = localStorage.getItem('activeTenantId')
      const tenantUser = tenantUsers.find((tu) => tu.tenant_id === storedTenantId) ?? tenantUsers[0]
      const tenantId = tenantUser?.tenant_id ?? null
      setState({
        user: { ...data, tenant_users: tenantUsers },
        isAuthenticated: true,
        isLoading: false,
        activeTenantId: tenantId,
        activeRole: tenantUser?.role ?? null,
      })
      if (tenantUser) {
        localStorage.setItem('activeTenantId', tenantUser.tenant_id)
      }
      return tenantId
    } catch {
      setState({ user: null, isAuthenticated: false, isLoading: false, activeTenantId: null, activeRole: null })
      return null
    }
  }, [])

  useEffect(() => {
    const tokens = localStorage.getItem('tokens')
    if (tokens) {
      fetchMe()
    } else {
      setState((s) => ({ ...s, isLoading: false }))
    }
  }, [fetchMe])

  const login = async (credentials: LoginRequest): Promise<string | null> => {
    const { data } = await api.post<AuthTokens>('/auth/login', credentials)
    localStorage.setItem('tokens', JSON.stringify(data))
    return await fetchMe()
  }

  const register = async (data: RegisterRequest): Promise<string | null> => {
    const { data: res } = await api.post<RegisterResponse>('/auth/register', data)
    localStorage.setItem('tokens', JSON.stringify({ access_token: res.access_token, refresh_token: res.refresh_token }))
    return await fetchMe()
  }

  const logout = () => {
    localStorage.removeItem('tokens')
    localStorage.removeItem('user')
    localStorage.removeItem('activeTenantId')
    setState({ user: null, isAuthenticated: false, isLoading: false, activeTenantId: null, activeRole: null })
  }

  const setActiveTenant = (tenantId: string) => {
    const tenantUser = state.user?.tenant_users?.find((tu) => tu.tenant_id === tenantId)
    if (tenantUser) {
      localStorage.setItem('activeTenantId', tenantId)
      setState((s) => ({ ...s, activeTenantId: tenantId, activeRole: tenantUser.role }))
    }
  }

  const createTenant = async (data: CreateTenantRequest): Promise<string> => {
    const { data: tenant } = await api.post<{ id: string }>('/my/tenants', data)
    const tenantId = tenant.id
    localStorage.setItem('activeTenantId', tenantId)
    setState((s) => ({
      ...s,
      activeTenantId: tenantId,
      activeRole: 'owner',
    }))
    fetchMe()
    return tenantId
  }

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, setActiveTenant, createTenant }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
