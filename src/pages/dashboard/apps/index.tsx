import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { Plus, ExternalLink, AlertCircle, CheckCircle2, ArrowRight, Trash2, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/layout/page-header'
import { Spinner } from '@/components/ui/spinner'
import api from '@/lib/api'
import type { App } from '@/types/api'
import { APP_CATALOG, APP_CATEGORIES, getAppsByCategory } from '@/lib/app-catalog'

export default function AppsPage() {
  const { tenantId } = useParams()
  const queryClient = useQueryClient()

  const { data: appsResponse, isLoading } = useQuery({
    queryKey: ['apps', tenantId],
    queryFn: () => api.get<{ data: App[] }>(`/tenants/${tenantId}/apps`).then((r) => r.data),
  })

  const appList = appsResponse?.data ?? []

  const testMutation = useMutation({
    mutationFn: (appId: string) => api.post(`/tenants/${tenantId}/apps/${appId}/test`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['apps', tenantId] }),
  })

  const syncMutation = useMutation({
    mutationFn: (appId: string) => api.post(`/tenants/${tenantId}/apps/${appId}/sync`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['apps', tenantId] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (appId: string) => api.delete(`/tenants/${tenantId}/apps/${appId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['apps', tenantId] }),
  })

  if (isLoading) return <div className="flex justify-center p-12"><Spinner /></div>

  const connectedCodes = new Set(appList.map((a) => a.code))

  return (
    <div>
      <PageHeader
        title="Apps"
        description="Connect your tools to power your AI support agent"
      />

      {appList.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Connected Apps
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {appList.map((app) => {
              const def = APP_CATALOG[app.code]
              const Icon = def?.icon
              return (
                <Card key={app.id} className="relative">
                  <CardHeader className="flex flex-row items-start justify-between pb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-lg"
                        style={{ backgroundColor: `${def?.color ?? '#6b7280'}15` }}
                      >
                        {Icon && <Icon className="h-5 w-5" style={{ color: def?.color }} />}
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {app.name ?? def?.name ?? app.code}
                        </CardTitle>
                        <CardDescription className="mt-0.5 flex gap-1.5">
                          <Badge variant="outline" className="text-xs">{app.type}</Badge>
                          <Badge variant="secondary" className="text-xs">{app.role}</Badge>
                        </CardDescription>
                      </div>
                    </div>
                    {app.is_active ? (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </CardHeader>
                  <CardContent>
                    {app.last_error && (
                      <p className="mb-3 rounded bg-destructive/10 p-2 text-xs text-destructive">{app.last_error}</p>
                    )}
                    {app.last_synced_at && (
                      <p className="mb-3 text-xs text-muted-foreground">
                        Last synced: {new Date(app.last_synced_at).toLocaleString()}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Link to={`/t/${tenantId}/apps/${app.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <ExternalLink className="mr-2 h-3 w-3" /> Configure
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testMutation.mutate(app.id)}
                        disabled={testMutation.isPending}
                      >
                        Test
                      </Button>
                      {app.role !== 'destination' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => syncMutation.mutate(app.id)}
                          disabled={syncMutation.isPending}
                        >
                          <RefreshCw className={`mr-2 h-3 w-3 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                          Sync
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          if (confirm(`Delete ${app.name ?? app.code}? This cannot be undone.`))
                            deleteMutation.mutate(app.id)
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>
      )}

      {APP_CATEGORIES.map((category) => {
        const categoryApps = getAppsByCategory(category.key)
        if (!categoryApps.length) return null

        return (
          <section key={category.key} className="mb-10">
            <div className="mb-4 flex items-center gap-2">
              <category.icon className="h-5 w-5 text-muted-foreground" />
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {category.label}
                </h2>
                <p className="text-xs text-muted-foreground">{category.description}</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categoryApps.map((def) => {
                const isConnected = connectedCodes.has(def.code)
                return (
                  <Card
                    key={def.code}
                    className={def.comingSoon ? 'opacity-60' : ''}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-lg"
                          style={{ backgroundColor: `${def.color}15` }}
                        >
                          <def.icon className="h-5 w-5" style={{ color: def.color }} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base">{def.name}</CardTitle>
                            {isConnected && <Badge variant="success" className="text-xs">Connected</Badge>}
                            {def.comingSoon && <Badge variant="secondary" className="text-xs">Coming Soon</Badge>}
                          </div>
                          <CardDescription className="mt-0.5">{def.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {def.comingSoon ? (
                        <Button variant="outline" size="sm" className="w-full" disabled>
                          Coming Soon
                        </Button>
                      ) : isConnected ? (
                        <Link to={`/t/${tenantId}/apps/new?code=${def.code}`}>
                          <Button variant="outline" size="sm" className="w-full">
                            <Plus className="mr-2 h-3 w-3" /> Add Another
                          </Button>
                        </Link>
                      ) : (
                        <Link to={`/t/${tenantId}/apps/new?code=${def.code}`}>
                          <Button size="sm" className="w-full">
                            Connect <ArrowRight className="ml-2 h-3 w-3" />
                          </Button>
                        </Link>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
