'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Pencil, Trash2, Users, Search, Shield, UserCog } from 'lucide-react';

interface UserData {
  id: string;
  username: string;
  role: string;
  name: string;
  createdAt: string;
}

export default function UserManagement() {
  const token = useStore((s) => s.token);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
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

  const fetchUsers = async (authToken: string) => {
    setLoading(true);
    setFetchError('');
    try {
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const json = await res.json();
      if (res.ok) {
        setUsers(json.users || []);
      } else {
        setFetchError(json.detail || json.error || 'Gagal memuat data user');
        console.error('Fetch users failed:', json);
      }
    } catch (err) {
      setFetchError('Terjadi kesalahan koneksi');
      console.error('Fetch users error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUsers(token);
    }
  }, [token]);

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
      const authToken = useStore.getState().token;
      if (!authToken) {
        setError('Sesi sudah berakhir, silakan login ulang');
        setSaving(false);
        return;
      }
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

      const res = await fetch('/api/users', {
        method: editMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (res.ok) {
        setDialogOpen(false);
        fetchUsers(authToken);
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
      const authToken = useStore.getState().token;
      if (!authToken) {
        alert('Sesi sudah berakhir, silakan login ulang');
        return;
      }
      const res = await fetch(`/api/users?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const json = await res.json();
      if (res.ok) {
        setDeleteConfirm(null);
        fetchUsers(authToken);
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Kelola User</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Tambah, edit, dan hapus akun admin &amp; kasir</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 w-full sm:w-auto text-sm" onClick={openCreateDialog}>
          <Plus className="w-4 h-4" />
          Tambah User
        </Button>
      </div>

      {/* Stats Cards - horizontal scroll di mobile */}
      <div className="flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0 -mx-1 px-1">
        <Card className="min-w-[140px] sm:min-w-0 shrink-0">
          <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold">{users.length}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Total User</p>
            </div>
          </CardContent>
        </Card>
        <Card className="min-w-[140px] sm:min-w-0 shrink-0">
          <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold">{adminCount}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Admin</p>
            </div>
          </CardContent>
        </Card>
        <Card className="min-w-[140px] sm:min-w-0 shrink-0">
          <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-amber-100 dark:bg-amber-950 flex items-center justify-center shrink-0">
              <UserCog className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold">{kasirCount}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Kasir</p>
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
          className="pl-9 h-10 text-sm"
        />
      </div>

      {/* Fetch Error */}
      {fetchError && (
        <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">{fetchError}</p>
          <Button variant="outline" size="sm" className="text-xs text-red-600 border-red-300 hover:bg-red-100 shrink-0" onClick={() => token && fetchUsers(token)}>
            Coba Lagi
          </Button>
        </div>
      )}

      {/* Users List - card layout di mobile, table di desktop */}
      <Card>
        <CardContent className="p-2 sm:p-0">
          {!token ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-sm">Menunggu autentikasi...</p>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">{fetchError ? 'Tidak dapat memuat data' : 'Belum ada user'}</p>
            </div>
          ) : (
            <>
              {/* Mobile: Card Layout */}
              <div className="space-y-2 sm:hidden">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center shrink-0">
                      <span className="text-emerald-700 dark:text-emerald-300 font-bold text-sm">
                        {user.name?.charAt(0).toUpperCase() || user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{user.name || user.username}</p>
                      <p className="text-xs text-muted-foreground">@{user.username}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            user.role === 'ADMIN'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                          }`}
                        >
                          {user.role}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-600"
                        onClick={() => openEditDialog(user)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600"
                        onClick={() => setDeleteConfirm(user.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: Table Layout */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left text-xs font-semibold p-3">Username</th>
                      <th className="text-left text-xs font-semibold p-3">Nama</th>
                      <th className="text-left text-xs font-semibold p-3">Role</th>
                      <th className="text-left text-xs font-semibold p-3">Terdaftar</th>
                      <th className="text-right text-xs font-semibold p-3">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="p-3">
                          <p className="font-medium text-sm">{user.username}</p>
                        </td>
                        <td className="p-3">
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
                        <td className="p-3">
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
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog - responsive */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/60" onClick={() => setDialogOpen(false)} />
          <div className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 bg-card rounded-lg shadow-xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">{editMode ? 'Edit User' : 'Tambah User Baru'}</h2>
            <div className="space-y-3 sm:space-y-4">
              {error && (
                <div className="p-2 bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded text-sm">
                  {error}
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Username</label>
                <Input
                  placeholder="Masukkan username"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Password {editMode && <span className="text-muted-foreground font-normal">(kosongkan jika tidak diubah)</span>}
                </label>
                <Input
                  type="password"
                  placeholder={editMode ? 'Kosongkan jika tidak diubah' : 'Masukkan password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Nama Lengkap</label>
                <Input
                  placeholder="Masukkan nama lengkap"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="ADMIN">Admin</option>
                  <option value="KASIR">Kasir</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <Button variant="outline" className="flex-1 text-sm" onClick={() => setDialogOpen(false)}>Batal</Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm"
                onClick={handleSave}
                disabled={saving || !form.username || (!editMode && !form.password)}
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {editMode ? 'Simpan' : 'Buat User'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog - responsive */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/60" onClick={() => setDeleteConfirm(null)} />
          <div className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 bg-card rounded-lg shadow-xl p-4 sm:p-6">
            <h2 className="text-lg font-semibold mb-2">Hapus User</h2>
            <p className="text-sm text-muted-foreground mb-5">
              Apakah kamu yakin ingin menghapus user ini? Aksi ini tidak bisa dibatalkan.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 text-sm" onClick={() => setDeleteConfirm(null)}>Batal</Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm"
                onClick={() => handleDelete(deleteConfirm)}
              >
                Hapus
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}