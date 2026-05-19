import { AxiosError } from 'axios'

// Pulls a user-readable message out of an unknown error, preferring the
// backend's JSON body ({ error: '...' } or { message: '...' }) over axios's
// generic "Request failed with status code 500" so toasts show what actually
// went wrong, not just the status.
export function extractErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const data = (err as AxiosError<{ error?: string; message?: string }>).response?.data
    if (data?.error) return data.error
    if (data?.message) return data.message
  }
  if (err instanceof Error && err.message && !/^Request failed with status code/i.test(err.message)) {
    return err.message
  }
  return fallback
}
