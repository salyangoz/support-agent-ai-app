import { useQuery } from '@tanstack/react-query'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { PageHeader } from '@/components/layout/page-header'
import { Spinner } from '@/components/ui/spinner'
import { tokens } from '@/lib/design-tokens'
import api from '@/lib/api'
import type { Ticket, PaginatedResponse } from '@/types/api'

const stateColors = tokens.colors.state

export default function TicketsPage() {
  const { tenantId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') ?? '1')
  const stateFilter = searchParams.get('state') ?? ''

  const { data, isLoading } = useQuery({
    queryKey: ['tickets', tenantId, page, stateFilter],
    queryFn: () =>
      api
        .get<PaginatedResponse<Ticket>>(`/tenants/${tenantId}/tickets`, {
          params: { page, limit: 20, ...(stateFilter && { state: stateFilter }) },
        })
        .then((r) => r.data),
  })

  return (
    <div>
      <PageHeader
        title="Tickets"
        description="View and manage support tickets from your connected apps"
        actions={
          <Select
            value={stateFilter}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams)
              if (e.target.value) params.set('state', e.target.value)
              else params.delete('state')
              params.set('page', '1')
              setSearchParams(params)
            }}
            className="w-40"
          >
            <option value="">All states</option>
            <option value="open">Open</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </Select>
        }
      />

      {isLoading ? (
        <div className="flex justify-center p-12"><Spinner /></div>
      ) : !data?.data.length ? (
        <div className="py-12 text-center text-muted-foreground">No tickets found.</div>
      ) : (
        <>
          <div className="rounded-lg border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Subject</th>
                  <th className="px-4 py-3 text-left font-medium">Customer</th>
                  <th className="px-4 py-3 text-left font-medium">State</th>
                  <th className="px-4 py-3 text-left font-medium">Last Reply</th>
                  <th className="px-4 py-3 text-left font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((ticket) => (
                  <tr key={ticket.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Link
                        to={`/t/${tenantId}/tickets/${ticket.id}`}
                        className="font-medium text-brand-600 hover:underline"
                      >
                        {ticket.subject ?? ticket.external_id}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {ticket.customer_name ?? ticket.customer_email ?? ticket.customer?.name ?? ticket.customer?.email ?? '-'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        style={{
                          backgroundColor: `${stateColors[ticket.state]}20`,
                          color: stateColors[ticket.state],
                        }}
                      >
                        {ticket.state}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {ticket.last_message_role ? (
                        <span>{ticket.last_message_by ?? ticket.last_message_role}</span>
                      ) : '-'}
                      {ticket.last_message_at && (
                        <div className="text-[11px] opacity-60">{new Date(ticket.last_message_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {ticket.created_at ? new Date(ticket.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {data.data.length} of {(data.pagination?.total ?? 0)} tickets
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => {
                  const params = new URLSearchParams(searchParams)
                  params.set('page', String(page - 1))
                  setSearchParams(params)
                }}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page * 20 >= (data.pagination?.total ?? 0)}
                onClick={() => {
                  const params = new URLSearchParams(searchParams)
                  params.set('page', String(page + 1))
                  setSearchParams(params)
                }}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
