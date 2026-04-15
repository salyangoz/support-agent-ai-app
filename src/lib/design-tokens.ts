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
      50: '#e8f8ff',
      100: '#bbd3de',
      200: '#8eb8cc',
      300: '#5e9ab8',
      400: '#2e7da5',
      500: '#096fa0',
      600: '#085479',
      700: '#063f5a',
      800: '#042a3c',
      900: '#14252f',
      950: '#0a1318',
    },
    semantic: {
      success: '#379595',
      warning: '#f27411',
      error: '#c7353a',
      info: '#096fa0',
    },
    state: {
      open: '#096fa0',
      pending: '#f27411',
      resolved: '#379595',
      closed: '#787878',
    },
    draft: {
      pending: '#f27411',
      approved: '#379595',
      rejected: '#c7353a',
      sent: '#096fa0',
    },
    role: {
      owner: '#096fa0',
      admin: '#f58e3d',
      member: '#787878',
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
