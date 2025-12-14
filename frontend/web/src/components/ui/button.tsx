import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "text-white hover:opacity-90",
        destructive: "text-white hover:opacity-90",
        outline: "border hover:opacity-90",
        secondary: "text-white hover:opacity-90",
        ghost: "hover:opacity-80",
        link: "underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, style, ...props }, ref) => {
    const getVariantStyle = () => {
      const baseStyle = style || {};
      switch (variant) {
        case 'default':
          return { ...baseStyle, backgroundColor: 'var(--color-primary-base)', color: '#FFFFFF' };
        case 'destructive':
          return { ...baseStyle, backgroundColor: 'var(--color-error-base)', color: '#FFFFFF' };
        case 'outline':
          return { ...baseStyle, borderColor: 'var(--color-border-base)', backgroundColor: 'var(--color-background)', color: 'var(--color-text-primary)' };
        case 'secondary':
          return { ...baseStyle, backgroundColor: 'var(--color-secondary-base)', color: '#FFFFFF' };
        case 'ghost':
          return { ...baseStyle, backgroundColor: 'transparent', color: 'var(--color-text-primary)' };
        case 'link':
          return { ...baseStyle, backgroundColor: 'transparent', color: 'var(--color-primary-base)' };
        default:
          return baseStyle;
      }
    };

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        style={getVariantStyle()}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
