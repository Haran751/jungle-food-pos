'use client';

import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
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
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout, currentPage, setPage } = useStore();
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const mounted = typeof window !== 'undefined';

  if (!user) return null;

  const isAdmin = user.role === 'ADMIN';

  const navItems = isAdmin
    ? [
        { id: 'admin-dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
        { id: 'products' as const, label: 'Kelola Barang', icon: Package },
        { id: 'transaction' as const, label: 'Transaksi', icon: ShoppingCart },
        { id: 'stock-report' as const, label: 'Laporan Stok', icon: ClipboardList },
        { id: 'sales-report' as const, label: 'Laporan Penjualan', icon: FileBarChart },
      ]
    : [
        { id: 'cashier-dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
        { id: 'transaction' as const, label: 'Transaksi', icon: ShoppingCart },
      ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-emerald-600 dark:bg-emerald-800 text-white shadow-lg">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-emerald-700 lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {sidebarOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </Button>
            <UtensilsCrossed className="w-6 h-6" />
            <span className="font-bold text-sm sm:text-base">Jungle Food POS</span>
          </div>
          <div className="flex items-center gap-2">
            {mounted && theme && (
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-emerald-700"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
            )}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-700 rounded-full text-sm">
              <span className="font-medium">{user.name || user.username}</span>
              <span className="text-emerald-300">({user.role})</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-red-600"
              onClick={logout}
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside
          className={`
            fixed inset-y-0 top-14 z-40 w-56 bg-card border-r border-border shadow-lg
            transform transition-transform duration-300 ease-in-out
            lg:sticky lg:translate-x-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
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
                onClick={() => {
                  setPage(item.id);
                  setSidebarOpen(false);
                }}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Button>
            ))}
          </nav>
          <Separator className="my-3" />
          <div className="px-3 pb-3">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg text-xs space-y-1 sm:hidden">
              <p className="font-semibold text-emerald-700 dark:text-emerald-300">{user.name || user.username}</p>
              <p className="text-emerald-600 dark:text-emerald-400">{user.role}</p>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 top-14 z-30 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
          <div className="max-w-6xl mx-auto">
            <PageContent />
          </div>
        </main>
      </div>
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
    default:
      return null;
  }
}

// Import all page components
import AdminDashboard from './AdminDashboard';
import CashierDashboard from './CashierDashboard';
import ProductManagement from './ProductManagement';
import TransactionPage from './TransactionPage';
import StockReport from './StockReport';
import SalesReport from './SalesReport';
