'use client';

import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import {
  UtensilsCrossed,
  Moon,
  Sun,
  LogOut,
  LayoutDashboard,
  ShoppingCart,
  Package,
  FileBarChart,
  ClipboardList,
  Users,
} from 'lucide-react';
import { useTheme } from 'next-themes';

export default function Navbar() {
  const { user, logout, currentPage, setPage } = useStore();
  const { theme, setTheme } = useTheme();
  const mounted = typeof window !== 'undefined';

  if (!user) return null;

  const isAdmin = user.role === 'ADMIN';

  const navItems = isAdmin
    ? [
        { id: 'admin-dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
        { id: 'products' as const, label: 'Kelola Barang', icon: Package },
        { id: 'user-management' as const, label: 'Kelola User', icon: Users },
        { id: 'stock-report' as const, label: 'Laporan Stok', icon: ClipboardList },
        { id: 'sales-report' as const, label: 'Laporan Penjualan', icon: FileBarChart },
      ]
    : [
        { id: 'cashier-dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
        { id: 'transaction' as const, label: 'Transaksi', icon: ShoppingCart },
      ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-emerald-600 dark:bg-emerald-800 text-white shadow-lg">
        <div className="flex items-center justify-between px-3 sm:px-4 lg:px-6 h-12 sm:h-14">
          <div className="flex items-center gap-2 sm:gap-3">
            <UtensilsCrossed className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="font-bold text-xs sm:text-sm lg:text-base">Jungle Food POS</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            {mounted && theme && (
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-emerald-700 h-8 w-8 sm:h-9 sm:w-9"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-red-600 h-8 w-8 sm:h-9 sm:w-9"
              onClick={logout}
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop Sidebar - langsung nempel kiri, tanpa hamburger */}
        <aside className="hidden lg:block lg:sticky lg:top-14 h-[calc(100vh-3.5rem)] w-56 bg-card border-r border-border shadow-lg overflow-y-auto shrink-0">
          <nav className="p-3 space-y-1 mt-2">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant={currentPage === item.id ? 'default' : 'ghost'}
                className={`w-full justify-start gap-3 h-10 ${
                  currentPage === item.id
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'hover:bg-emerald-50 dark:hover:bg-emerald-950'
                }`}
                onClick={() => setPage(item.id)}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-x-hidden pb-20 lg:pb-6">
          <div className="max-w-6xl mx-auto">
            <PageContent />
          </div>
        </main>
      </div>

      {/* Bottom Navigation Bar - mobile/tablet only */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-card/95 dark:bg-card/95 backdrop-blur-md border-t border-border shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
        <div className="flex items-center justify-around h-16 px-1">
          {navItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={`
                  flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-lg
                  transition-all duration-200 min-w-0
                  ${isActive
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-gray-500 dark:text-gray-400 active:text-emerald-600 dark:active:text-emerald-400'
                  }
                `}
              >
                <div className={`p-1 rounded-full transition-all duration-200 ${isActive ? 'bg-emerald-100 dark:bg-emerald-900/50 scale-110' : ''}`}>
                  <item.icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
                </div>
                <span className={`text-[10px] leading-tight truncate w-full text-center ${isActive ? 'font-semibold' : 'font-medium'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function PageContent() {
  const { currentPage } = useStore();

  switch (currentPage) {
    case 'admin-dashboard':
      return <AdminDashboard />;
    case 'cashier-dashboard':
      return <CashierDashboard />;
    case 'products':
      return <ProductManagement />;
    case 'transaction':
      return <TransactionPage />;
    case 'stock-report':
      return <StockReport />;
    case 'sales-report':
      return <SalesReport />;
    case 'user-management':
      return <UserManagement />;
    default:
      return null;
  }
}

import AdminDashboard from './AdminDashboard';
import CashierDashboard from './CashierDashboard';
import ProductManagement from './ProductManagement';
import TransactionPage from './TransactionPage';
import StockReport from './StockReport';
import SalesReport from './SalesReport';
import UserManagement from './UserManagement';