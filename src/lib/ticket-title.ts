import type { Ticket } from '@/types/api'

const PREVIEW_LIMIT = 80

export function ticketTitle(
  ticket: Pick<Ticket, 'subject' | 'last_message_preview' | 'external_id' | 'id'>,
): string {
  const subject = ticket.subject?.trim()
  if (subject) return subject

  const preview = ticket.last_message_preview?.trim()
  if (preview) {
    return preview.length > PREVIEW_LIMIT ? preview.slice(0, PREVIEW_LIMIT).trimEnd() + '…' : preview
  }

  return ticket.external_id || `Ticket ${ticket.id.slice(0, 8)}`
}
