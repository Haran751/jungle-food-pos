'use client';

import { useEffect, useState, useRef } from 'react';
import { useStore, Product } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Plus, Pencil, Trash2, Upload, Search, Package } from 'lucide-react';

export default function ProductManagement() {
  const { token, products, setProducts } = useStore();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formStock, setFormStock] = useState('');
  const [formCategory, setFormCategory] = useState('Makanan');
  const [formImage, setFormImage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      const res = await fetch(`/api/products?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok) setProducts(json.products);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSearch = () => fetchProducts();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/products/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const json = await res.json();
      if (res.ok) setFormImage(json.image);
      else setError(json.error || 'Gagal upload gambar');
    } catch {
      setError('Gagal upload gambar');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFormName(''); setFormPrice(''); setFormStock('');
    setFormCategory('Makanan'); setFormImage(''); setError(''); setEditProduct(null);
  };

  const openAddDialog = () => { resetForm(); setIsDialogOpen(true); };

  const openEditDialog = (product: Product) => {
    setEditProduct(product);
    setFormName(product.name);
    setFormPrice(product.price.toString());
    setFormStock(product.stock.toString());
    setFormCategory(product.category);
    setFormImage(product.image || '');
    setError('');
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const body = {
        name: formName, price: Number(formPrice), stock: Number(formStock),
        category: formCategory, image: formImage,
      };
      let res;
      if (editProduct) {
        body.id = editProduct.id;
        res = await fetch('/api/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        });
      }
      const json = await res.json();
      if (res.ok) { setIsDialogOpen(false); resetForm(); fetchProducts(); }
      else setError(json.error || 'Gagal menyimpan produk');
    } catch { setError('Terjadi kesalahan'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus produk ini?')) return;
    try {
      const res = await fetch(`/api/products?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok) fetchProducts();
      else alert(json.error || 'Gagal menghapus');
    } catch { alert('Gagal menghapus produk'); }
  };

  const formatRp = (val: number) => `Rp ${val.toLocaleString('id-ID')}`;
  const categories = ['Semua', 'Makanan', 'Snack', 'Minuman'];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Manajemen Data Barang</h1>
        <Button onClick={openAddDialog} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 w-full sm:w-auto">
          <Plus className="w-4 h-4" /> Tambah Barang
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Cari nama barang..." value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()} className="pl-9 h-10 text-sm" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <Button key={cat} variant={category === (cat === 'Semua' ? '' : cat) ? 'default' : 'outline'}
              size="sm" onClick={() => setCategory(cat === 'Semua' ? '' : cat)}
              className={category === (cat === 'Semua' ? '' : cat) ? 'bg-emerald-600 text-white text-xs px-3' : 'text-xs px-3'}>
              {cat}
            </Button>
          ))}
          <Button variant="outline" size="sm" onClick={handleSearch} className="text-xs">Cari</Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Tidak ada barang ditemukan</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-28 sm:h-36 bg-muted flex items-center justify-center overflow-hidden">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground/30" />
                )}
              </div>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start justify-between gap-1">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm sm:text-base truncate">{product.name}</h3>
                    <p className="text-emerald-600 dark:text-emerald-400 font-bold text-sm sm:text-lg mt-0.5 sm:mt-1">{formatRp(product.price)}</p>
                    <div className="flex items-center gap-2 mt-1.5 sm:mt-2 text-sm text-muted-foreground">
                      <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs ${
                        product.stock < 10 ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                      }`}>Stok: {product.stock}</span>
                      <span className="text-[10px] sm:text-xs">{product.category}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 ml-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEditDialog(product)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => handleDelete(product.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle className="text-lg">{editProduct ? 'Edit Barang' : 'Tambah Barang Baru'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-lg text-sm">{error}</div>
            )}
            <div className="space-y-2">
              <Label className="text-sm">Gambar Produk</Label>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-muted flex items-center justify-center overflow-hidden border">
                  {formImage ? <img src={formImage} alt="Preview" className="w-full h-full object-cover" /> : <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground/30" />}
                </div>
                <div className="flex-1 space-y-2">
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading} className="text-xs">
                    {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Upload className="w-3.5 h-3.5 mr-1.5" />}
                    {uploading ? 'Uploading...' : 'Upload Gambar'}
                  </Button>
                  {formImage && <Button variant="ghost" size="sm" onClick={() => setFormImage('')} className="text-xs">Hapus gambar</Button>}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm">Nama Barang *</Label>
              <Input id="name" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Cth: Nasi Mentai" className="text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="price" className="text-sm">Harga (Rp) *</Label>
                <Input id="price" type="number" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} placeholder="15000" className="text-sm" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock" className="text-sm">Stok</Label>
                <Input id="stock" type="number" value={formStock} onChange={(e) => setFormStock(e.target.value)} placeholder="50" className="text-sm" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm">Kategori</Label>
              <select id="category" value={formCategory} onChange={(e) => setFormCategory(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="Makanan">Makanan</option>
                <option value="Snack">Snack</option>
                <option value="Minuman">Minuman</option>
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 text-sm" onClick={() => { setIsDialogOpen(false); resetForm(); }}>Batal</Button>
              <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm" onClick={handleSave}
                disabled={saving || !formName || !formPrice}>
                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {editProduct ? 'Simpan Perubahan' : 'Tambah Barang'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}