import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cva } from 'class-variance-authority';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

// Version-local sheet. Same look and behavior as the shadcn Sheet primitive,
// but JSDoc-typed so typecheck never has to reach into the untyped ui/ file.
// Sides are logical: `start`/`end` follow the content's `dir`, so in RTL
// `start` is the right edge (what ui/sheet calls side="right").

export const Sheet = DialogPrimitive.Root;

/**
 * @typedef {React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>} OverlayProps
 */

/** @type {React.ForwardRefExoticComponent<OverlayProps & React.RefAttributes<HTMLDivElement>>} */
const SheetOverlay = React.forwardRef(
  /** @param {OverlayProps} props @param {React.ForwardedRef<HTMLDivElement>} ref */
  ({ className, ...props }, ref) => (
    <DialogPrimitive.Overlay
      className={cn(
        'fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        className
      )}
      {...props}
      ref={ref}
    />
  )
);
SheetOverlay.displayName = 'SheetOverlay';

const sheetVariants = cva(
  'fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out',
  {
    variants: {
      side: {
        top: 'inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
        bottom:
          'inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
        start:
          'inset-y-0 start-0 h-full w-3/4 border-e sm:max-w-sm ltr:data-[state=closed]:slide-out-to-left ltr:data-[state=open]:slide-in-from-left rtl:data-[state=closed]:slide-out-to-right rtl:data-[state=open]:slide-in-from-right',
        end: 'inset-y-0 end-0 h-full w-3/4 border-s sm:max-w-sm ltr:data-[state=closed]:slide-out-to-right ltr:data-[state=open]:slide-in-from-right rtl:data-[state=closed]:slide-out-to-left rtl:data-[state=open]:slide-in-from-left',
      },
    },
    defaultVariants: {
      side: 'end',
    },
  }
);

/**
 * @typedef {React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
 *   side?: 'top' | 'bottom' | 'start' | 'end',
 * }} SheetContentProps
 */

/** @type {React.ForwardRefExoticComponent<SheetContentProps & React.RefAttributes<HTMLDivElement>>} */
export const SheetContent = React.forwardRef(
  /** @param {SheetContentProps} props @param {React.ForwardedRef<HTMLDivElement>} ref */
  ({ side = 'end', className, children, ...props }, ref) => (
    <DialogPrimitive.Portal>
      <SheetOverlay />
      <DialogPrimitive.Content ref={ref} className={cn(sheetVariants({ side }), className)} {...props}>
        <DialogPrimitive.Close className="absolute start-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
);
SheetContent.displayName = 'SheetContent';

/** @typedef {React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>} TitleProps */

/** @type {React.ForwardRefExoticComponent<TitleProps & React.RefAttributes<HTMLHeadingElement>>} */
export const SheetTitle = React.forwardRef(
  /** @param {TitleProps} props @param {React.ForwardedRef<HTMLHeadingElement>} ref */
  ({ className, ...props }, ref) => (
    <DialogPrimitive.Title ref={ref} className={cn('text-lg font-semibold text-foreground', className)} {...props} />
  )
);
SheetTitle.displayName = 'SheetTitle';

/** @typedef {React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>} DescriptionProps */

/** @type {React.ForwardRefExoticComponent<DescriptionProps & React.RefAttributes<HTMLParagraphElement>>} */
export const SheetDescription = React.forwardRef(
  /** @param {DescriptionProps} props @param {React.ForwardedRef<HTMLParagraphElement>} ref */
  ({ className, ...props }, ref) => (
    <DialogPrimitive.Description ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
  )
);
SheetDescription.displayName = 'SheetDescription';
