import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { Pencil } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/layout/page-header'
import { Spinner } from '@/components/ui/spinner'
import api from '@/lib/api'
import type { Customer, PaginatedResponse } from '@/types/api'

export default function CustomersPage() {
  const { tenantId } = useParams()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<Customer | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['customers', tenantId, search, page],
    queryFn: () =>
      api
        .get<PaginatedResponse<Customer>>(`/tenants/${tenantId}/customers`, {
          params: { page, limit: 20, ...(search && { email: search }) },
        })
        .then((r) => r.data),
  })

  return (
    <div>
      <PageHeader title="Customers" description="View customers from your connected support apps" />
      <div className="mb-4">
        <Input
          placeholder="Search by email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="max-w-sm"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><Spinner /></div>
      ) : !data?.data.length ? (
        <div className="py-12 text-center text-muted-foreground">No customers found.</div>
      ) : (
        <>
          <div className="rounded-lg border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Email</th>
                  <th className="px-4 py-3 text-left font-medium">Phone</th>
                  <th className="px-4 py-3 text-left font-medium">Tickets</th>
                  <th className="px-4 py-3 text-left font-medium">Created</th>
                  <th className="w-10 px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((customer) => (
                  <tr key={customer.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{customer.name ?? '-'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{customer.email ?? '-'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{customer.phone ?? '-'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{customer.ticket_count ?? 0}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(customer.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-2 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setEditing(customer)}
                        title="Edit customer"
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {data.data.length} of {(data.pagination?.total ?? 0)} customers
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={page * 20 >= (data.pagination?.total ?? 0)} onClick={() => setPage(page + 1)}>
                Next
              </Button>
            </div>
          </div>
        </>
      )}

      {editing && (
        <EditCustomerDialog
          key={editing.id}
          tenantId={tenantId!}
          customer={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

interface EditCustomerDialogProps {
  tenantId: string
  customer: Customer
  onClose: () => void
}

function EditCustomerDialog({ tenantId, customer, onClose }: EditCustomerDialogProps) {
  const queryClient = useQueryClient()
  const [email, setEmail] = useState(customer.email ?? '')
  const [name, setName] = useState(customer.name ?? '')
  const [phone, setPhone] = useState(customer.phone ?? '')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: async (payload: Record<string, string | null>) => {
      const { data } = await api.patch<Customer>(`/tenants/${tenantId}/customers/${customer.id}`, payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', tenantId] })
      onClose()
    },
    onError: (err: unknown) => {
      const status = (err as { response?: { status?: number; data?: { error?: string } } })?.response?.status
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      if (status === 409) {
        setError(message ?? 'This email is already used by another customer.')
      } else if (status === 400) {
        setError(message ?? 'Invalid input.')
      } else {
        setError(message ?? 'Failed to save customer.')
      }
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload: Record<string, string | null> = {}
    if (email !== (customer.email ?? '')) payload.email = email.trim()
    if (name !== (customer.name ?? '')) payload.name = name.trim() || null
    if (phone !== (customer.phone ?? '')) payload.phone = phone.trim() || null
    if (Object.keys(payload).length === 0) {
      onClose()
      return
    }
    setError(null)
    mutation.mutate(payload)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md rounded-[20px] border bg-card p-6 shadow-lg"
      >
        <h3 className="text-sm font-bold">Edit customer</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Update identity so phone calls and email tickets link to the same customer record.
        </p>

        {error && (
          <div className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
        )}

        <div className="mt-5 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="customer-email">Email</Label>
            <Input
              id="customer-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="customer-name">Name</Label>
            <Input
              id="customer-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="customer-phone">Phone</Label>
            <Input
              id="customer-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+90 5XX XXX XX XX"
            />
            <p className="text-xs text-muted-foreground">
              Turkish numbers will be normalised to +90 form on save.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </div>
  )
}
