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
        // Soft sage pill — light pastel green on dark backgrounds. Hover deepens
        // to the brand primary green for a tactile, "comes alive" feel.
        "pill-green": "bg-muted text-foreground rounded-full font-semibold shadow-atmospheric-md hover:bg-primary hover:text-primary-foreground hover:shadow-atmospheric-lg active:scale-[0.98] transition-all duration-300",
        // Solid primary action. Its disabled treatment is the site convention -
        // muted rather than the base 50% opacity, so "you cannot press this yet"
        // reads clearly (the questionnaire's calculate button depends on it).
        solid:
          "bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors duration-300 disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100 disabled:cursor-not-allowed",
        // Solid primary that also lifts. For the single main action on a screen.
        elevated:
          "bg-primary text-primary-foreground font-medium shadow-atmospheric-md hover:bg-primary/90 hover:shadow-atmospheric-lg transition-all duration-300 disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100 disabled:shadow-none disabled:cursor-not-allowed",
        // Status actions. The tokens existed but had no variant, so call sites
        // were hand-writing bg-success/bg-warning with their own hover states.
        success:
          "bg-success text-success-foreground font-medium hover:bg-success/90 transition-colors duration-300",
        warning:
          "bg-warning text-warning-foreground font-medium hover:bg-warning/90 transition-colors duration-300",
        // Secondary action sitting next to a solid one.
        subtle:
          "bg-muted text-foreground font-medium hover:bg-muted/80 transition-colors duration-300",
        // Bordered control on a light surface, hovering to muted rather than to
        // the brand accent. The admin panel's icon and cancel controls.
        "outline-subtle":
          "border border-border bg-transparent hover:bg-muted transition-colors duration-300",
        // "Add another one" affordance.
        dashed:
          "border border-dashed border-primary/40 bg-transparent text-primary hover:bg-primary/5 transition-colors duration-300",
        // Low-emphasis text control. Reads as text until hovered.
        quiet:
          "text-muted-foreground hover:text-foreground transition-colors duration-300",
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
        // Height-free sizes: the content sets the height. Use for multi-line
        // controls, where a fixed h-* would clip.
        none: "",
        xs: "px-3 py-1.5 text-xs",
        roomy: "px-7 py-3 text-sm",
        "roomy-lg": "px-8 py-3.5 text-lg",
        "roomy-xl": "px-8 py-4 text-lg",
        cta: "px-10 py-4 text-lg",
      },
      // Radius is its own axis so a variant does not have to be duplicated per
      // corner treatment. The base class sets rounded-md; this overrides it.
      radius: {
        md: "rounded-md",
        xl: "rounded-xl",
        super: "rounded-super",
        full: "rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(
  /**
   * @param {React.ButtonHTMLAttributes<HTMLButtonElement> & import("class-variance-authority").VariantProps<typeof buttonVariants> & { asChild?: boolean }} props
   * @param {React.Ref<HTMLButtonElement>} ref
   */
  ({ className, variant, size, radius, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    (<Comp
      className={cn(buttonVariants({ variant, size, radius, className }))}
      ref={ref}
      {...props} />)
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }
