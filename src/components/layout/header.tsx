import { useAuth } from '@/context/auth-context'
import { LogOut, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function Header() {
  const { user, logout, activeTenantId, setActiveTenant } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const tenants = user?.tenant_users ?? []
  const activeTenant = tenants.find((tu) => tu.tenant_id === activeTenantId)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleTenantSwitch = (tenantId: string) => {
    setActiveTenant(tenantId)
    setMenuOpen(false)
    navigate(`/t/${tenantId}`)
  }

  return (
    <header className="flex h-[var(--header-height)] items-center justify-between border-b border-border/60 bg-card px-5">
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2 rounded-lg border border-border/60 px-3 py-1.5 text-[13px] font-medium transition-colors hover:bg-muted"
        >
          {activeTenant?.tenant?.name ?? 'Select Tenant'}
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        {menuOpen && tenants.length > 1 && (
          <div className="shadow-float absolute left-0 top-full z-50 mt-1.5 min-w-[220px] rounded-xl border bg-popover p-1.5">
            {tenants.map((tu) => (
              <button
                key={tu.tenant_id}
                onClick={() => handleTenantSwitch(tu.tenant_id)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent"
              >
                <span className="font-medium">{tu.tenant?.name ?? tu.tenant_id}</span>
                <span className="text-[11px] text-muted-foreground">{tu.role}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span className="text-[13px] text-muted-foreground">{user?.email}</span>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-3.5 w-3.5" />
          Logout
        </button>
      </div>
    </header>
  )
}
