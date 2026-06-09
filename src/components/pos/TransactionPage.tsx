'use client';

import { useEffect, useState, useRef } from 'react';
import { useStore, Product } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Loader2, Plus, Minus, Trash2, ShoppingCart, Package, CheckCircle, Printer, X } from 'lucide-react';

export default function TransactionPage() {
  const { token, products, setProducts, cart, addToCart, removeFromCart, updateCartQuantity, clearCart, setLastTransaction } = useStore();
  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [search, setSearch] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);
  const lastTransaction = useStore((s) => s.lastTransaction);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products', { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (res.ok) setProducts(json.products);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const changeAmount = Number(payment) - cartTotal;
  const isPaymentValid = Number(payment) >= cartTotal && cart.length > 0;

  const handleCheckout = async () => {
    if (!isPaymentValid || cart.length === 0) return;
    setProcessing(true);
    setError('');
    try {
      const items = cart.map((item) => ({
        productId: item.id, name: item.name, quantity: item.quantity,
        price: item.price, subtotal: item.subtotal,
      }));
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ items, payment: Number(payment) }),
      });
      const json = await res.json();
      if (res.ok) {
        setLastTransaction(json.transaction);
        setSuccess(true);
        setPayment('');
        clearCart();
        setCartOpen(false);
      } else {
        setError(json.error || 'Gagal membuat transaksi');
      }
    } catch { setError('Terjadi kesalahan koneksi'); }
    finally { setProcessing(false); }
  };

  const handlePrintReceipt = () => {
    if (!receiptRef.current) return;
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Struk - Jungle Food</title>
      <style>
        body { font-family: monospace; padding: 20px; max-width: 300px; margin: 0 auto; font-size: 12px; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .separator { border-top: 1px dashed #000; margin: 8px 0; }
        .row { display: flex; justify-content: space-between; }
        .item-row { margin-bottom: 4px; }
        @media print { body { padding: 0; } }
      </style></head><body>
      ${receiptRef.current.innerHTML}
      <script>window.print();</script>
      </body></html>
    `);
    printWindow.document.close();
  };

  const formatRp = (val: number) => `Rp ${val.toLocaleString('id-ID')}`;
  const filteredProducts = products.filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase()) && p.stock > 0
  );

  // Receipt View
  if (success && lastTransaction) {
    return (
      <div className="max-w-md mx-auto space-y-4">
        <div className="text-center space-y-2 py-6">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto" />
          <h2 className="text-xl font-bold">Transaksi Berhasil!</h2>
          <p className="text-muted-foreground">Struk pembayaran</p>
        </div>
        <Card ref={receiptRef}>
          <CardContent className="p-6">
            <div className="text-center space-y-1 mb-4">
              <h3 className="font-bold text-lg">Stand Kantin &ldquo;Jungle Food&rdquo;</h3>
              <p className="text-xs text-muted-foreground">Struk Pembayaran</p>
              <p className="text-xs text-muted-foreground">{new Date(lastTransaction.createdAt).toLocaleString('id-ID')}</p>
              <p className="text-xs text-muted-foreground">Kasir: {lastTransaction.kasir.name || lastTransaction.kasir.username}</p>
            </div>
            <div className="border-t border-dashed" />
            <div className="space-y-2 my-4">
              {lastTransaction.details.map((detail) => (
                <div key={detail.id}>
                  <p className="font-medium text-sm">{detail.product.name}</p>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{detail.quantity} x {formatRp(detail.product.price)}</span>
                    <span className="font-medium text-foreground">{formatRp(detail.subtotal)}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-dashed" />
            <div className="space-y-1 mt-4">
              <div className="flex justify-between font-bold text-sm"><span>TOTAL</span><span>{formatRp(lastTransaction.totalPrice)}</span></div>
              <div className="flex justify-between text-sm"><span>Bayar</span><span>{formatRp(lastTransaction.payment)}</span></div>
              <div className="flex justify-between text-sm font-bold text-emerald-600 dark:text-emerald-400"><span>Kembalian</span><span>{formatRp(lastTransaction.change)}</span></div>
            </div>
            <div className="border-t border-dashed" />
            <div className="text-center mt-4">
              <p className="text-xs text-muted-foreground">Terima kasih atas kunjungan Anda!</p>
            </div>
          </CardContent>
        </Card>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 gap-2" onClick={handlePrintReceipt}>
            <Printer className="w-4 h-4" /> Cetak Struk
          </Button>
          <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            onClick={() => { setSuccess(false); setLastTransaction(null); }}>
            <ShoppingCart className="w-4 h-4" /> Transaksi Baru
          </Button>
        </div>
      </div>
    );
  }

  // Cart content (dipakai di desktop sidebar & mobile bottom sheet)
  const cartContent = (
    <div className="space-y-4">
      {error && (
        <div className="p-2 bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded text-xs">{error}</div>
      )}
      <div className="space-y-2 max-h-48 lg:max-h-64 overflow-y-auto">
        {cart.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-6">Keranjang kosong. Klik menu untuk menambahkan.</p>
        ) : (
          cart.map((item) => (
            <div key={item.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground">{formatRp(item.price)}</p>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateCartQuantity(item.id, item.quantity - 1)}>
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateCartQuantity(item.id, item.quantity + 1)} disabled={item.quantity >= item.stock}>
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
              <div className="text-right w-20 hidden sm:block">
                <p className="text-sm font-bold">{formatRp(item.subtotal)}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => removeFromCart(item.id)}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))
        )}
      </div>
      <Separator />
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total</span>
          <span className="font-bold text-lg">{formatRp(cartTotal)}</span>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Jumlah Bayar</label>
          <Input type="number" placeholder="Masukkan jumlah uang" value={payment}
            onChange={(e) => setPayment(e.target.value)} disabled={cart.length === 0} />
        </div>
        {cartTotal > 0 && (
          <div className="flex gap-1 flex-wrap">
            {[cartTotal, Math.ceil(cartTotal / 5000) * 5000, Math.ceil(cartTotal / 10000) * 10000, 50000, 100000]
              .filter((v, i, a) => v > 0 && a.indexOf(v) === i).slice(0, 4)
              .map((amount) => (
                <Button key={amount} variant="outline" size="sm" className="text-xs h-7"
                  onClick={() => setPayment(amount.toString())}>
                  {formatRp(amount)}
                </Button>
              ))}
          </div>
        )}
        {Number(payment) >= cartTotal && cartTotal > 0 && (
          <div className="flex justify-between items-center p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
            <span className="text-sm font-medium">Kembalian</span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatRp(changeAmount)}</span>
          </div>
        )}
        <Button className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
          disabled={!isPaymentValid || processing} onClick={handleCheckout}>
          {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
          Proses Pembayaran
        </Button>
        {cart.length > 0 && (
          <Button variant="outline" className="w-full" onClick={clearCart}>Kosongkan Keranjang</Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <h1 className="text-xl sm:text-2xl font-bold">Transaksi Penjualan</h1>

      <div className="grid lg:grid-cols-5 gap-4">
        {/* Product Selection */}
        <div className="lg:col-span-3 space-y-4">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <Input placeholder="Cari menu..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10 text-sm" />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[55vh] lg:max-h-[60vh] overflow-y-auto pr-1">
              {filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  className={`cursor-pointer hover:shadow-md transition-all hover:border-emerald-400 dark:hover:border-emerald-600 ${
                    cart.find((c) => c.id === product.id) ? 'border-emerald-500 dark:border-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-800' : ''
                  }`}
                  onClick={() => addToCart(product)}
                >
                  <CardContent className="p-2.5 sm:p-3">
                    <div className="h-14 sm:h-16 bg-muted rounded-md flex items-center justify-center mb-2 overflow-hidden">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-md" />
                      ) : (
                        <Package className="w-7 h-7 sm:w-8 sm:h-8 text-muted-foreground/30" />
                      )}
                    </div>
                    <p className="font-medium text-xs sm:text-sm truncate">{product.name}</p>
                    <p className="text-emerald-600 dark:text-emerald-400 font-bold text-xs sm:text-sm">{formatRp(product.price)}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Stok: {product.stock}</p>
                    {cart.find((c) => c.id === product.id) && (
                      <div className="mt-1 text-[10px] sm:text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 rounded px-2 py-0.5 text-center">
                        {cart.find((c) => c.id === product.id)?.quantity} dipilih
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Desktop Cart - sidebar kanan */}
        <div className="hidden lg:block lg:col-span-2">
          <Card className="sticky top-20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" /> Keranjang ({cart.length} item)
              </CardTitle>
            </CardHeader>
            <CardContent>{cartContent}</CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile: Floating Cart Button */}
      <button
        onClick={() => setCartOpen(true)}
        className="lg:hidden fixed bottom-20 right-4 z-40 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg w-14 h-14 flex items-center justify-center transition-transform active:scale-95"
      >
        <ShoppingCart className="w-6 h-6" />
        {cart.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {cart.length}
          </span>
        )}
      </button>

      {/* Mobile: Bottom Sheet Cart */}
      {cartOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/50" onClick={() => setCartOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.15)] max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-card z-10 flex items-center justify-between px-4 py-3 border-b">
              <h3 className="font-bold text-base">Keranjang ({cart.length} item)</h3>
              <button onClick={() => setCartOpen(false)} className="p-1 rounded-full hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">{cartContent}</div>
          </div>
        </div>
      )}
    </div>
  );
}