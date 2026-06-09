import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import TransactionDetail from '@/models/TransactionDetail';
import Product from '@/models/Product';
import { getTokenFromHeader, verifyToken } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const token = getTokenFromHeader(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized', detail: 'Header Authorization kosong' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Token tidak valid', detail: 'verifyToken() return null' }, { status: 401 });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayFilter: Record<string, unknown> = { createdAt: { $gte: today } };
    const allFilter: Record<string, unknown> = {};

    const [
      todayResult,
      todayTransactions,
      totalResult,
      totalTransactions,
      totalProducts,
      lowStockProducts,
    ] = await Promise.all([
      Transaction.aggregate([
        { $match: todayFilter },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),
      Transaction.countDocuments(todayFilter),
      Transaction.aggregate([
        { $match: allFilter },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),
      Transaction.countDocuments(allFilter),
      Product.countDocuments(),
      Product.countDocuments({ stock: { $lt: 10 } }),
    ]);

    const chartData: { name: string; date: string; total: number; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const chartWhere: Record<string, unknown> = {
        createdAt: { $gte: date, $lt: nextDate },
      };

      const [dayResult, dayCount] = await Promise.all([
        Transaction.aggregate([
          { $match: chartWhere },
          { $group: { _id: null, total: { $sum: '$totalPrice' } } },
        ]),
        Transaction.countDocuments(chartWhere),
      ]);

      const dayName = new Intl.DateTimeFormat('id-ID', { weekday: 'short' }).format(date);
      const dateStr = `${date.getDate()}/${date.getMonth() + 1}`;

      chartData.push({
        name: dayName,
        date: dateStr,
        total: dayResult[0]?.total || 0,
        count: dayCount,
      });
    }

    const topProducts = await TransactionDetail.aggregate([
      { $group: { _id: '$productId', quantity: { $sum: '$quantity' }, revenue: { $sum: '$subtotal' } } },
      { $sort: { quantity: -1 } },
      { $limit: 5 },
    ]);

    const topProductDetails = await Promise.all(
      topProducts.map(async (tp) => {
        const product = await Product.findById(tp._id).select('name').lean();
        return {
          name: product?.name || 'Unknown',
          quantity: tp.quantity,
          revenue: tp.revenue,
        };
      })
    );

    return NextResponse.json({
      stats: {
        todaySales: todayResult[0]?.total || 0,
        todayTransactions,
        totalSales: totalResult[0]?.total || 0,
        totalTransactions,
        totalProducts,
        lowStockProducts,
      },
      chartData,
      topProducts: topProductDetails,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server', detail: msg }, { status: 500 });
  }
}