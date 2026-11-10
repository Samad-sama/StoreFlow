/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar))',
          foreground: 'hsl(var(--sidebar-foreground))',
          border: 'hsl(var(--sidebar-border))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
        },
      },
      borderRadius: {
        '4xl': '2rem',    // 32px
        '3xl': '1.5rem',  // 24px - Apple modal & sheet
        '2xl': '1.125rem',// 18px - Apple card squircle
        xl: '0.875rem',   // 14px - Apple container / dialog
        lg: '0.625rem',   // 10px - Apple button / input
        md: '0.5rem',     // 8px - Apple pill / chip
        sm: '0.375rem',   // 6px
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Text"',
          '"SF Pro Display"',
          '"Plus Jakarta Sans"',
          'Inter',
          'system-ui',
          'sans-serif',
        ],
        arabic: [
          '"IBM Plex Sans Arabic"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Arabic"',
          'system-ui',
          'sans-serif',
        ],
      },
      boxShadow: {
        'xs': '0 1px 2px rgba(0, 0, 0, 0.04)',
        '2xs': '0 1px 1px rgba(0, 0, 0, 0.03)',
        'apple-xs': '0 1px 2px rgba(0, 0, 0, 0.03)',
        'apple-sm': '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
        'apple-card': '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 8px 24px -4px rgba(0, 0, 0, 0.04)',
        'apple-hover': '0 8px 30px -4px rgba(0, 0, 0, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.03)',
        'apple-modal': '0 24px 60px -12px rgba(0, 0, 0, 0.22), 0 8px 24px -4px rgba(0, 0, 0, 0.08)',
        'apple-sheet': '0 20px 48px -8px rgba(0, 0, 0, 0.16)',
      },
    },
  },
  plugins: [],
};
