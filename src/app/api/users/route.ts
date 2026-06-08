import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { getTokenFromHeader, verifyToken } from '@/lib/jwt';
import { hashPassword } from '@/lib/auth-utils';

// GET /api/users - Get all users
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

    const users = await User.find()
      .select('-password')
      .sort({ _id: -1 })
      .lean();

    return NextResponse.json({
      users: users.map((u) => ({
        id: u._id.toString(),
        username: u.username,
        role: u.role,
        name: u.name,
        createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString(),
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Get users error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server', detail: message }, { status: 500 });
  }
}

// POST /api/users - Create user
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const token = getTokenFromHeader(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Token tidak valid' }, { status: 401 });
    if (payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak. Hanya admin.' }, { status: 403 });
    }

    const body = await request.json();
    const { username, password, role, name } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'Username dan password wajib diisi' }, { status: 400 });
    }

    if (username.length < 3) {
      return NextResponse.json({ error: 'Username minimal 3 karakter' }, { status: 400 });
    }

    if (password.length < 4) {
      return NextResponse.json({ error: 'Password minimal 4 karakter' }, { status: 400 });
    }

    const existing = await User.findOne({ username });
    if (existing) {
      return NextResponse.json({ error: 'Username sudah digunakan' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      username,
      password: hashedPassword,
      role: role || 'KASIR',
      name: name || '',
    });

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        username: user.username,
        role: user.role,
        name: user.name,
      },
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Create user error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server', detail: message }, { status: 500 });
  }
}

// PUT /api/users - Update user
export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const token = getTokenFromHeader(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Token tidak valid' }, { status: 401 });
    if (payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak. Hanya admin.' }, { status: 403 });
    }

    const body = await request.json();
    const { id, username, role, name, password } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID user wajib diisi' }, { status: 400 });
    }

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    if (id === payload.id && role && role !== user.role) {
      return NextResponse.json({ error: 'Tidak bisa mengubah role sendiri' }, { status: 400 });
    }

    if (username && username !== user.username) {
      const existing = await User.findOne({ username });
      if (existing) {
        return NextResponse.json({ error: 'Username sudah digunakan' }, { status: 400 });
      }
      user.username = username;
    }

    if (role) user.role = role;
    if (name !== undefined) user.name = name;
    if (password && password.length >= 4) {
      user.password = await hashPassword(password);
    }

    await user.save();

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        username: user.username,
        role: user.role,
        name: user.name,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server', detail: message }, { status: 500 });
  }
}

// DELETE /api/users - Delete user
export async function DELETE(request: NextRequest) {
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
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID user wajib diisi' }, { status: 400 });
    }

    if (id === payload.id) {
      return NextResponse.json({ error: 'Tidak bisa menghapus akun sendiri' }, { status: 400 });
    }

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    await User.findByIdAndDelete(id);

    return NextResponse.json({ message: 'User berhasil dihapus' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server', detail: message }, { status: 500 });
  }
}