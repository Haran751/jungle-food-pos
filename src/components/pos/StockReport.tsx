'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Search, Download, Package, AlertTriangle, Archive } from 'lucide-react';

interface StockProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  image: string;
  category: string;
}

interface StockSummary {
  totalValue: number;
  totalItems: number;
  lowStockCount: number;
  productCount: number;
}

export default function StockReport() {
  const { token } = useStore();
  const [products, setProducts] = useState<StockProduct[]>([]);
  const [summary, setSummary] = useState<StockSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [stockFilter, setStockFilter] = useState('');

  const fetchStock = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      if (stockFilter) params.set('stock', stockFilter);
      const res = await fetch(`/api/reports/stock?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok) {
        setProducts(json.products);
        setSummary(json.summary);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  const handleSearch = () => fetchStock();

  const formatRp = (val: number) => `Rp ${val.toLocaleString('id-ID')}`;

  const exportPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');

      const doc = new jsPDF();

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Stand Kantin "Jungle Food"', 105, 20, { align: 'center' });

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Laporan Stok Barang', 105, 30, { align: 'center' });

      const date = new Date().toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric',
      });
      doc.setFontSize(10);
      doc.text(`Tanggal: ${date}`, 105, 38, { align: 'center' });

      if (summary) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Ringkasan:', 14, 50);
        doc.setFont('helvetica', 'normal');
        doc.text(`Total Produk: ${summary.productCount}`, 14, 58);
        doc.text(`Total Stok: ${summary.totalItems} pcs`, 14, 64);
        doc.text(`Nilai Stok: ${formatRp(summary.totalValue)}`, 14, 70);
        doc.text(`Stok Menipis: ${summary.lowStockCount} produk`, 14, 76);
      }

      let y = summary ? 88 : 55;
      doc.setFillColor(16, 185, 129);
      doc.rect(14, y - 5, 182, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('No', 16, y);
      doc.text('Nama Barang', 26, y);
      doc.text('Kategori', 80, y);
      doc.text('Harga', 120, y);
      doc.text('Stok', 155, y);
      doc.text('Status', 175, y);

      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      products.forEach((product, index) => {
        y += 7;
        if (y > 275) {
          doc.addPage();
          y = 20;
        }
        const status = product.stock === 0 ? 'Habis' : product.stock < 10 ? 'Menipis' : 'Aman';
        doc.text(`${index + 1}`, 16, y);
        doc.text(product.name.substring(0, 25), 26, y);
        doc.text(product.category, 80, y);
        doc.text(`Rp ${product.price.toLocaleString('id-ID')}`, 120, y);
        doc.text(`${product.stock}`, 155, y);
        doc.text(status, 175, y);
      });

      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Dicetak pada: ${new Date().toLocaleString('id-ID')} | Halaman ${i} dari ${pageCount}`,
          105, 290, { align: 'center' }
        );
      }

      doc.save(`laporan-stok-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      console.error('PDF export error:', error);
      alert('Gagal mengexport PDF');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Laporan Stok</h1>
        <Button onClick={exportPDF} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 w-full sm:w-auto text-sm">
          <Download className="w-4 h-4" />
          Export PDF
        </Button>
      </div>

      {/* Summary Cards - horizontal scroll di mobile */}
      {summary && (
        <div className="flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible sm:pb-0 -mx-1 px-1">
          <Card className="min-w-[150px] sm:min-w-0 shrink-0">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-emerald-500 rounded-lg flex items-center justify-center shrink-0">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Total Produk</p>
                  <p className="text-base sm:text-lg font-bold">{summary.productCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="min-w-[150px] sm:min-w-0 shrink-0">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-500 rounded-lg flex items-center justify-center shrink-0">
                  <Archive className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Total Stok</p>
                  <p className="text-base sm:text-lg font-bold">{summary.totalItems} pcs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="min-w-[150px] sm:min-w-0 shrink-0">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-amber-500 rounded-lg flex items-center justify-center shrink-0">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Nilai Stok</p>
                  <p className="text-sm sm:text-lg font-bold">{formatRp(summary.totalValue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="min-w-[150px] sm:min-w-0 shrink-0">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-red-500 rounded-lg flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Stok Menipis</p>
                  <p className="text-base sm:text-lg font-bold">{summary.lowStockCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search & Filter - stack di mobile */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama barang..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-9 h-10 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm flex-1 sm:flex-none"
          >
            <option value="">Semua Kategori</option>
            <option value="Makanan">Makanan</option>
            <option value="Snack">Snack</option>
            <option value="Minuman">Minuman</option>
          </select>
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm flex-1 sm:flex-none"
          >
            <option value="">Semua Stok</option>
            <option value="low">Stok Menipis (&lt;10)</option>
            <option value="out">Stok Habis (0)</option>
          </select>
          <Button variant="outline" onClick={handleSearch} className="text-xs">
            <Search className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">Cari</span>
          </Button>
        </div>
      </div>

      {/* Table - mobile card view + desktop table */}
      <Card>
        <CardContent className="p-2 sm:p-0">
          <div className="overflow-x-auto sm:block hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-left p-3 font-medium">No</th>
                  <th className="text-left p-3 font-medium">Nama Barang</th>
                  <th className="text-left p-3 font-medium">Kategori</th>
                  <th className="text-right p-3 font-medium">Harga</th>
                  <th className="text-center p-3 font-medium">Stok</th>
                  <th className="text-center p-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-10 text-center">
                      <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mx-auto" />
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-muted-foreground">
                      Tidak ada data stok
                    </td>
                  </tr>
                ) : (
                  products.map((product, index) => (
                    <tr key={product.id} className="border-b hover:bg-muted/30">
                      <td className="p-3">{index + 1}</td>
                      <td className="p-3 font-medium">{product.name}</td>
                      <td className="p-3">{product.category}</td>
                      <td className="p-3 text-right">{formatRp(product.price)}</td>
                      <td className="p-3 text-center font-bold">{product.stock}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          product.stock === 0
                            ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                            : product.stock < 10
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                            : 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                        }`}>
                          {product.stock === 0 ? 'Habis' : product.stock < 10 ? 'Menipis' : 'Aman'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="sm:hidden space-y-2">
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                Tidak ada data stok
              </div>
            ) : (
              products.map((product, index) => (
                <div key={product.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50">
                  <span className="text-xs text-muted-foreground w-5 text-center shrink-0">{index + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{product.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-muted-foreground">{product.category}</span>
                      <span className="text-xs text-muted-foreground">|</span>
                      <span className="text-xs">{formatRp(product.price)}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-sm">{product.stock}</p>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                      product.stock === 0
                        ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                        : product.stock < 10
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                        : 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                    }`}>
                      {product.stock === 0 ? 'Habis' : product.stock < 10 ? 'Menipis' : 'Aman'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}