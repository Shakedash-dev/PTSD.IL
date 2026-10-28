import * as React from 'react';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLang } from '@/lib/LanguageContext';
import { getDir } from '@/lib/i18n';

// Version-local, typed copy of the shadcn sheet primitive (side "right" only,
// the one V3 uses). The shared primitive is excluded from typecheck but still
// checked when imported, and its forwardRef props are untyped.
// The panel is portaled out of the site root, so it sets dir itself, from the
// active language (he/ar rtl, others ltr) unless the caller passes `dir`. The
// logical start / border-e classes then pin it to the reading-start edge (right
// in RTL, left in LTR), and the slide animation follows that edge.

export const Sheet = SheetPrimitive.Root;
export const SheetTrigger = SheetPrimitive.Trigger;

/** @typedef {React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content> & { side?: 'right' }} SheetContentProps */
/** @typedef {React.ElementRef<typeof SheetPrimitive.Content>} SheetContentElement */

export const SheetContent = React.forwardRef(
  /** @type {React.ForwardRefRenderFunction<SheetContentElement, SheetContentProps>} */
  (({ side: _side = 'right', className, children, dir, ...props }, ref) => {
    const { lang } = useLang();
    return (
      <SheetPrimitive.Portal>
        <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <SheetPrimitive.Content
          ref={ref}
          dir={dir ?? getDir(lang)}
          className={cn(
            'fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out',
            'inset-y-0 start-0 h-full w-3/4 border-e rtl:data-[state=closed]:slide-out-to-right rtl:data-[state=open]:slide-in-from-right ltr:data-[state=closed]:slide-out-to-left ltr:data-[state=open]:slide-in-from-left sm:max-w-sm',
            className
          )}
          {...props}
        >
          <SheetPrimitive.Close className="absolute start-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
          {children}
        </SheetPrimitive.Content>
      </SheetPrimitive.Portal>
    );
  })
);
SheetContent.displayName = SheetPrimitive.Content.displayName;

/** @typedef {React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>} SheetTitleProps */

export const SheetTitle = React.forwardRef(
  /** @type {React.ForwardRefRenderFunction<React.ElementRef<typeof SheetPrimitive.Title>, SheetTitleProps>} */
  (({ className, ...props }, ref) => (
    <SheetPrimitive.Title ref={ref} className={cn('text-lg font-semibold text-foreground', className)} {...props} />
  ))
);
SheetTitle.displayName = SheetPrimitive.Title.displayName;

/** @typedef {React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>} SheetDescriptionProps */

export const SheetDescription = React.forwardRef(
  /** @type {React.ForwardRefRenderFunction<React.ElementRef<typeof SheetPrimitive.Description>, SheetDescriptionProps>} */
  (({ className, ...props }, ref) => (
    <SheetPrimitive.Description ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
  ))
);
SheetDescription.displayName = SheetPrimitive.Description.displayName;
