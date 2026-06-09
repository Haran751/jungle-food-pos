'use client';

import { useEffect, useState } from 'react';
import { useStore, Transaction } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Search, Download, FileBarChart, ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';

export default function SalesReport() {
  const { token } = useStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [revenue, setRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchSales = async (p = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      if (search) params.set('search', search);
      params.set('page', p.toString());
      params.set('limit', '10');

      const res = await fetch(`/api/reports/sales?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok) {
        setTransactions(json.transactions);
        setRevenue(json.revenue);
        setTotalPages(json.pagination.totalPages);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [page]);

  const handleSearch = () => {
    setPage(1);
    fetchSales(1);
  };

  const formatRp = (val: number) => `Rp ${(val || 0).toLocaleString('id-ID')}`;

  const exportPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');

      const params = new URLSearchParams();
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      if (search) params.set('search', search);
      params.set('limit', '1000');

      const res = await fetch(`/api/reports/sales?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      const allTransactions = json.transactions;
      const totalRevenue = json.revenue;

      const doc = new jsPDF();

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Stand Kantin "Jungle Food"', 105, 20, { align: 'center' });

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Laporan Penjualan', 105, 30, { align: 'center' });

      const date = new Date().toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric',
      });
      doc.setFontSize(10);
      doc.text(`Tanggal Cetak: ${date}`, 105, 38, { align: 'center' });
      if (dateFrom || dateTo) {
        doc.text(`Periode: ${dateFrom || '...'} s/d ${dateTo || '...'}`, 105, 45, { align: 'center' });
      }

      let y = dateFrom || dateTo ? 55 : 50;
      doc.setFont('helvetica', 'bold');
      doc.text('Ringkasan:', 14, y);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Transaksi: ${allTransactions.length}`, 14, y + 7);
      doc.text(`Total Pendapatan: ${formatRp(totalRevenue)}`, 14, y + 14);

      y += 24;
      doc.setFillColor(16, 185, 129);
      doc.rect(14, y - 5, 182, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('No', 16, y);
      doc.text('Tanggal', 24, y);
      doc.text('Kasir', 52, y);
      doc.text('Item', 85, y);
      doc.text('Total', 130, y);
      doc.text('Bayar', 150, y);
      doc.text('Kembali', 172, y);

      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      allTransactions.forEach((trx: Transaction, index: number) => {
        y += 6;
        if (y > 275) {
          doc.addPage();
          y = 20;
        }
        const trxDate = new Date(trx.createdAt).toLocaleDateString('id-ID');
        doc.text(`${index + 1}`, 16, y);
        doc.text(trxDate, 24, y);
        doc.text(trx.kasir.username, 52, y);
        doc.text(`${trx.details.length} item`, 85, y);
        doc.text(`Rp ${trx.totalPrice.toLocaleString('id-ID')}`, 130, y);
        doc.text(`Rp ${trx.payment.toLocaleString('id-ID')}`, 150, y);
        doc.text(`Rp ${trx.change.toLocaleString('id-ID')}`, 172, y);
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

      doc.save(`laporan-penjualan-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      console.error('PDF export error:', error);
      alert('Gagal mengexport PDF');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Laporan Penjualan</h1>
        <Button onClick={exportPDF} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 w-full sm:w-auto text-sm">
          <Download className="w-4 h-4" />
          Export PDF
        </Button>
      </div>

      {/* Summary Card */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-emerald-500 rounded-lg flex items-center justify-center shrink-0">
                <FileBarChart className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Total Pendapatan (Filter)</p>
                <p className="text-base sm:text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatRp(revenue)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] sm:text-xs text-muted-foreground">Jumlah Transaksi</p>
              <p className="text-base sm:text-xl font-bold">{transactions.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search & Filter - stack di mobile */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari kasir..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-9 h-10 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-10 text-sm flex-1 sm:flex-none"
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-10 text-sm flex-1 sm:flex-none"
          />
          <Button variant="outline" onClick={handleSearch} className="text-xs shrink-0">
            <Search className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">Cari</span>
          </Button>
        </div>
      </div>

      {/* Transactions - mobile card + desktop table */}
      <Card>
        <CardContent className="p-2 sm:p-0">
          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-left p-3 font-medium">No</th>
                  <th className="text-left p-3 font-medium">Tanggal</th>
                  <th className="text-left p-3 font-medium">Kasir</th>
                  <th className="text-center p-3 font-medium">Item</th>
                  <th className="text-right p-3 font-medium">Total</th>
                  <th className="text-right p-3 font-medium">Bayar</th>
                  <th className="text-right p-3 font-medium">Kembali</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-10 text-center">
                      <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mx-auto" />
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-muted-foreground">
                      Tidak ada data transaksi
                    </td>
                  </tr>
                ) : (
                  transactions.map((trx, index) => (
                    <tr key={trx.id} className="border-b hover:bg-muted/30">
                      <td className="p-3">{index + 1}</td>
                      <td className="p-3">
                        <div>
                          <p className="text-xs">{new Date(trx.createdAt).toLocaleDateString('id-ID')}</p>
                          <p className="text-xs text-muted-foreground">{new Date(trx.createdAt).toLocaleTimeString('id-ID')}</p>
                        </div>
                      </td>
                      <td className="p-3">{trx.kasir.name || trx.kasir.username}</td>
                      <td className="p-3 text-center">{trx.details.length} item</td>
                      <td className="p-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {formatRp(trx.totalPrice)}
                      </td>
                      <td className="p-3 text-right">{formatRp(trx.payment)}</td>
                      <td className="p-3 text-right">{formatRp(trx.change)}</td>
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
            ) : transactions.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm flex flex-col items-center gap-2">
                <ShoppingCart className="w-10 h-10 opacity-30" />
                <p>Tidak ada data transaksi</p>
              </div>
            ) : (
              transactions.map((trx, index) => (
                <div key={trx.id} className="p-3 rounded-lg border hover:bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">#{index + 1}</span>
                      <span className="text-xs font-medium">{trx.kasir.name || trx.kasir.username}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(trx.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-muted-foreground">{trx.details.length} item | {new Date(trx.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{formatRp(trx.totalPrice)}</p>
                      <p className="text-[10px] text-muted-foreground">Bayar: {formatRp(trx.payment)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => { setPage(page - 1); fetchSales(page - 1); }}
            disabled={page <= 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-xs sm:text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => { setPage(page + 1); fetchSales(page + 1); }}
            disabled={page >= totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}