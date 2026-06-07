import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Product from '@/models/Product';
import { getTokenFromHeader, verifyToken } from '@/lib/jwt';

// GET /api/reports/stock - Stock report
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const token = getTokenFromHeader(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Token tidak valid' }, { status: 401 });

    if (payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak. Hanya admin.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const stockFilter = searchParams.get('stock') || '';

    const filter: Record<string, unknown> = {};
    if (search) filter.name = { $regex: search, $options: 'i' };
    if (category) filter.category = category;
    if (stockFilter === 'low') filter.stock = { $lt: 10 };
    if (stockFilter === 'out') filter.stock = 0;

    const products = await Product.find(filter).sort({ stock: 1 }).lean();

    // Calculate summary
    const totalValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);
    const totalItems = products.reduce((sum, p) => sum + p.stock, 0);
    const lowStockCount = products.filter((p) => p.stock < 10).length;

    return NextResponse.json({
      products: products.map((p) => ({
        ...p,
        id: p._id.toString(),
        _id: undefined,
      })),
      summary: {
        totalValue,
        totalItems,
        lowStockCount,
        productCount: products.length,
      },
    });
  } catch (error) {
    console.error('Stock report error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
