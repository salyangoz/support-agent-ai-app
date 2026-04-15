import { NavLink, useParams } from 'react-router-dom'
import {
  LayoutDashboard,
  Puzzle,
  Ticket,
  BookOpen,
  Users,
  Settings,
  FileText,
  UserCircle,
  MessageCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/auth-context'

const mainNav = [
  { to: '', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: 'apps', icon: Puzzle, label: 'Apps' },
  { to: 'tickets', icon: Ticket, label: 'Tickets' },
  { to: 'customers', icon: UserCircle, label: 'Customers' },
  { to: 'knowledge', icon: BookOpen, label: 'Knowledge Base' },
  { to: 'drafts', icon: FileText, label: 'Drafts' },
  { to: 'chat', icon: MessageCircle, label: 'Chat' },
]

const settingsNav = [
  { to: 'users', icon: Users, label: 'Users', roles: ['owner', 'admin'] },
  { to: 'settings', icon: Settings, label: 'Settings', roles: ['owner', 'admin'] },
]

export function Sidebar() {
  const { tenantId } = useParams()
  const { activeRole } = useAuth()

  const filterByRole = (items: typeof settingsNav) =>
    items.filter((item) => !item.roles || (activeRole && item.roles.includes(activeRole)))

  return (
    <aside className="flex h-full w-[var(--sidebar-width)] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-[var(--header-height)] items-center gap-2.5 px-5">
        <img src="/logo-icon.svg" alt="Yengec" className="h-7 w-7" />
        <span className="text-sm font-bold tracking-tight">Support AI</span>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 pt-2">
        {mainNav.map((item) => (
          <NavLink
            key={item.to}
            to={`/t/${tenantId}/${item.to}`}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 rounded-[10px] px-3 py-2 text-[13px] font-bold transition-all duration-200',
                isActive
                  ? 'bg-[#fff1ea] text-[#f33c42]'
                  : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-r-full bg-[#f33c42]" />
                )}
                <item.icon className={cn('h-4 w-4', isActive && 'text-[#f33c42]')} />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {filterByRole(settingsNav).length > 0 && (
        <div className="border-t border-sidebar-border px-3 py-3">
          <div className="space-y-0.5">
            {filterByRole(settingsNav).map((item) => (
              <NavLink
                key={item.to}
                to={`/t/${tenantId}/${item.to}`}
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center gap-3 rounded-[10px] px-3 py-2 text-[13px] font-bold transition-all duration-200',
                    isActive
                      ? 'bg-[#fff1ea] text-[#f33c42]'
                      : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-r-full bg-[#f33c42]" />
                    )}
                    <item.icon className={cn('h-4 w-4', isActive && 'text-[#f33c42]')} />
                    {item.label}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </aside>
  )
}
