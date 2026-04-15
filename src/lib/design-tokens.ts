/**
 * Design token system for the support AI agent dashboard.
 *
 * All visual constants live here. Components consume tokens via
 * Tailwind theme variables (defined in index.css) or by importing
 * this module directly for JS-side values (charts, dynamic styles).
 *
 * To rebrand or white-label, update the tokens here and in index.css.
 */

export const tokens = {
  colors: {
    brand: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
      950: '#022c22',
    },
    semantic: {
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
    state: {
      open: '#3b82f6',
      pending: '#f59e0b',
      resolved: '#22c55e',
      closed: '#6b7280',
    },
    draft: {
      pending: '#f59e0b',
      approved: '#22c55e',
      rejected: '#ef4444',
      sent: '#3b82f6',
    },
    role: {
      owner: '#8b5cf6',
      admin: '#3b82f6',
      member: '#6b7280',
    },
    app: {
      intercom: '#1f8ded',
      zendesk: '#03363d',
      slack: '#4a154b',
      github: '#24292e',
      notion: '#000000',
    },
  },

  spacing: {
    page: { x: '1.5rem', y: '1.5rem' },
    card: { x: '1.5rem', y: '1.25rem' },
    section: '2rem',
  },

  radius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },

  typography: {
    fontFamily: {
      sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      mono: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, monospace",
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },

  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  },

  animation: {
    duration: {
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
    },
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },

  layout: {
    sidebar: { width: '16rem', collapsedWidth: '4rem' },
    header: { height: '4rem' },
    maxContentWidth: '80rem',
  },
} as const

export type DesignTokens = typeof tokens
