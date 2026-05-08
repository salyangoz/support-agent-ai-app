import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { PageHeader } from '@/components/layout/page-header'
import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/context/auth-context'
import api from '@/lib/api'
import type { User } from '@/types/api'

export default function AccountPage() {
  const { user, isLoading, refreshUser } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') ?? 'profile'
  const setTab = (value: string) => setSearchParams({ tab: value }, { replace: true })

  if (isLoading) return <div className="flex justify-center p-12"><Spinner /></div>
  if (!user) return null

  return (
    <div>
      <PageHeader
        title="Your account"
        description="Personal info and password — these settings only affect you."
      />

      <Tabs value={tab} onValueChange={setTab} className="max-w-2xl">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileCard user={user} onUpdated={refreshUser} />
        </TabsContent>
        <TabsContent value="password">
          <PasswordCard />
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface ProfileCardProps {
  user: User
  onUpdated: () => Promise<string | null>
}

function ProfileCard({ user, onUpdated }: ProfileCardProps) {
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const mutation = useMutation({
    mutationFn: async (payload: { name?: string; email?: string }) => {
      const { data } = await api.patch<User>('/auth/me', payload)
      return data
    },
    onSuccess: async () => {
      setError(null)
      setSuccess(true)
      await onUpdated()
      setTimeout(() => setSuccess(false), 3000)
    },
    onError: (err: unknown) => {
      const status = (err as { response?: { status?: number; data?: { error?: string } } })?.response?.status
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      if (status === 409) {
        setError(message ?? 'This email is already used by another account.')
      } else {
        setError(message ?? 'Failed to update profile.')
      }
    },
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setSuccess(false)
    const payload: { name?: string; email?: string } = {}
    if (name.trim() !== user.name) payload.name = name.trim()
    if (email.trim().toLowerCase() !== user.email) payload.email = email.trim()
    if (Object.keys(payload).length === 0) return
    mutation.mutate(payload)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-b-[20px] border border-t-0 bg-card p-5 space-y-4"
    >
      <div>
        <h2 className="text-sm font-semibold">Profile</h2>
        <p className="mt-0.5 text-[12px] text-muted-foreground">Your name and email shown across the dashboard.</p>
      </div>

      {success && (
        <div className="rounded-md bg-success/10 p-3 text-sm text-success">Profile updated.</div>
      )}
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      <div className="space-y-2">
        <Label htmlFor="account-name">Name</Label>
        <Input id="account-name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="account-email">Email</Label>
        <Input id="account-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <p className="text-xs text-muted-foreground">You will use the new email to log in.</p>
      </div>

      <div className="pt-1">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving...' : 'Save profile'}
        </Button>
      </div>
    </form>
  )
}

function PasswordCard() {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const mutation = useMutation({
    mutationFn: async (payload: { old_password: string; new_password: string }) => {
      const { data } = await api.post<{ message: string }>('/auth/change-password', payload)
      return data
    },
    onSuccess: () => {
      setError(null)
      setSuccess(true)
      setOldPassword('')
      setNewPassword('')
      setConfirm('')
      setTimeout(() => setSuccess(false), 3000)
    },
    onError: (err: unknown) => {
      const status = (err as { response?: { status?: number } })?.response?.status
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      if (status === 401) {
        setError(message ?? 'Current password is incorrect.')
      } else if (status === 400) {
        setError(message ?? 'Invalid password.')
      } else {
        setError(message ?? 'Failed to change password.')
      }
    },
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setSuccess(false)
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirm) {
      setError('New password and confirmation do not match.')
      return
    }
    setError(null)
    mutation.mutate({ old_password: oldPassword, new_password: newPassword })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-b-[20px] border border-t-0 bg-card p-5 space-y-4"
    >
      <div>
        <h2 className="text-sm font-semibold">Password</h2>
        <p className="mt-0.5 text-[12px] text-muted-foreground">Choose a password unique to this account, at least 8 characters.</p>
      </div>

      {success && (
        <div className="rounded-md bg-success/10 p-3 text-sm text-success">Password changed.</div>
      )}
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      <div className="space-y-2">
        <Label htmlFor="old-password">Current password</Label>
        <Input
          id="old-password"
          type="password"
          autoComplete="current-password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="new-password">New password</Label>
        <Input
          id="new-password"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={8}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm new password</Label>
        <Input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={8}
        />
      </div>

      <div className="pt-1">
        <Button
          type="submit"
          disabled={
            mutation.isPending ||
            !oldPassword ||
            !newPassword ||
            !confirm
          }
        >
          {mutation.isPending ? 'Saving...' : 'Change password'}
        </Button>
      </div>
    </form>
  )
}
