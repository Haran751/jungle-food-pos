'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

const Dialog = React.forwardRef<
  React.ElementRef<'div'>,
  React.ComponentPropsWithoutRef<'div'> & { open?: boolean; onOpenChange?: (open: boolean) => void }
>(({ open, onOpenChange, className, children, ...props }, ref) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/60" onClick={() => onOpenChange?.(false)} />
      <div
        ref={ref}
        className={cn(
          'fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 bg-card rounded-lg shadow-xl p-6',
          className
        )}
        {...props}
      >
        {children}
      </div>
    </div>
  );
});
Dialog.displayName = 'Dialog';

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('mb-4', className)} {...props} />
);
DialogHeader.displayName = 'DialogHeader';

const DialogTitle = React.forwardRef<
  React.ElementRef<'h2'>,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2 ref={ref} className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props} />
));
DialogTitle.displayName = 'DialogTitle';

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex justify-end gap-2 mt-6', className)} {...props} />
);
DialogFooter.displayName = 'DialogFooter';

const DialogContent = Dialog;

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter };