import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import User from '@/models/User';
import { getTokenFromHeader, verifyToken } from '@/lib/jwt';
import mongoose from 'mongoose';

// GET /api/reports/sales - Sales report
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
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const search = searchParams.get('search') || '';
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 20;

    const filter: Record<string, unknown> = {};

    if (dateFrom || dateTo) {
      filter.createdAt = {} as Record<string, unknown>;
      if (dateFrom) (filter.createdAt as Record<string, unknown>).$gte = new Date(dateFrom);
      if (dateTo) (filter.createdAt as Record<string, unknown>).$lte = new Date(dateTo + 'T23:59:59');
    }

    if (search) {
      const kasirIds = await User.find({ username: { $regex: search, $options: 'i' } }).select('_id').lean();
      if (kasirIds.length > 0) {
        filter.kasirId = { $in: kasirIds.map((k) => k._id) };
      }
    }

    const [transactions, total, revenueResult] = await Promise.all([
      Transaction.find(filter)
        .populate('kasirId', 'username name')
        .populate({
          path: 'details',
          populate: { path: 'productId', select: 'name price' },
        })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Transaction.countDocuments(filter),
      Transaction.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),
    ]);

    return NextResponse.json({
      transactions: transactions.map((trx) => ({
        id: trx._id.toString(),
        kasirId: trx.kasirId._id.toString(),
        totalPrice: trx.totalPrice,
        payment: trx.payment,
        change: trx.change,
        createdAt: trx.createdAt.toISOString(),
        kasir: trx.kasirId ? {
          username: (trx.kasirId as unknown as { username: string }).username,
          name: (trx.kasirId as unknown as { name: string }).name,
        } : { username: 'Unknown', name: '' },
        details: (trx.details || []).map((d: unknown) => {
          const detail = d as { _id: mongoose.Types.ObjectId; productId: unknown; quantity: number; subtotal: number };
          const prod = detail.productId as unknown as { _id: mongoose.Types.ObjectId; name: string; price: number } | null;
          return {
            id: detail._id.toString(),
            productId: prod?._id?.toString() || '',
            quantity: detail.quantity,
            subtotal: detail.subtotal,
            product: prod ? { name: prod.name, price: prod.price } : { name: 'Unknown', price: 0 },
          };
        }),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      revenue: revenueResult[0]?.total || 0,
    });
  } catch (error) {
    console.error('Sales report error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
