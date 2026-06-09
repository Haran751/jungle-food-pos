'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, DollarSign, ShoppingBag, Package, TrendingDown, Star, AlertCircle } from 'lucide-react';
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
      setDebug(`HTTP ${res.status} | ${JSON.stringify(json).slice(0, 300)}`);
      if (res.ok) {
        setData(json);
      } else {
        setError(json.error || json.detail || 'Gagal memuat data dashboard');
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

  if (!data) return <p className="text-center text-muted-foreground py-20">Gagal memuat data dashboard</p>;

  const stats = [
    { label: 'Penjualan Hari Ini', value: formatRp(data.stats.todaySales), icon: DollarSign, color: 'bg-emerald-500' },
    { label: 'Transaksi Hari Ini', value: data.stats.todayTransactions.toString(), icon: ShoppingBag, color: 'bg-blue-500' },
    { label: 'Total Penjualan', value: formatRp(data.stats.totalSales), icon: TrendingDown, color: 'bg-amber-500' },
    { label: 'Total Transaksi', value: data.stats.totalTransactions.toString(), icon: ShoppingBag, color: 'bg-purple-500' },
    { label: 'Total Produk', value: data.stats.totalProducts.toString(), icon: Package, color: 'bg-teal-500' },
    { label: 'Stok Menipis', value: data.stats.lowStockProducts.toString(), icon: Package, color: 'bg-red-500' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard Admin</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${s.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <s.icon className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{s.label}</p>
                  <p className="text-lg font-bold truncate">{s.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Grafik Penjualan 7 Hari Terakhir</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
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

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              Produk Terlaris
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.topProducts.length > 0 ? (
              <div className="flex flex-col md:flex-row items-center gap-4">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={data.topProducts}
                      dataKey="quantity"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      
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
                    <div key={p.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="truncate">{p.name}</span>
                      </div>
                      <span className="font-medium whitespace-nowrap">{p.quantity} pcs</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                Belum ada data penjualan
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Tren Jumlah Transaksi 7 Hari Terakhir</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
              <Line type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 4 }} />
            </LineChart>
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