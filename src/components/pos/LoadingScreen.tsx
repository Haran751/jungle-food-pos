'use client';

import { UtensilsCrossed } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-lime-50 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950">
      <div className="text-center space-y-6">
        <div className="mx-auto w-20 h-20 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200 dark:shadow-emerald-900 animate-bounce">
          <UtensilsCrossed className="w-10 h-10 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">
            Stand Kantin &ldquo;Jungle Food&rdquo;
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sistem Point of Sale
          </p>
        </div>
        <div className="w-48 mx-auto">
          <div className="h-1.5 bg-emerald-100 dark:bg-emerald-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full animate-pulse"
              style={{ width: '60%' }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2 animate-pulse">
            Mempersiapkan aplikasi...
          </p>
        </div>
      </div>
    </div>
  );
}