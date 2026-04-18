'use client';

import { useEffect, useState } from 'react';
import {
  AccessControlAPI,
  type RoleType,
  type UserPermissionSummary,
} from '@/lib/api-client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

type EditState = {
  userId: number;
  username: string;
  role: RoleType;
  readScopes: string;
  writeScopes: string;
};

export default function AccessControlPage() {
  const [users, setUsers] = useState<UserPermissionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
        <CardHeader>
          <CardTitle>Users</CardTitle>
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
                  <th className="p-2 border text-left">User</th>
                  <th className="p-2 border text-left">Role</th>
                  <th className="p-2 border text-left">Read</th>
                  <th className="p-2 border text-left">Write</th>
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

                    <td className="p-2 border">
                      <Button size="sm" onClick={() => openEdit(u)}>
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* EDIT PANEL */}
      {editing && (
        <Card className="fixed inset-y-0 right-0 z-50 w-80 bg-white shadow-xl border-l p-4 overflow-y-auto">
          <CardHeader>
            <CardTitle>Edit: {editing.username}</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* ROLE */}
            <div>
              <label className="text-sm font-medium">Role</label>
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
              <label className="text-sm font-medium">
                Read Scopes (1 per line)
              </label>
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
                <label className="text-sm font-medium">
                  Write Scopes (1 per line)
                </label>
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
                {saving ? 'Saving...' : 'Save'}
              </Button>

              <Button variant="outline" onClick={closeEdit}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}