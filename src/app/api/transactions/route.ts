import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import TransactionDetail from '@/models/TransactionDetail';
import Product from '@/models/Product';
import User from '@/models/User';
import { getTokenFromHeader, verifyToken } from '@/lib/jwt';
import mongoose from 'mongoose';

// GET /api/transactions - Get transactions list
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const token = getTokenFromHeader(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Token tidak valid' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 20;

    const filter: Record<string, unknown> = {};

    if (dateFrom || dateTo) {
      filter.createdAt = {} as Record<string, unknown>;
      if (dateFrom) (filter.createdAt as Record<string, unknown>).$gte = new Date(dateFrom);
      if (dateTo) (filter.createdAt as Record<string, unknown>).$lte = new Date(dateTo + 'T23:59:59');
    }

    // Kasir can only see their own transactions
    if (payload.role === 'KASIR') {
      filter.kasirId = new mongoose.Types.ObjectId(payload.id);
    }

    const [transactions, total] = await Promise.all([
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
    ]);

    return NextResponse.json({
      transactions: transactions.map((trx) => ({
        id: trx._id.toString(),
        kasirId: trx.kasirId._id.toString(),
        totalPrice: trx.totalPrice,
        payment: trx.payment,
        change: trx.change,
        createdAt: trx.createdAt.toISOString(),
        updatedAt: trx.updatedAt.toISOString(),
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
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// POST /api/transactions - Create transaction
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const token = getTokenFromHeader(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Token tidak valid' }, { status: 401 });

    const body = await request.json();
    const { items, payment } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Item transaksi wajib diisi' }, { status: 400 });
    }

    if (!payment || payment <= 0) {
      return NextResponse.json({ error: 'Jumlah pembayaran wajib diisi' }, { status: 400 });
    }

    // Calculate total and validate stock
    let totalPrice = 0;
    const productUpdates: { productId: string; quantity: number }[] = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return NextResponse.json({ error: `Produk "${item.name}" tidak ditemukan` }, { status: 400 });
      }
      if (product.stock < item.quantity) {
        return NextResponse.json({
          error: `Stok "${product.name}" tidak mencukupi. Sisa stok: ${product.stock}`,
        }, { status: 400 });
      }
      const subtotal = product.price * item.quantity;
      totalPrice += subtotal;
      productUpdates.push({ productId: item.productId, quantity: item.quantity });
    }

    if (payment < totalPrice) {
      return NextResponse.json({
        error: `Pembayaran kurang. Total: Rp ${totalPrice.toLocaleString('id-ID')}`,
      }, { status: 400 });
    }

    const change = payment - totalPrice;

    // Create transaction details
    const detailDocs = await TransactionDetail.insertMany(
      items.map((item: { productId: string; quantity: number; subtotal: number }) => ({
        productId: new mongoose.Types.ObjectId(item.productId),
        quantity: item.quantity,
        subtotal: item.subtotal,
      }))
    );

    // Create transaction
    const kasir = await User.findById(payload.id).select('username name').lean();

    const transaction = await Transaction.create({
      kasirId: new mongoose.Types.ObjectId(payload.id),
      totalPrice,
      payment,
      change,
      details: detailDocs.map((d) => d._id),
    });

    // Populate details for response
    await transaction.populate({
      path: 'details',
      populate: { path: 'productId', select: 'name price' },
    });

    // Deduct stock
    for (const update of productUpdates) {
      await Product.findByIdAndUpdate(update.productId, {
        $inc: { stock: -update.quantity },
      });
    }

    const trxObj = transaction.toObject();

    return NextResponse.json({
      transaction: {
        id: trxObj._id.toString(),
        kasirId: trxObj.kasirId.toString(),
        totalPrice: trxObj.totalPrice,
        payment: trxObj.payment,
        change: trxObj.change,
        createdAt: trxObj.createdAt.toISOString(),
        kasir: kasir ? { username: kasir.username, name: kasir.name } : { username: 'Unknown', name: '' },
        details: (trxObj.details || []).map((d: unknown) => {
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
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Create transaction error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
