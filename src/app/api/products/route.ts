import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Product from '@/models/Product';
import { getTokenFromHeader, verifyToken } from '@/lib/jwt';

// Helper to check admin role
async function checkAdmin(request: NextRequest) {
  const token = getTokenFromHeader(request.headers.get('Authorization'));
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  if (payload.role !== 'ADMIN') return null;
  return payload;
}

// GET /api/products
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const token = getTokenFromHeader(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Token tidak valid' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';

    const filter: Record<string, unknown> = {};
    if (search) filter.name = { $regex: search, $options: 'i' };
    if (category) filter.category = category;

    const products = await Product.find(filter).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      products: products.map((p) => ({
        ...p,
        id: p._id.toString(),
        _id: undefined,
      })),
    });
  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// POST /api/products - Create product (Admin only)
export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Akses ditolak. Hanya admin.' }, { status: 403 });

    await connectDB();

    const body = await request.json();
    const { name, price, stock, category, image } = body;

    if (!name || !price) {
      return NextResponse.json({ error: 'Nama dan harga wajib diisi' }, { status: 400 });
    }

    const product = await Product.create({
      name,
      price: Number(price),
      stock: Number(stock) || 0,
      category: category || 'Makanan',
      image: image || '',
    });

    return NextResponse.json({
      product: {
        ...product.toObject(),
        id: product._id.toString(),
        _id: undefined,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// PUT /api/products - Update product (Admin only)
export async function PUT(request: NextRequest) {
  try {
    const admin = await checkAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Akses ditolak. Hanya admin.' }, { status: 403 });

    await connectDB();

    const body = await request.json();
    const { id, name, price, stock, category, image } = body;

    if (!id) return NextResponse.json({ error: 'ID produk wajib diisi' }, { status: 400 });

    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name;
    if (price !== undefined) updateData.price = Number(price);
    if (stock !== undefined) updateData.stock = Number(stock);
    if (category) updateData.category = category;
    if (image !== undefined) updateData.image = image;

    const product = await Product.findByIdAndUpdate(id, updateData, { new: true }).lean();
    if (!product) return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });

    return NextResponse.json({
      product: {
        ...product,
        id: product._id.toString(),
        _id: undefined,
      },
    });
  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// DELETE /api/products - Delete product (Admin only)
export async function DELETE(request: NextRequest) {
  try {
    const admin = await checkAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Akses ditolak. Hanya admin.' }, { status: 403 });

    await connectDB();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID produk wajib diisi' }, { status: 400 });

    const product = await Product.findByIdAndDelete(id);
    if (!product) return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });

    return NextResponse.json({ message: 'Produk berhasil dihapus' });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
