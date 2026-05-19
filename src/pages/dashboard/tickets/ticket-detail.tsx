import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Send, Sparkles, Paperclip } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SimilarityScore } from '@/components/ui/similarity-score'
import { PageHeader } from '@/components/layout/page-header'
import { Spinner } from '@/components/ui/spinner'
import { tokens } from '@/lib/design-tokens'
import { sanitizeHtml } from '@/lib/sanitize-html'
import { ticketTitle } from '@/lib/ticket-title'
import { extractErrorMessage } from '@/lib/error-message'
import { useToast } from '@/components/ui/toast'
import api from '@/lib/api'
import type { Ticket, Draft, Message } from '@/types/api'

type TimelineItem =
  | { kind: 'message'; at: number; message: Message }
  | { kind: 'draft'; at: number; draft: Draft }

const stateColors = tokens.colors.state
const draftColors = tokens.colors.draft

export default function TicketDetailPage() {
  const { tenantId, ticketId } = useParams()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: ticketData, isLoading } = useQuery({
    queryKey: ['ticket', tenantId, ticketId],
    queryFn: () =>
      api.get<{ ticket: Ticket; messages: import('@/types/api').Message[] } | Ticket>(
        `/tenants/${tenantId}/tickets/${ticketId}`,
      ).then((r) => r.data),
  })

  const ticket = ticketData && 'ticket' in ticketData ? ticketData.ticket : ticketData as Ticket | undefined
  const ticketMessages = (ticketData && 'messages' in ticketData ? ticketData.messages : ticket?.messages) ?? []

  const { data: rawDrafts } = useQuery({
    queryKey: ['ticket-drafts', tenantId, ticketId],
    queryFn: () => api.get<Draft[] | { data: Draft[] }>(`/tenants/${tenantId}/tickets/${ticketId}/drafts`).then((r) => r.data),
  })
  const drafts = Array.isArray(rawDrafts) ? rawDrafts : rawDrafts?.data ?? []

  const timeline: TimelineItem[] = [
    ...ticketMessages.map<TimelineItem>((m) => ({
      kind: 'message',
      at: new Date(m.external_created_at ?? m.created_at).getTime(),
      message: m,
    })),
    ...drafts.map<TimelineItem>((d) => ({
      kind: 'draft',
      at: new Date(d.created_at).getTime(),
      draft: d,
    })),
  ].sort((a, b) => a.at - b.at)

  const generateDraft = useMutation({
    mutationFn: () => api.post(`/tenants/${tenantId}/tickets/${ticketId}/draft`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ticket-drafts', tenantId, ticketId] }),
    onError: (err) => toast(extractErrorMessage(err, 'Failed to generate draft'), 'error'),
  })

  const reviewDraft = useMutation({
    mutationFn: ({ draftId, status }: { draftId: string; status: string }) =>
      api.patch(`/tenants/${tenantId}/drafts/${draftId}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ticket-drafts', tenantId, ticketId] }),
  })

  const sendDraft = useMutation({
    mutationFn: (draftId: string) => api.post(`/tenants/${tenantId}/drafts/${draftId}/send`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ticket-drafts', tenantId, ticketId] }),
  })

  if (isLoading) return <div className="flex justify-center p-12"><Spinner /></div>
  if (!ticket) return <div className="py-12 text-center text-muted-foreground">Ticket not found</div>

  const lastMessage = ticketMessages.length > 0 ? ticketMessages[ticketMessages.length - 1] : null
  const lastReplyIsAgent = lastMessage?.author_role === 'agent' || lastMessage?.author_role === 'bot'

  return (
    <div>
      <PageHeader
        title={ticketTitle(ticket)}
        actions={
          <div className="flex gap-2">
            <Link to={`/t/${tenantId}/tickets`}>
              <Button variant="outline" size="sm"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
            </Link>
            <Button size="sm" onClick={() => generateDraft.mutate()} disabled={generateDraft.isPending || lastReplyIsAgent}>
              <Sparkles className="mr-2 h-4 w-4" />
              {generateDraft.isPending ? 'Generating...' : lastReplyIsAgent ? 'Awaiting Customer Reply' : 'Generate Draft'}
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Conversation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {timeline.length === 0 ? (
                <p className="text-sm text-muted-foreground">No messages yet.</p>
              ) : (
                timeline.map((item) =>
                  item.kind === 'message' ? (
                    <div
                      key={`m-${item.message.id}`}
                      className={`rounded-lg p-3 ${
                        item.message.author_role === 'customer'
                          ? 'bg-muted'
                          : item.message.author_role === 'agent'
                            ? 'bg-brand-50'
                            : 'bg-muted/50'
                      }`}
                    >
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-xs font-medium">{item.message.author_name ?? item.message.author_role}</span>
                        <Badge variant="outline" className="text-xs">{item.message.author_role}</Badge>
                        {item.message.external_created_at && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(item.message.external_created_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                      {item.message.body && (
                        <div
                          className="prose prose-sm max-w-none text-sm [&_a]:text-brand-700 [&_a]:underline [&_p]:my-1 [&_div]:my-1"
                          dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.message.body) }}
                        />
                      )}
                      {item.message.attachments && item.message.attachments.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {item.message.attachments.map((att) => {
                            const isImage = att.file_type?.startsWith('image/')
                            return isImage ? (
                              <a
                                key={att.id}
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative block overflow-hidden rounded-lg border"
                              >
                                <img
                                  src={att.url}
                                  alt={att.file_name}
                                  className="h-24 w-auto max-w-[200px] object-cover transition-opacity group-hover:opacity-80"
                                />
                                <span className="absolute inset-x-0 bottom-0 bg-black/50 px-2 py-0.5 text-[10px] text-white truncate">
                                  {att.file_name}
                                </span>
                              </a>
                            ) : (
                              <a
                                key={att.id}
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-xs transition-colors hover:bg-muted"
                              >
                                <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="max-w-[150px] truncate font-medium">{att.file_name}</span>
                                {att.file_size != null && (
                                  <span className="text-muted-foreground">
                                    {att.file_size < 1024 ? `${att.file_size} B`
                                      : att.file_size < 1048576 ? `${Math.round(att.file_size / 1024)} KB`
                                      : `${(att.file_size / 1048576).toFixed(1)} MB`}
                                  </span>
                                )}
                              </a>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      key={`d-${item.draft.id}`}
                      className="ml-6 rounded-lg border border-dashed border-brand-300 bg-brand-50/40 p-3"
                    >
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-700">
                          <Sparkles className="h-3 w-3" /> AI Draft
                        </span>
                        <Badge
                          style={{
                            backgroundColor: `${draftColors[item.draft.status]}20`,
                            color: draftColors[item.draft.status],
                          }}
                        >
                          {item.draft.status}
                        </Badge>
                        <SimilarityScore score={item.draft.similarity_score} />
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.draft.created_at).toLocaleString()}
                        </span>
                        <span className="ml-auto text-xs text-muted-foreground">
                          {item.draft.ai_model}
                          {item.draft.ai_tokens_used ? ` · ${item.draft.ai_tokens_used} tokens` : ''}
                        </span>
                      </div>
                      <div className="whitespace-pre-wrap text-sm">{item.draft.draft_response}</div>
                      {item.draft.status === 'pending' && (
                        <div className="mt-3 flex gap-2">
                          <Button size="sm" onClick={() => reviewDraft.mutate({ draftId: item.draft.id, status: 'approved' })}>
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => reviewDraft.mutate({ draftId: item.draft.id, status: 'rejected' })}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                      {item.draft.status === 'approved' && (
                        <div className="mt-3">
                          <Button size="sm" onClick={() => sendDraft.mutate(item.draft.id)}>
                            <Send className="mr-2 h-3 w-3" /> Send
                          </Button>
                        </div>
                      )}
                    </div>
                  ),
                )
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">State</span>
                <Badge style={{ backgroundColor: `${stateColors[ticket.state]}20`, color: stateColors[ticket.state] }}>
                  {ticket.state}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Source</span>
                <span>{ticket.input_app?.name ?? ticket.input_app?.code ?? '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">External ID</span>
                <span className="font-mono text-xs">{ticket.external_id}</span>
              </div>
            </CardContent>
          </Card>

          {(ticket.customer_name || ticket.customer_email || ticket.customer) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Customer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {(ticket.customer_name ?? ticket.customer?.name) && (
                  <div>{ticket.customer_name ?? ticket.customer?.name}</div>
                )}
                {(ticket.customer_email ?? ticket.customer?.email) && (
                  <div className="text-muted-foreground">{ticket.customer_email ?? ticket.customer?.email}</div>
                )}
                {ticket.customer?.phone && (
                  <div className="text-muted-foreground">{ticket.customer.phone}</div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
