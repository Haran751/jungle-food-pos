'use client';

import { useEffect, useState } from 'react';
import { useStore, Transaction } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Search, Download, FileBarChart, ChevronLeft, ChevronRight } from 'lucide-react';

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

      // Fetch all transactions for PDF
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

      // Title
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

      // Summary
      let y = dateFrom || dateTo ? 55 : 50;
      doc.setFont('helvetica', 'bold');
      doc.text('Ringkasan:', 14, y);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Transaksi: ${allTransactions.length}`, 14, y + 7);
      doc.text(`Total Pendapatan: ${formatRp(totalRevenue)}`, 14, y + 14);

      // Table header
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

      // Table rows
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

      // Footer
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold">Laporan Penjualan</h1>
        <Button onClick={exportPDF} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
          <Download className="w-4 h-4" />
          Export PDF
        </Button>
      </div>

      {/* Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                <FileBarChart className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Pendapatan (Filter)</p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatRp(revenue)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Jumlah Transaksi</p>
              <p className="text-xl font-bold">{transactions.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari kasir..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-9 h-10"
          />
        </div>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="h-10"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="h-10"
        />
        <Button variant="outline" onClick={handleSearch}>
          <Search className="w-4 h-4 mr-1" /> Cari
        </Button>
      </div>

      {/* Transactions List */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-left p-3 font-medium">No</th>
                  <th className="text-left p-3 font-medium">Tanggal</th>
                  <th className="text-left p-3 font-medium">Kasir</th>
                  <th className="text-center p-3 font-medium hidden sm:table-cell">Item</th>
                  <th className="text-right p-3 font-medium">Total</th>
                  <th className="text-right p-3 font-medium hidden sm:table-cell">Bayar</th>
                  <th className="text-right p-3 font-medium hidden sm:table-cell">Kembali</th>
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
                      <td className="p-3 text-center hidden sm:table-cell">{trx.details.length} item</td>
                      <td className="p-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {formatRp(trx.totalPrice)}
                      </td>
                      <td className="p-3 text-right hidden sm:table-cell">{formatRp(trx.payment)}</td>
                      <td className="p-3 text-right hidden sm:table-cell">{formatRp(trx.change)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => { setPage(page - 1); fetchSales(page - 1); }}
            disabled={page <= 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Halaman {page} dari {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
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
