# Stand Kantin "Jungle Food" - Sistem POS (Point of Sale)

Aplikasi Point of Sale untuk kantin sekolah, dibangun dengan **MERN Stack**:
- **MongoDB** (MongoDB Atlas / Mongoose)
- **Express.js** (Next.js API Routes)
- **React.js** (Next.js)
- **Node.js** (Next.js)

## Fitur

### Halaman & Fitur
1. **Login Page** - Autentikasi JWT, redirect berdasarkan role (Admin/Kasir)
2. **Dashboard Admin** - Statistik penjualan harian/total, Grafik penjualan (Recharts)
3. **Dashboard Kasir** - Statistik transaksi kasir tersebut
4. **Kelola Barang (Admin)** - CRUD produk, Upload gambar, Tambah stok barang
5. **Transaksi Penjualan (Kasir)** - Pilih menu, input jumlah, perhitungan otomatis, input bayar, kembalian otomatis, cetak struk, stok berkurang otomatis
6. **Laporan Stok (Admin)** - Sisa stok barang, search & filter, Export PDF
7. **Laporan Penjualan (Admin)** - Riwayat transaksi, search & filter, Export PDF

### Fitur Bonus
- Export PDF Laporan (jsPDF)
- Grafik Penjualan (Recharts)
- Upload Gambar Produk
- Dark Mode Toggle
- Responsive Mobile (Tailwind CSS)
- Cetak Struk Otomatis
- Search & Filter Data
- Dashboard Statistik

## Akun Default

| Role  | Username | Password |
|-------|----------|----------|
| Admin | admin    | admin123 |
| Kasir | kasir    | kasir123 |

## Cara Menjalankan

### Prasyarat
- Node.js 18+
- MongoDB (lokal atau MongoDB Atlas)
- npm atau bun

### 1. Install Dependencies

```bash
npm install
# atau
bun install
```

### 2. Setup MongoDB Atlas (Gratis)

1. Buka [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Daftar / Login
3. Buat **Free Cluster** (M0 Sandbox)
4. Klik **Database Access** → Buat user (catat username & password)
5. Klik **Network Access** → Add IP Address → `0.0.0.0/0` (Allow All)
6. Klik **Connect** → Copy **connection string**

### 3. Konfigurasi Environment

Salin file `.env.example` menjadi `.env`:

```bash
cp .env.example .env
```

Edit `.env` dan isi MONGODB_URI dengan connection string MongoDB Atlas:

```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/jungle-food-pos
JWT_SECRET=jungle-food-pos-secret-key-2024
```

### 4. Jalankan Aplikasi

```bash
npm run dev
# atau
bun run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

## Menu & Harga

| No | Menu              | Harga     |
|----|-------------------|-----------|
| 1  | Cilor             | Rp 7.000  |
| 2  | Maklor            | Rp 10.000 |
| 3  | Nasi Mentai       | Rp 15.000 |
| 4  | Ayam Katsu        | Rp 7.000  |
| 5  | Nasi Cokot        | Rp 6.000  |
| 6  | Nasi Ayam Balado  | Rp 14.000 |

## Deploy ke Vercel (Gratis)

1. Push code ke GitHub
2. Buka [vercel.com](https://vercel.com)
3. Import repository
4. Set environment variable:
   - `MONGODB_URI` = connection string MongoDB Atlas
   - `JWT_SECRET` = secret key kamu
5. Deploy!

## Struktur Project

```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts     # Login endpoint
│   │   │   └── me/route.ts       # Token verification
│   │   ├── products/
│   │   │   ├── route.ts          # CRUD products
│   │   │   └── upload/route.ts   # Image upload
│   │   ├── transactions/
│   │   │   └── route.ts          # Create & list transactions
│   │   ├── reports/
│   │   │   ├── dashboard/route.ts # Dashboard stats
│   │   │   ├── sales/route.ts     # Sales report
│   │   │   └── stock/route.ts     # Stock report
│   │   └── seed/route.ts          # Seed database
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                   # Main SPA entry
├── components/
│   ├── pos/
│   │   ├── AdminDashboard.tsx
│   │   ├── CashierDashboard.tsx
│   │   ├── LoginPage.tsx
│   │   ├── Navbar.tsx
│   │   ├── ProductManagement.tsx
│   │   ├── SalesReport.tsx
│   │   ├── StockReport.tsx
│   │   └── TransactionPage.tsx
│   ├── theme-provider.tsx
│   └── ui/                        # shadcn/ui components
├── lib/
│   ├── auth-utils.ts              # bcrypt password utils
│   ├── jwt.ts                      # JWT token utils
│   ├── mongodb.ts                  # MongoDB connection
│   └── utils.ts
├── models/
│   ├── User.ts                     # Mongoose User model
│   ├── Product.ts                  # Mongoose Product model
│   ├── Transaction.ts              # Mongoose Transaction model
│   └── TransactionDetail.ts       # Mongoose TransactionDetail model
└── store/
    └── useStore.ts                 # Zustand state management
```
