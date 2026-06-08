'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus, Pencil, Trash2, Users, Search, Shield, UserCog } from 'lucide-react';

interface UserData {
  id: string;
  username: string;
  role: string;
  name: string;
  createdAt: string;
}

export default function UserManagement() {
  const { token } = useStore();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [form, setForm] = useState({
    id: '',
    username: '',
    password: '',
    role: 'KASIR',
    name: '',
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok) setUsers(json.users);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openCreateDialog = () => {
    setForm({ id: '', username: '', password: '', role: 'KASIR', name: '' });
    setEditMode(false);
    setError('');
    setDialogOpen(true);
  };

  const openEditDialog = (user: UserData) => {
    setForm({ id: user.id, username: user.username, password: '', role: user.role, name: user.name });
    setEditMode(true);
    setError('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const url = editMode ? '/api/users' : '/api/users';
      const method = editMode ? 'PUT' : 'POST';

      const body: Record<string, unknown> = {
        username: form.username,
        role: form.role,
        name: form.name,
      };

      if (editMode) {
        body.id = form.id;
        if (form.password) body.password = form.password;
      } else {
        body.password = form.password;
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (res.ok) {
        setDialogOpen(false);
        fetchUsers();
      } else {
        setError(json.error || 'Gagal menyimpan user');
      }
    } catch {
      setError('Terjadi kesalahan koneksi');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/users?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok) {
        setDeleteConfirm(null);
        fetchUsers();
      } else {
        alert(json.error || 'Gagal menghapus user');
      }
    } catch {
      alert('Terjadi kesalahan koneksi');
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  const adminCount = users.filter((u) => u.role === 'ADMIN').length;
  const kasirCount = users.filter((u) => u.role === 'KASIR').length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Kelola User</h1>
          <p className="text-sm text-muted-foreground">Tambah, edit, dan hapus akun admin & kasir</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2" onClick={openCreateDialog}>
          <Plus className="w-4 h-4" />
          Tambah User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{users.length}</p>
              <p className="text-xs text-muted-foreground">Total User</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{adminCount}</p>
              <p className="text-xs text-muted-foreground">Admin</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
              <UserCog className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{kasirCount}</p>
              <p className="text-xs text-muted-foreground">Kasir</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Cari user..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10"
        />
      </div>

      {/* User Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Belum ada user</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left text-xs font-semibold p-3">Username</th>
                    <th className="text-left text-xs font-semibold p-3 hidden sm:table-cell">Nama</th>
                    <th className="text-left text-xs font-semibold p-3">Role</th>
                    <th className="text-left text-xs font-semibold p-3 hidden md:table-cell">Terdaftar</th>
                    <th className="text-right text-xs font-semibold p-3">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-3">
                        <p className="font-medium text-sm">{user.username}</p>
                      </td>
                      <td className="p-3 hidden sm:table-cell">
                        <p className="text-sm text-muted-foreground">{user.name || '-'}</p>
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            user.role === 'ADMIN'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="p-3 hidden md:table-cell">
                        <p className="text-xs text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
                            onClick={() => openEditDialog(user)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                            onClick={() => setDeleteConfirm(user.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editMode ? 'Edit User' : 'Tambah User Baru'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {error && (
              <div className="p-2 bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Username</label>
              <Input
                placeholder="Masukkan username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Password {editMode && <span className="text-muted-foreground font-normal">(kosongkan jika tidak diubah)</span>}
              </label>
              <Input
                type="password"
                placeholder={editMode ? 'Kosongkan jika tidak diubah' : 'Masukkan password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Nama Lengkap</label>
              <Input
                placeholder="Masukkan nama lengkap"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select value={form.role} onValueChange={(val) => setForm({ ...form, role: val })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="KASIR">Kasir</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleSave}
              disabled={saving || !form.username || (!editMode && !form.password)}
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editMode ? 'Simpan Perubahan' : 'Buat User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus User</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Apakah kamu yakin ingin menghapus user ini? Aksi ini tidak bisa dibatalkan.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Batal
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}