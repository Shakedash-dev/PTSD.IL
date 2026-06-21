/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./index.html", "./!(node_modules)/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        super: '2rem',
        'super-sm': '1.25rem',
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        sanctuary: {
          DEFAULT: 'hsl(var(--sanctuary))',
          foreground: 'hsl(var(--sanctuary-foreground))',
        },
        teal: {
          DEFAULT: '#608A7B',
          light: '#7AA090',
          dark: '#4D7063',
        },
        clay: {
          DEFAULT: '#608A7B',
          light: '#7AA090',
          dark: '#4D7063',
        },
        sage: {
          DEFAULT: '#608A7B',
          deep: '#4D7063',
        },
        oatmeal: '#FAF2EB',
        midnight: '#1A3336',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))'
        }
      },
      fontFamily: {
        heading: ['var(--font-heading)'],
        body: ['var(--font-body)'],
        display: ['var(--font-display)'],
        mono: ['var(--font-mono)'],
        heebo: ['Heebo', 'sans-serif'],
      },
      fontSize: {
        'base': ['1rem', { lineHeight: '1.75' }],
        'lg': ['1.125rem', { lineHeight: '1.75' }],
        'xl': ['1.25rem', { lineHeight: '1.6' }],
        '2xl': ['1.5rem', { lineHeight: '1.4' }],
        '3xl': ['1.875rem', { lineHeight: '1.3' }],
        '4xl': ['2.25rem', { lineHeight: '1.2' }],
        '5xl': ['3rem', { lineHeight: '1.15' }],
      },
      boxShadow: {
        'atmospheric': '0 1px 2px rgba(0, 0, 0, 0.01)',
        'atmospheric-md': '0 1px 3px rgba(0, 0, 0, 0.02)',
        'atmospheric-lg': '0 1px 3px rgba(0, 0, 0, 0.02)',
        'card': '0 1px 2px rgba(0, 0, 0, 0.01)',
        'card-hover': '0 1px 3px rgba(0, 0, 0, 0.02)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        },
        'breathe': {
          '0%': { transform: 'scale(0.6)' },
          '50%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(0.6)' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-gentle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'breathe': 'breathe 8s ease-in-out infinite',
        'fade-in': 'fade-in 0.5s ease-out forwards',
        'pulse-gentle': 'pulse-gentle 2s ease-in-out infinite',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      lineHeight: {
        'relaxed': '1.75',
        'loose': '2',
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
}
