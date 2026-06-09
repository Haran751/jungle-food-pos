'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, DollarSign, ShoppingBag, Clock, AlertCircle } from 'lucide-react';
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
  const [debug, setDebug] = useState('');

  useEffect(() => {
    if (!token) {
      setDebug('Menunggu token...');
      return;
    }
    setDebug('');
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
      setDebug(`HTTP ${res.status} | ${JSON.stringify(json).slice(0, 200)}`);
      if (res.ok) {
        setData(json);
      } else {
        setError(json.error || json.detail || 'Gagal memuat data');
      }
    } catch (err) {
      setError('Gagal terhubung ke server');
      setDebug(String(err));
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
        {debug && (
          <pre className="text-xs bg-gray-100 p-3 rounded max-w-lg overflow-auto text-gray-600 text-left">
            {debug}
          </pre>
        )}
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard Kasir</h1>
        <button
          onClick={() => setPage('transaction')}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          + Transaksi Baru
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">Penjualan Hari Ini</p>
                <p className="text-lg font-bold truncate">{formatRp(data.stats.todaySales)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">Transaksi Hari Ini</p>
                <p className="text-lg font-bold truncate">{data.stats.todayTransactions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">Total Transaksi</p>
                <p className="text-lg font-bold truncate">{data.stats.totalTransactions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Penjualan 7 Hari Terakhir</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value: number) => formatRp(value)}
                contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
              />
              <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {debug && (
        <pre className="text-xs bg-gray-100 p-3 rounded text-gray-500 overflow-auto">
          Debug: {debug}
        </pre>
      )}
    </div>
  );
}