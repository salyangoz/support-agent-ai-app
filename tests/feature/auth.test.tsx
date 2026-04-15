import { describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, seedAuth } from '../render'
import LoginPage from '@/pages/auth/login'
import RegisterPage from '@/pages/auth/register'

describe('Login', () => {
  it('renders the login form', () => {
    renderWithProviders(<LoginPage />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('shows error on invalid credentials', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />)

    await user.type(screen.getByLabelText(/email/i), 'wrong@test.com')
    await user.type(screen.getByLabelText(/password/i), 'wrongpass')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument()
    })
  })

  it('logs in successfully with valid credentials', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />)

    await user.type(screen.getByLabelText(/email/i), 'admin@test.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      const tokens = localStorage.getItem('tokens')
      expect(tokens).toBeTruthy()
      expect(JSON.parse(tokens!).access_token).toBe('test_access_token')
    })
  })

  it('shows a link to register page', () => {
    renderWithProviders(<LoginPage />)
    expect(screen.getByRole('link', { name: /register/i })).toHaveAttribute('href', '/register')
  })

  it('disables button while submitting', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />)

    await user.type(screen.getByLabelText(/email/i), 'admin@test.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')

    const btn = screen.getByRole('button', { name: /sign in/i })
    await user.click(btn)

    await waitFor(() => {
      expect(localStorage.getItem('tokens')).toBeTruthy()
    })
  })
})

describe('Register', () => {
  it('renders the registration form with name, email, and password', () => {
    renderWithProviders(<RegisterPage />)
    expect(screen.getByLabelText(/^name$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('does not have a company/tenant name field', () => {
    renderWithProviders(<RegisterPage />)
    expect(screen.queryByLabelText(/company name/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/tenant/i)).not.toBeInTheDocument()
  })

  it('shows error when email already exists', async () => {
    const user = userEvent.setup()
    renderWithProviders(<RegisterPage />)

    await user.type(screen.getByLabelText(/^name$/i), 'John')
    await user.type(screen.getByLabelText(/email/i), 'existing@test.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(screen.getByText(/email is already registered/i)).toBeInTheDocument()
    })
  })

  it('registers and receives tokens directly (no separate login)', async () => {
    const user = userEvent.setup()
    renderWithProviders(<RegisterPage />)

    await user.type(screen.getByLabelText(/^name$/i), 'Jane')
    await user.type(screen.getByLabelText(/email/i), 'new@test.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      const tokens = localStorage.getItem('tokens')
      expect(tokens).toBeTruthy()
      expect(JSON.parse(tokens!).access_token).toBe('test_access_token')
    })
  })

  it('shows a link to login page', () => {
    renderWithProviders(<RegisterPage />)
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/login')
  })

  it('requires min 8 char password via HTML validation', () => {
    renderWithProviders(<RegisterPage />)
    const passwordInput = screen.getByLabelText(/password/i)
    expect(passwordInput).toHaveAttribute('minLength', '8')
  })
})

describe('Auth Guard', () => {
  it('redirects to login when not authenticated', () => {
    renderWithProviders(<LoginPage />)
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('stores tokens and tenant ID on successful login', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />)

    await user.type(screen.getByLabelText(/email/i), 'admin@test.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(localStorage.getItem('tokens')).toBeTruthy()
      expect(localStorage.getItem('activeTenantId')).toBeTruthy()
    })
  })
})
