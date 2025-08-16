import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
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
					glow: 'hsl(var(--primary-glow))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				annotation: {
					high: 'hsl(var(--annotation-high))',
					medium: 'hsl(var(--annotation-medium))',
					neutral: 'hsl(var(--annotation-neutral))',
					low: 'hsl(var(--annotation-low))',
					none: 'hsl(var(--annotation-none))',
					'high-bg': 'hsl(var(--annotation-high-bg))',
					'medium-bg': 'hsl(var(--annotation-medium-bg))',
					'neutral-bg': 'hsl(var(--annotation-neutral-bg))',
					'low-bg': 'hsl(var(--annotation-low-bg))',
					'high-hover': 'hsl(var(--annotation-high-hover))',
					'medium-hover': 'hsl(var(--annotation-medium-hover))',
					'neutral-hover': 'hsl(var(--annotation-neutral-hover))',
					'low-hover': 'hsl(var(--annotation-low-hover))'
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
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'pulse-glow': {
					'0%, 100%': { filter: 'drop-shadow(0 0 8px currentColor)' },
					'50%': { filter: 'drop-shadow(0 0 16px currentColor)' }
				},
				'bounce-in': {
					'0%': { transform: 'scale(0.3) translateY(20px)', opacity: '0' },
					'50%': { transform: 'scale(1.05) translateY(-5px)', opacity: '0.8' },
					'100%': { transform: 'scale(1) translateY(0)', opacity: '1' }
				},
				'gesture-feedback': {
					'0%': { transform: 'scale(1)', filter: 'brightness(1)' },
					'50%': { transform: 'scale(1.1)', filter: 'brightness(1.2)' },
					'100%': { transform: 'scale(1)', filter: 'brightness(1)' }
				},
				'shine': {
					'0%': { backgroundPosition: '-100% 0' },
					'100%': { backgroundPosition: '100% 0' }
				},
				'fade-out-trail': {
					'0%': { opacity: '0.8', transform: 'scale(1)' },
					'100%': { opacity: '0', transform: 'scale(0.5)' }
				},
				'float-up': {
					'0%': { transform: 'translateY(20px) scale(0.8)', opacity: '0' },
					'100%': { transform: 'translateY(0) scale(1)', opacity: '1' }
				},
				'pulse-size': {
					'0%': { transform: 'scale(0.8)' },
					'100%': { transform: 'scale(1)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
				'bounce-in': 'bounce-in 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
				'gesture-feedback': 'gesture-feedback 0.6s ease-out',
				'shine': 'shine 1s ease-out',
				'fade-out-trail': 'fade-out-trail 1s ease-out forwards',
				'float-up': 'float-up 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
				'pulse-size': 'pulse-size 0.3s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
