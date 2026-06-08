'use client';

import { useEffect, useState } from 'react';
import {
  AccessControlAPI,
  type RoleType,
  type UserPermissionSummary,
} from '@/lib/api-client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, UserPlus, Shield, ShieldOff } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

type EditState = {
  userId: number;
  username: string;
  role: RoleType;
  readScopes: string;
  writeScopes: string;
};

export default function AccessControlPage() {
  const { t } = useLanguage();
  const [users, setUsers] = useState<UserPermissionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Add user modal
  const [addOpen, setAddOpen] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', fullName: '' });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // VPN IP inline edit
  const [editingVpnId, setEditingVpnId] = useState<number | null>(null);
  const [vpnIpInput, setVpnIpInput] = useState('');

  const handleSaveVpnIp = async (userId: number) => {
    try {
      await AccessControlAPI.setVpnIp(userId, vpnIpInput.trim() || null);
      setEditingVpnId(null);
      setSuccess('Đã cập nhật VPN IP.');
      await fetchData();
    } catch {
      setError('Cập nhật VPN IP thất bại.');
    }
  };

  // FETCH
  const fetchData = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await AccessControlAPI.getUsersPermissionSummary();
      setUsers(res);
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  // OPEN EDIT
  const openEdit = (user: UserPermissionSummary) => {
    setEditing({
      userId: user.userId,
      username: user.username,
      role: user.role ?? 'user',
      readScopes: (user.roleSettings?.readScopes ?? []).join('\n'),
      writeScopes: (user.roleSettings?.writeScopes ?? []).join('\n'),
    });
  };

  const closeEdit = () => setEditing(null);

  const handleCreate = async () => {
    setCreateError('');
    if (!newUser.username || !newUser.email || !newUser.password) {
      setCreateError('Vui lòng điền đầy đủ thông tin bắt buộc.');
      return;
    }
    setCreating(true);
    try {
      await AccessControlAPI.createUser(newUser);
      setAddOpen(false);
      setNewUser({ username: '', email: '', password: '', fullName: '' });
      setSuccess(`Đã tạo tài khoản "${newUser.username}"`);
      await fetchData();
    } catch (err: any) {
      setCreateError(err?.response?.data?.message ?? 'Tạo tài khoản thất bại.');
    } finally {
      setCreating(false);
    }
  };

  // SAVE
  const handleSave = async () => {
    if (!editing) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const readScopes = editing.readScopes
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const writeScopes = editing.writeScopes
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      // update role
      await AccessControlAPI.assignRole(editing.userId, editing.role);

      // update scopes (if not admin)
      if (editing.role !== 'admin') {
        await AccessControlAPI.updateRoleSettings(editing.userId, {
          readScopes,
          writeScopes: editing.role === 'writer' ? writeScopes : [],
        });
      }

      setSuccess(`Updated ${editing.username}`);
      closeEdit();
      await fetchData();
    } catch {
      setError('Save failed');
    } finally {
      setSaving(false);
    }
  };

  // UI
  return (
    <div className="max-w-6xl mx-auto py-6 space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Users</CardTitle>
          <Button onClick={() => { setCreateError(''); setAddOpen(true); }} className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" /> {t('ac.addUser')}
          </Button>
        </CardHeader>

        <CardContent>
          {error && <div className="text-red-600 mb-2">{error}</div>}
          {success && <div className="text-green-600 mb-2">{success}</div>}

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin h-6 w-6" />
            </div>
          ) : (
            <table className="w-full text-sm border">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-2 border text-left">{t('ac.colUser')}</th>
                  <th className="p-2 border text-left">{t('ac.colRole')}</th>
                  <th className="p-2 border text-left">{t('ac.colRead')}</th>
                  <th className="p-2 border text-left">{t('ac.colWrite')}</th>
                  <th className="p-2 border text-left">VPN IP</th>
                  <th className="p-2 border"></th>
                </tr>
              </thead>

              <tbody>
                {users.map((u) => (
                  <tr key={u.userId} className="hover:bg-slate-50">
                    <td className="p-2 border">{u.username}</td>
                    <td className="p-2 border">{u.role}</td>

                    <td className="p-2 border text-xs">
                      {(u.roleSettings?.readScopes ?? []).join(', ')}
                    </td>

                    <td className="p-2 border text-xs">
                      {(u.roleSettings?.writeScopes ?? []).join(', ')}
                    </td>

                    <td className="p-2 border text-xs min-w-[160px]">
                      {editingVpnId === u.userId ? (
                        <div className="flex gap-1 items-center">
                          <Input
                            value={vpnIpInput}
                            onChange={(e) => setVpnIpInput(e.target.value)}
                            placeholder="10.8.0.x"
                            className="h-7 text-xs w-28 font-mono"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') void handleSaveVpnIp(u.userId);
                              if (e.key === 'Escape') setEditingVpnId(null);
                            }}
                          />
                          <Button size="sm" className="h-7 px-2 text-xs" onClick={() => handleSaveVpnIp(u.userId)}>✓</Button>
                          <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => setEditingVpnId(null)}>✕</Button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditingVpnId(u.userId); setVpnIpInput(u.vpnIp ?? ''); }}
                          className="flex items-center gap-1.5 group w-full"
                        >
                          {u.vpnIp ? (
                            <><Shield className="w-3 h-3 text-green-600" /><span className="font-mono text-green-700">{u.vpnIp}</span></>
                          ) : (
                            <><ShieldOff className="w-3 h-3 text-slate-400" /><span className="text-slate-400 italic">Chưa gán</span></>
                          )}
                        </button>
                      )}
                    </td>

                    <td className="p-2 border">
                      <Button size="sm" onClick={() => openEdit(u)}>
                        {t('ac.edit')}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* ADD USER MODAL */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" /> {t('ac.addTitle')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {createError && <div className="text-red-600 text-sm">{createError}</div>}
            <div>
              <label className="text-sm font-medium block mb-1">{t('ac.labelUsername')} *</label>
              <Input
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                placeholder="vd: nguyen_van_a"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">{t('ac.labelEmail')} *</label>
              <Input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="vd: a@truong.edu.vn"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">{t('ac.labelPassword')} *</label>
              <Input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">{t('ac.labelFullName')}</label>
              <Input
                value={newUser.fullName}
                onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                placeholder="vd: Nguyễn Văn A"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t('ac.creating')}</> : t('ac.create')}
              </Button>
              <Button variant="outline" onClick={() => setAddOpen(false)}>{t('ac.cancel')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* EDIT PANEL */}
      {editing && (
        <Card className="fixed inset-y-0 right-0 z-50 w-80 bg-white shadow-xl border-l p-4 overflow-y-auto">
          <CardHeader>
            <CardTitle>{t('ac.editTitle')} {editing.username}</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* ROLE */}
            <div>
              <label className="text-sm font-medium">{t('ac.labelRole')}</label>
              <select
                className="w-full border p-2 rounded"
                value={editing.role}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    role: e.target.value as RoleType,
                  })
                }
              >
                <option value="admin">admin</option>
                <option value="reader">reader</option>
                <option value="writer">writer</option>
                <option value="user">user</option>
              </select>
            </div>

            {/* READ SCOPES */}
            <div>
              <label className="text-sm font-medium">{t('ac.labelRead')}</label>
              <textarea
                className="w-full border p-2 rounded font-mono text-xs h-24"
                value={editing.readScopes}
                onChange={(e) =>
                  setEditing({ ...editing, readScopes: e.target.value })
                }
                placeholder={'VD: ^dm_dan_toc$'}
              />
            </div>

            {/* WRITE SCOPES */}
            {editing.role === 'writer' && (
              <div>
                <label className="text-sm font-medium">{t('ac.labelWrite')}</label>
                <textarea
                  className="w-full border p-2 rounded font-mono text-xs h-24"
                  value={editing.writeScopes}
                  onChange={(e) =>
                    setEditing({ ...editing, writeScopes: e.target.value })
                  }
                />
              </div>
            )}

            {/* ACTIONS */}
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? t('ac.saving') : t('ac.save')}
              </Button>

              <Button variant="outline" onClick={closeEdit}>
                {t('ac.cancel')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}