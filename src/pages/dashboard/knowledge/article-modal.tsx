import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import api from '@/lib/api'
import type { KnowledgeArticle } from '@/types/api'

interface Props {
  article: KnowledgeArticle | null
  tenantId: string
  onClose: () => void
}

export default function KnowledgeArticleModal({ article, tenantId, onClose }: Props) {
  const queryClient = useQueryClient()
  const isEdit = !!article

  const [form, setForm] = useState({
    title: article?.title ?? '',
    content: article?.content ?? '',
    category: article?.category ?? '',
    is_active: article?.is_active ?? true,
  })
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      isEdit
        ? api.put(`/tenants/${tenantId}/knowledge-articles/${article.id}`, data)
        : api.post(`/tenants/${tenantId}/knowledge-articles`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-articles', tenantId] })
      onClose()
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(message ?? 'Failed to save article')
    },
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    mutation.mutate({
      title: form.title,
      content: form.content,
      category: form.category || null,
      is_active: form.is_active,
    })
  }

  const update = (field: string, value: unknown) => setForm((f) => ({ ...f, [field]: value }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl rounded-lg border bg-background p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold">{isEdit ? 'Edit Article' : 'New Article'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={form.title} onChange={(e) => update('title', e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input id="category" value={form.category} onChange={(e) => update('category', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              className="min-h-[200px]"
              value={form.content}
              onChange={(e) => update('content', e.target.value)}
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active}
              onChange={(e) => update('is_active', e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="is_active">Active</Label>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : isEdit ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
