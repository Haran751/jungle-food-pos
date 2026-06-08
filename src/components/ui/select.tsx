'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

const Select = React.forwardRef<
  React.ElementRef<'select'>,
  React.ComponentPropsWithoutRef<'select'> & { onValueChange?: (value: string) => void }
>(({ onValueChange, className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2',
      className
    )}
    onChange={(e) => onValueChange?.(e.target.value)}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = 'Select';

const SelectTrigger = Select;
const SelectValue = () => null;

const SelectItem = React.forwardRef<
  React.ElementRef<'option'>,
  React.ComponentPropsWithoutRef<'option'>
>(({ ...props }, ref) => <option ref={ref} {...props} />);
SelectItem.displayName = 'SelectItem';

const SelectContent = ({ children }: { children: React.ReactNode }) => <>{children}</>;

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };