import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { Send } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { PageHeader } from '@/components/layout/page-header'
import { Spinner } from '@/components/ui/spinner'
import { tokens } from '@/lib/design-tokens'
import api from '@/lib/api'
import type { Draft, PaginatedResponse } from '@/types/api'
import { useState } from 'react'

const draftColors = tokens.colors.draft

export default function DraftsPage() {
  const { tenantId } = useParams()
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')

  const { data: rawData, isLoading } = useQuery({
    queryKey: ['drafts', tenantId, statusFilter],
    queryFn: () =>
      api
        .get<PaginatedResponse<Draft> | Draft[]>(`/tenants/${tenantId}/drafts`, {
          params: { limit: 50, ...(statusFilter && { status: statusFilter }) },
        })
        .then((r) => r.data),
  })

  const drafts_list = Array.isArray(rawData) ? rawData : rawData?.data ?? []

  const approveMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/tenants/${tenantId}/drafts/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['drafts', tenantId] }),
  })

  const sendMutation = useMutation({
    mutationFn: (id: string) => api.post(`/tenants/${tenantId}/drafts/${id}/send`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['drafts', tenantId] }),
  })

  return (
    <div>
      <PageHeader
        title="Drafts"
        description="Review and manage AI-generated draft responses"
        actions={
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-40">
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="sent">Sent</option>
          </Select>
        }
      />

      {isLoading ? (
        <div className="flex justify-center p-12"><Spinner /></div>
      ) : !drafts_list.length ? (
        <div className="py-12 text-center text-muted-foreground">No drafts found.</div>
      ) : (
        <div className="space-y-4">
          {drafts_list.map((draft) => (
            <div key={draft.id} className="rounded-lg border p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge
                    style={{
                      backgroundColor: `${draftColors[draft.status]}20`,
                      color: draftColors[draft.status],
                    }}
                  >
                    {draft.status}
                  </Badge>
                  <Link
                    to={`/t/${tenantId}/tickets/${draft.ticket_id}`}
                    className="text-sm text-brand-600 hover:underline"
                  >
                    View Ticket
                  </Link>
                </div>
                <span className="text-xs text-muted-foreground">
                  {draft.ai_model} &middot; {new Date(draft.created_at).toLocaleString()}
                </span>
              </div>
              <div className="mb-3 whitespace-pre-wrap text-sm">{draft.draft_response}</div>
              <div className="flex gap-2">
                {draft.status === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => approveMutation.mutate({ id: draft.id, status: 'approved' })}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => approveMutation.mutate({ id: draft.id, status: 'rejected' })}
                    >
                      Reject
                    </Button>
                  </>
                )}
                {draft.status === 'approved' && (
                  <Button size="sm" onClick={() => sendMutation.mutate(draft.id)}>
                    <Send className="mr-2 h-3 w-3" /> Send
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
