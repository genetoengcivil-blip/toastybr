import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const skeletonVariants = cva('animate-pulse rounded-md bg-[hsl(var(--muted))]', {
  variants: {
    variant: {
      default: '',
      text: 'h-4',
      title: 'h-8',
      avatar: 'rounded-full',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof skeletonVariants> {}

function Skeleton({ className, variant, ...props }: SkeletonProps) {
  return <div className={cn(skeletonVariants({ variant }), className)} {...props} />
}

export { Skeleton }
