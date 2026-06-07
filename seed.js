/**
 * Seed Script - Jungle Food POS
 * 
 * Cara jalanin:
 *   node seed.js
 * 
 * Pastikan file .env sudah berisi MONGODB_URI yang benar
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Load environment variables dari .env
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jungle-food-pos';

// Schema definitions (inline, tanpa import)
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['ADMIN', 'KASIR'], default: 'KASIR' },
  name: { type: String, default: '' },
});

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, default: 50 },
  image: { type: String, default: '' },
  category: { type: String, default: 'Makanan' },
});

const TransactionSchema = new mongoose.Schema({
  kasirId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  totalPrice: { type: Number, required: true },
  payment: { type: Number, required: true },
  change: { type: Number, required: true },
  details: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TransactionDetail' }],
}, { timestamps: true });

const TransactionDetailSchema = new mongoose.Schema({
  transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  quantity: { type: Number, required: true },
  subtotal: { type: Number, required: true },
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
const Product = mongoose.model('Product', ProductSchema);
const Transaction = mongoose.model('Transaction', TransactionSchema);
const TransactionDetail = mongoose.model('TransactionDetail', TransactionDetailSchema);

async function seed() {
  console.log('========================================');
  console.log('  JUNGLE FOOD POS - Database Seeder');
  console.log('========================================');
  console.log('');
  console.log(`Connecting to: ${MONGODB_URI}`);
  console.log('');

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB Connected!\n');

    // Check if already seeded
    const existingAdmin = await User.findOne({ role: 'ADMIN' });
    if (existingAdmin) {
      console.log('⚠️  Database sudah ada data. Hapus dulu kalo mau reset.');
      console.log('');
      console.log('User yang tersedia:');
      const users = await User.find().select('-password');
      users.forEach(u => console.log(`  - ${u.username} (${u.role})`));
      console.log('');
      const productCount = await Product.countDocuments();
      console.log(`Total produk: ${productCount}`);
      await mongoose.disconnect();
      return;
    }

    // Hash passwords
    console.log('Hashing passwords...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    const kasirPassword = await bcrypt.hash('kasir123', 10);

    // Create users
    console.log('Creating users...');
    await User.create([
      { username: 'admin', password: adminPassword, role: 'ADMIN', name: 'Administrator' },
      { username: 'kasir', password: kasirPassword, role: 'KASIR', name: 'Kasir Jungle Food' },
    ]);
    console.log('  ✅ Admin: admin / admin123');
    console.log('  ✅ Kasir: kasir / kasir123');

    // Create products
    console.log('Creating products...');
    const products = [
      { name: 'Cilor', price: 7000, stock: 50, category: 'Snack' },
      { name: 'Maklor', price: 10000, stock: 40, category: 'Makanan' },
      { name: 'Nasi Mentai', price: 15000, stock: 30, category: 'Makanan' },
      { name: 'Ayam Katsu', price: 7000, stock: 45, category: 'Makanan' },
      { name: 'Nasi Cokot', price: 6000, stock: 55, category: 'Makanan' },
      { name: 'Nasi Ayam Balado', price: 14000, stock: 25, category: 'Makanan' },
    ];
    await Product.create(products);
    products.forEach(p => console.log(`  ✅ ${p.name} - Rp ${p.price.toLocaleString('id-ID')} (Stok: ${p.stock})`));

    console.log('');
    console.log('========================================');
    console.log('  ✅ SEEDING BERHASIL!');
    console.log('========================================');
    console.log('');
    console.log('Sekarang jalankan: npm run dev');
    console.log('Buka: http://localhost:3000');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ SEEDING GAGAL!');
    console.error('');
    if (error.message.includes('ECONNREFUSED')) {
      console.error('Masalah: Tidak bisa konek ke MongoDB.');
      console.error('');
      console.error('Solusi:');
      console.error('  1. Pastikan MongoDB sudah jalan (lokal atau Atlas)');
      console.error('  2. Cek file .env - pastikan MONGODB_URI benar');
      console.error('');
      console.error('Contoh .env untuk MongoDB Atlas:');
      console.error('  MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/jungle-food-pos');
      console.error('');
      console.error('Contoh .env untuk MongoDB lokal:');
      console.error('  MONGODB_URI=mongodb://localhost:27017/jungle-food-pos');
    } else {
      console.error('Error:', error.message);
    }
  } finally {
    await mongoose.disconnect();
  }
}

seed();
