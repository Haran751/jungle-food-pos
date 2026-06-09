'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, DollarSign, ShoppingBag, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface CashierDashboardData {
  stats: {
    todaySales: number;
    todayTransactions: number;
    totalSales: number;
    totalTransactions: number;
    totalProducts: number;
    lowStockProducts: number;
  };
  chartData: { name: string; date: string; total: number; count: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
}

export default function CashierDashboard() {
  const token = useStore((s) => s.token);
  const setPage = useStore((s) => s.setPage);
  const [data, setData] = useState<CashierDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    fetchDashboard(token);
  }, [token]);

  const fetchDashboard = async (authToken: string) => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/reports/dashboard', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const json = await res.json();
      if (res.ok) {
        setData(json);
      } else {
        setError(json.error || json.detail || 'Gagal memuat data');
      }
    } catch {
      setError('Gagal terhubung ke server');
    } finally {
      setLoading(false);
    }
  };

  const formatRp = (val: number) => `Rp ${(val || 0).toLocaleString('id-ID')}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-red-500 font-medium">{error}</p>
        <button
          onClick={() => fetchDashboard(useStore.getState().token)}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  if (!data) return <p className="text-center text-muted-foreground py-20">Gagal memuat data</p>;

  const stats = [
    { label: 'Penjualan Hari Ini', value: formatRp(data.stats.todaySales), icon: DollarSign, color: 'bg-emerald-500' },
    { label: 'Transaksi Hari Ini', value: data.stats.todayTransactions.toString(), icon: ShoppingBag, color: 'bg-blue-500' },
    { label: 'Total Transaksi', value: data.stats.totalTransactions.toString(), icon: TrendingUp, color: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg sm:text-2xl font-bold">Dashboard Kasir</h1>
        <button
          onClick={() => setPage('transaction')}
          className="px-3 py-2 sm:px-4 sm:py-2 bg-emerald-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          + Transaksi Baru
        </button>
      </div>

      {/* Stats - Mobile: scroll horizontal, Desktop: grid */}
      <div className="flex gap-3 overflow-x-auto pb-2 sm:pb-0 sm:grid sm:grid-cols-3 sm:overflow-visible -mx-1 px-1 sm:mx-0 sm:px-0">
        {stats.map((s) => (
          <Card key={s.label} className="hover:shadow-md transition-shadow min-w-[140px] sm:min-w-0 flex-shrink-0 sm:flex-shrink">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className={`w-9 h-9 sm:w-10 sm:h-10 ${s.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <s.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{s.label}</p>
                  <p className="text-sm sm:text-lg font-bold truncate">{s.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card>
        <CardHeader className="pb-2 pt-3 sm:pt-6 px-4 sm:px-6">
          <CardTitle className="text-sm sm:text-base">Penjualan 7 Hari Terakhir</CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-6 pb-4 sm:pb-6">
          <ResponsiveContainer width="100%" height={220} minWidth={280}>
            <BarChart data={data.chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value: number) => formatRp(value)}
                contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
              />
              <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}