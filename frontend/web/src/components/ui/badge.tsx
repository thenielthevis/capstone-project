import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent text-white hover:opacity-90",
        secondary: "border-transparent text-white hover:opacity-90",
        destructive: "border-transparent text-white hover:opacity-90",
        outline: "border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, style, ...props }: BadgeProps) {
  const getVariantStyle = () => {
    const baseStyle = style || {};
    switch (variant) {
      case 'default':
        return { ...baseStyle, backgroundColor: 'var(--color-primary-base)', color: '#FFFFFF' };
      case 'secondary':
        return { ...baseStyle, backgroundColor: 'var(--color-secondary-base)', color: '#FFFFFF' };
      case 'destructive':
        return { ...baseStyle, backgroundColor: 'var(--color-error-base)', color: '#FFFFFF' };
      case 'outline':
        return { ...baseStyle, borderColor: 'var(--color-border-base)', color: 'var(--color-text-primary)' };
      default:
        return baseStyle;
    }
  };

  return (
    <div 
      className={cn(badgeVariants({ variant }), className)} 
      style={getVariantStyle()}
      {...props} 
    />
  )
}

export { Badge, badgeVariants }
