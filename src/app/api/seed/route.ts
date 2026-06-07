import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Product from '@/models/Product';
import { hashPassword } from '@/lib/auth-utils';

// GET/POST /api/seed
export async function POST() {
  try {
    await connectDB();

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'ADMIN' });
    if (existingAdmin) {
      return NextResponse.json({ message: 'Database already seeded', seeded: false });
    }

    const adminPassword = await hashPassword('admin123');
    const kasirPassword = await hashPassword('kasir123');

    await User.create([
      { username: 'admin', password: adminPassword, role: 'ADMIN', name: 'Administrator' },
      { username: 'kasir', password: kasirPassword, role: 'KASIR', name: 'Kasir Jungle Food' },
    ]);

    await Product.create([
      { name: 'Cilor', price: 7000, stock: 50, category: 'Snack', image: '' },
      { name: 'Maklor', price: 10000, stock: 40, category: 'Makanan', image: '' },
      { name: 'Nasi Mentai', price: 15000, stock: 30, category: 'Makanan', image: '' },
      { name: 'Ayam Katsu', price: 7000, stock: 45, category: 'Makanan', image: '' },
      { name: 'Nasi Cokot', price: 6000, stock: 55, category: 'Makanan', image: '' },
      { name: 'Nasi Ayam Balado', price: 14000, stock: 25, category: 'Makanan', image: '' },
    ]);

    return NextResponse.json({
      message: 'Database seeded successfully',
      seeded: true,
      admin: { username: 'admin', password: 'admin123' },
      kasir: { username: 'kasir', password: 'kasir123' },
      productsCount: 6,
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}
