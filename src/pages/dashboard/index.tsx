import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { Ticket, Puzzle, BookOpen, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/page-header'
import { Spinner } from '@/components/ui/spinner'
import api from '@/lib/api'
import type { App, PaginatedResponse, Ticket as TicketType, KnowledgeArticle, Draft } from '@/types/api'

export default function DashboardPage() {
  const { tenantId } = useParams()

  const apps = useQuery({
    queryKey: ['apps', tenantId],
    queryFn: () => api.get<{ data: App[] }>(`/tenants/${tenantId}/apps`).then((r) => r.data),
    staleTime: 0,
  })

  const tickets = useQuery({
    queryKey: ['tickets', tenantId, 'open'],
    queryFn: () =>
      api.get<PaginatedResponse<TicketType>>(`/tenants/${tenantId}/tickets?state=open&limit=1`).then((r) => r.data),
    staleTime: 0,
  })

  const articles = useQuery({
    queryKey: ['knowledge-articles', tenantId, 'active'],
    queryFn: () =>
      api.get<PaginatedResponse<KnowledgeArticle>>(`/tenants/${tenantId}/knowledge-articles?is_active=true&limit=1`).then((r) => r.data),
    staleTime: 0,
  })

  const drafts = useQuery({
    queryKey: ['drafts-pending', tenantId],
    queryFn: () =>
      api.get<PaginatedResponse<Draft>>(`/tenants/${tenantId}/drafts?status=pending&limit=1`).then((r) => r.data),
    staleTime: 0,
  })

  const stats = [
    { label: 'Active Apps', value: apps.data?.data?.filter((a: App) => a.is_active).length ?? 0, icon: Puzzle, color: 'text-brand-600', settled: !apps.isLoading, to: 'apps' },
    { label: 'Open Tickets', value: tickets.data?.pagination?.total, icon: Ticket, color: 'text-state-open', settled: !tickets.isLoading, to: 'tickets?state=open' },
    { label: 'Knowledge Articles', value: articles.data?.pagination?.total, icon: BookOpen, color: 'text-success', settled: !articles.isLoading, to: 'knowledge' },
    { label: 'Pending Drafts', value: drafts.data?.pagination?.total, icon: FileText, color: 'text-draft-pending', settled: !drafts.isLoading, to: 'drafts' },
  ]

  return (
    <div>
      <PageHeader title="Dashboard" description="Overview of your support AI agent" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} to={`/t/${tenantId}/${stat.to}`} className="block">
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                {stat.settled ? (
                  <div className="text-2xl font-bold">{stat.value ?? 0}</div>
                ) : (
                  <Spinner />
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
