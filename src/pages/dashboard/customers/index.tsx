import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { Pencil, Download, Upload } from 'lucide-react'
import { read, utils, writeFile } from 'xlsx'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/layout/page-header'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import { extractErrorMessage } from '@/lib/error-message'
import api from '@/lib/api'
import type { Customer, PaginatedResponse } from '@/types/api'

interface BulkImportRow {
  id?: string | null
  external_id?: string | null
  email?: string | null
  name?: string | null
  phone?: string | null
}

interface BulkImportResult {
  created: number
  updated: number
  errors: Array<{ row: number; message: string }>
}

const EXPORT_PAGE_SIZE = 500

// Find a value in a row by trying multiple column names (case-insensitive).
// Lets users keep their own column headers in Turkish/English variants.
function pickField(row: Record<string, unknown>, candidates: string[]): string {
  const normalized = new Map<string, unknown>()
  for (const [k, v] of Object.entries(row)) {
    normalized.set(k.trim().toLowerCase(), v)
  }
  for (const key of candidates) {
    const v = normalized.get(key.toLowerCase())
    if (v !== undefined && v !== null && String(v).trim() !== '') {
      return String(v).trim()
    }
  }
  return ''
}

export default function CustomersPage() {
  const { tenantId } = useParams()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['customers', tenantId, search, page],
    queryFn: () =>
      api
        .get<PaginatedResponse<Customer>>(`/tenants/${tenantId}/customers`, {
          params: { page, limit: 20, ...(search && { email: search }) },
        })
        .then((r) => r.data),
  })

  const importMutation = useMutation({
    mutationFn: (rows: BulkImportRow[]) =>
      api
        .post<BulkImportResult>(`/tenants/${tenantId}/customers/bulk`, { customers: rows })
        .then((r) => r.data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['customers', tenantId] })
      const errLabel = result.errors.length ? `, ${result.errors.length} errors` : ''
      const variant = result.errors.length > 0 ? 'info' : 'success'
      toast(`Imported ${result.created} new, ${result.updated} updated${errLabel}`, variant)
      if (result.errors.length) {
        const sample = result.errors.slice(0, 3).map((e) => `row ${e.row}: ${e.message}`).join(' · ')
        toast(`Failed rows — ${sample}${result.errors.length > 3 ? ' …' : ''}`, 'error')
      }
    },
    onError: (err) => toast(extractErrorMessage(err, 'Import failed'), 'error'),
  })

  const handleExport = async () => {
    if (!tenantId) return
    setIsExporting(true)
    try {
      const all: Customer[] = []
      for (let p = 1; ; p++) {
        const { data: pageData } = await api.get<PaginatedResponse<Customer>>(
          `/tenants/${tenantId}/customers`,
          { params: { page: p, limit: EXPORT_PAGE_SIZE } },
        )
        all.push(...pageData.data)
        if (pageData.data.length < EXPORT_PAGE_SIZE) break
      }
      if (!all.length) {
        toast('No customers to export', 'info')
        return
      }
      const rows = all.map((c) => ({
        id: c.id,
        external_id: c.external_id ?? '',
        name: c.name ?? '',
        email: c.email ?? '',
        phone: c.phone ?? '',
      }))
      const ws = utils.json_to_sheet(rows, { header: ['id', 'external_id', 'name', 'email', 'phone'] })
      const wb = utils.book_new()
      utils.book_append_sheet(wb, ws, 'Customers')
      const stamp = new Date().toISOString().slice(0, 10)
      writeFile(wb, `customers-${stamp}.xlsx`)
    } catch (err) {
      toast(extractErrorMessage(err, 'Export failed'), 'error')
    } finally {
      setIsExporting(false)
    }
  }

  const handleImportFile = async (file: File) => {
    try {
      const buf = await file.arrayBuffer()
      const wb = read(buf, { type: 'array' })
      const sheet = wb.Sheets[wb.SheetNames[0]]
      if (!sheet) {
        toast('No sheet found in file', 'error')
        return
      }
      const rawRows = utils.sheet_to_json<Record<string, unknown>>(sheet, { raw: false, defval: '' })
      if (!rawRows.length) {
        toast('Spreadsheet is empty', 'info')
        return
      }
      const rows: BulkImportRow[] = rawRows.map((r) => ({
        id: pickField(r, ['id']) || null,
        external_id: pickField(r, ['external_id', 'externalId']) || null,
        email: pickField(r, ['email', 'e-mail', 'eposta']) || null,
        name: pickField(r, ['name', 'isim', 'ad soyad', 'fullname']) || null,
        phone: pickField(r, ['phone', 'mobile', 'telefon', 'gsm']) || null,
      }))
      importMutation.mutate(rows)
    } catch (err) {
      toast(extractErrorMessage(err, 'Could not read spreadsheet'), 'error')
    }
  }

  return (
    <div>
      <PageHeader
        title="Customers"
        description="View customers from your connected support apps"
        actions={
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleImportFile(file)
                e.target.value = ''
              }}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={importMutation.isPending}
            >
              <Upload className="mr-2 h-4 w-4" />
              {importMutation.isPending ? 'Importing…' : 'Import'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting}>
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? 'Exporting…' : 'Export'}
            </Button>
          </div>
        }
      />
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
