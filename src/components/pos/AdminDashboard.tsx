'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, DollarSign, ShoppingBag, Package, TrendingUp, Star, AlertCircle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell,
} from 'recharts';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899'];

interface DashboardData {
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

export default function AdminDashboard() {
  const token = useStore((s) => s.token);
  const [data, setData] = useState<DashboardData | null>(null);
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
        setError(json.error || json.detail || 'Gagal memuat data dashboard');
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

  if (!data) return <p className="text-center text-muted-foreground py-20">Gagal memuat data dashboard</p>;

  const stats = [
    { label: 'Penjualan Hari Ini', value: formatRp(data.stats.todaySales), icon: DollarSign, color: 'bg-emerald-500' },
    { label: 'Transaksi Hari Ini', value: data.stats.todayTransactions.toString(), icon: ShoppingBag, color: 'bg-blue-500' },
    { label: 'Total Penjualan', value: formatRp(data.stats.totalSales), icon: TrendingUp, color: 'bg-amber-500' },
    { label: 'Total Transaksi', value: data.stats.totalTransactions.toString(), icon: ShoppingBag, color: 'bg-purple-500' },
    { label: 'Total Produk', value: data.stats.totalProducts.toString(), icon: Package, color: 'bg-teal-500' },
    { label: 'Stok Menipis', value: data.stats.lowStockProducts.toString(), icon: Package, color: 'bg-red-500' },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-lg sm:text-2xl font-bold">Dashboard Admin</h1>

      {/* Stats Cards - Mobile: horizontal scroll, Desktop: grid */}
      <div className="flex gap-3 overflow-x-auto pb-2 sm:pb-0 sm:grid sm:grid-cols-2 md:grid-cols-3 sm:overflow-visible -mx-1 px-1 sm:mx-0 sm:px-0">
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

      {/* Charts - Stack on mobile, side-by-side on desktop */}
      <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
        {/* Sales Chart */}
        <Card>
          <CardHeader className="pb-2 pt-3 sm:pt-6 px-4 sm:px-6">
            <CardTitle className="text-sm sm:text-base">Grafik Penjualan 7 Hari Terakhir</CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6 pb-4 sm:pb-6">
            <ResponsiveContainer width="100%" height={200} minWidth={260}>
              <BarChart data={data.chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: number) => formatRp(value)}
                  labelFormatter={(label) => `Hari: ${label}`}
                  contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Products Pie Chart */}
        <Card>
          <CardHeader className="pb-2 pt-3 sm:pt-6 px-4 sm:px-6">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              Produk Terlaris
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            {data.topProducts.length > 0 ? (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <ResponsiveContainer width="100%" height={180} minWidth={200}>
                  <PieChart>
                    <Pie
                      data={data.topProducts}
                      dataKey="quantity"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                    >
                      {data.topProducts.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="w-full space-y-2">
                  {data.topProducts.map((p, i) => (
                    <div key={p.name} className="flex items-center justify-between text-xs sm:text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="truncate">{p.name}</span>
                      </div>
                      <span className="font-medium whitespace-nowrap ml-2">{p.quantity} pcs</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[150px] sm:h-[200px] text-muted-foreground text-sm">
                Belum ada data penjualan
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transaction Trend Line Chart */}
      <Card>
        <CardHeader className="pb-2 pt-3 sm:pt-6 px-4 sm:px-6">
          <CardTitle className="text-sm sm:text-base">Tren Jumlah Transaksi 7 Hari Terakhir</CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-6 pb-4 sm:pb-6">
          <ResponsiveContainer width="100%" height={200} minWidth={280}>
            <LineChart data={data.chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
              <Line type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}