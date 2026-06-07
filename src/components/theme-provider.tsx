'use client';

import * as React from 'react';

type ThemeProviderProps = React.ComponentProps<typeof ThemeProviderInner>;

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <ThemeProviderInner {...props}>{children}</ThemeProviderInner>;
}

import { ThemeProvider as NextThemesProvider } from 'next-themes';

function ThemeProviderInner({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
