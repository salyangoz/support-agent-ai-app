import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/context/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { LogOut, Building2, Plus, ArrowRight, ChevronLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const TR_MAP: Record<string, string> = {
  ç: 'c', Ç: 'c', ğ: 'g', Ğ: 'g', ı: 'i', İ: 'i',
  ö: 'o', Ö: 'o', ş: 's', Ş: 's', ü: 'u', Ü: 'u',
}

function toSlug(value: string) {
  return value
    .replace(/[çÇğĞıİöÖşŞüÜ]/g, (ch) => TR_MAP[ch] ?? ch)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function CreateTenantPage() {
  const { createTenant, logout, user } = useAuth()
  const navigate = useNavigate()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const tenants = user?.tenant_users ?? []

  const handleNameChange = (value: string) => {
    setName(value)
    if (!slugTouched) {
      setSlug(toSlug(value))
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const tenantId = await createTenant({ name, slug })
      navigate(`/t/${tenantId}`)
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(message ?? 'Failed to create company. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            <span className="text-brand-600">
              {showForm ? 'Create Company' : 'Support AI'}
            </span>
          </CardTitle>
          <CardDescription>
            {showForm
              ? 'Set up a new company to manage your AI support agent'
              : 'Select a company or create a new one'}
          </CardDescription>
        </CardHeader>

        {showForm ? (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Company Name</Label>
                <Input
                  id="name"
                  placeholder="Acme Inc"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">URL Identifier</Label>
                <Input
                  id="slug"
                  placeholder="acme"
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true)
                    setSlug(toSlug(e.target.value))
                  }}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Used in URLs and webhooks. Only lowercase letters, numbers, and hyphens.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-3">
              <Button type="submit" className="w-full" disabled={loading || !name || !slug}>
                {loading ? 'Creating...' : 'Create Company'}
              </Button>
              {tenants.length > 0 && (
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setError('') }}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Back to company list
                </button>
              )}
            </CardFooter>
          </form>
        ) : (
          <CardContent className="space-y-3">
            {tenants.map((tu) => (
              <Link
                key={tu.tenant_id}
                to={`/t/${tu.tenant_id}`}
                className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent"
              >
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{tu.tenant?.name ?? tu.tenant_id}</p>
                    <Badge variant="outline" className="mt-0.5 text-xs">
                      {tu.role}
                    </Badge>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}

            {tenants.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                You don't have any companies yet. Create one to get started.
              </p>
            )}

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowForm(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create New Company
            </Button>
          </CardContent>
        )}

        <div className="flex justify-center pb-6">
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out{user?.email ? ` (${user.email})` : ''}
          </button>
        </div>
      </Card>
    </div>
  )
}
