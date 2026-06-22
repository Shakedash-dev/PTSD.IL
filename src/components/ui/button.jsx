import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // Stadium-pill CTAs. Use with size="pill" / "pill-lg" / "pill-xl" for hero buttons.
        pill: "bg-primary text-primary-foreground rounded-full font-semibold shadow-atmospheric-md hover:bg-primary/90 hover:shadow-atmospheric-lg active:scale-[0.98] transition-all duration-300",
        "pill-outline": "border-2 border-foreground/15 bg-transparent text-foreground rounded-full font-semibold hover:bg-foreground/5 hover:border-foreground/30 active:scale-[0.98] transition-all duration-300",
        "pill-light": "bg-card text-foreground rounded-full font-semibold shadow-atmospheric hover:bg-muted hover:shadow-atmospheric-md active:scale-[0.98] transition-all duration-300",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
        // Pill sizes - taller and more generous padding for stadium look.
        pill: "h-11 px-7 rounded-full text-sm",
        "pill-lg": "h-14 px-9 rounded-full text-base",
        "pill-xl": "h-16 px-11 rounded-full text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    (<Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />)
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }
