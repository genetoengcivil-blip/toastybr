import { cva, type VariantProps } from 'class-variance-authority'

export const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default: 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-sm hover:bg-[hsl(var(--primary))]/90 hover:shadow',
        destructive: 'bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] shadow-sm hover:bg-[hsl(var(--destructive))]/90 hover:shadow',
        outline: 'border border-[hsl(var(--input))] bg-transparent hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))] hover:border-[hsl(var(--border))]/60',
        secondary: 'bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:bg-[hsl(var(--secondary))]/80',
        ghost: 'hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))]',
        link: 'text-[hsl(var(--primary))] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-9 rounded-md px-3.5',
        lg: 'h-11 rounded-lg px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export type ButtonVariants = VariantProps<typeof buttonVariants>

export const cardVariants = cva(
  'rounded-xl border bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))] transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'border-[hsl(var(--border))] shadow-sm hover:shadow-md',
        elevated: 'border-transparent shadow-md hover:shadow-lg',
        outline: 'border-[hsl(var(--border))] shadow-none',
        ghost: 'border-transparent shadow-none bg-transparent',
        interactive: 'border-[hsl(var(--border))] shadow-sm hover:border-[hsl(var(--primary))]/30 hover:shadow-md cursor-pointer',
      },
      padding: {
        default: 'p-6',
        sm: 'p-4',
        lg: 'p-8',
        none: 'p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'default',
    },
  }
)

export type CardVariants = VariantProps<typeof cardVariants>

export const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]',
        secondary: 'border-transparent bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]',
        destructive: 'border-transparent bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))]',
        outline: 'text-[hsl(var(--foreground))] border-[hsl(var(--border))]',
        success: 'border-transparent bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]',
        warning: 'border-transparent bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))]',
        info: 'border-transparent bg-[hsl(var(--info))]/15 text-[hsl(var(--info))]',
        muted: 'border-transparent bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export type BadgeVariants = VariantProps<typeof badgeVariants>


