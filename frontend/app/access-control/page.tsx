'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AccessControlAPI,
  IntegrationAPI,
  type RoleSummary,
  type UserPermissionSummary,
} from '@/lib/api-client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Shield, Users, TableProperties, Pencil } from 'lucide-react';

type EditableState = {
  userId: number;
  username: string;
  roleId: number;
  tablePatterns: string[];
};

export default function AccessControlPage() {
  const [users, setUsers] = useState<UserPermissionSummary[]>([]);
  const [roles, setRoles] = useState<RoleSummary[]>([]);
  const [knownTables, setKnownTables] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState<EditableState | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [usersData, rolesData, schemas] = await Promise.all([
        AccessControlAPI.getUsersPermissionSummary(),
        AccessControlAPI.getRoles(),
        IntegrationAPI.getSchemas(),
      ]);

      setUsers(usersData);
      setRoles(rolesData);

      const schemaTables = Array.isArray(schemas)
        ? schemas
            .map((schema: { tableName?: string }) => schema.tableName)
            .filter((tableName): tableName is string => Boolean(tableName))
        : [];

      const patternTables = usersData.flatMap((u) => u.role?.tablePatterns ?? []);
      const merged = Array.from(new Set([...schemaTables, ...patternTables])).sort((a, b) =>
        a.localeCompare(b),
      );
      setKnownTables(merged);
    } catch {
      setError('Không thể tải dữ liệu phân quyền. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const selectedRole = useMemo(() => {
    if (!editing) return null;
    return roles.find((role) => role.id === editing.roleId) ?? null;
  }, [editing, roles]);

  const openEdit = (user: UserPermissionSummary) => {
    setSuccess('');
    setError('');
    
    let roleId = user.role?.id;
    let tablePatterns = user.role?.tablePatterns ?? [];
    
    // If user has no role, find the default 'user' role
    if (!roleId) {
      const defaultRole = roles.find((r) => r.type === 'user');
      if (!defaultRole) {
        setError('Không tìm thấy default role "user". Vui lòng kiểm tra cấu hình server.');
        return;
      }
      roleId = defaultRole.id;
      tablePatterns = [];
    }
    
    setEditing({
      userId: user.userId,
      username: user.username,
      roleId,
      tablePatterns: [...tablePatterns],
    });
  };

  const closeDialog = () => setEditing(null);

  const handleRoleChange = (roleId: number) => {
    if (!editing) return;
    const nextRole = roles.find((r) => r.id === roleId);
    setEditing({
      ...editing,
      roleId,
      tablePatterns: nextRole?.type === 'admin' ? [] : editing.tablePatterns,
    });
  };

  const togglePattern = (tableName: string) => {
    if (!editing || selectedRole?.type === 'admin') return;
    const exists = editing.tablePatterns.includes(tableName);
    setEditing({
      ...editing,
      tablePatterns: exists
        ? editing.tablePatterns.filter((pattern) => pattern !== tableName)
        : [...editing.tablePatterns, tableName],
    });
  };

  const handleSave = async () => {
    if (!editing) return;

    const user = users.find((u) => u.userId === editing.userId);
    const oldRoleId = user?.role?.id;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Always update role (whether user had no role before or role changed)
      if (!oldRoleId || oldRoleId !== editing.roleId) {
        await AccessControlAPI.assignRole(editing.userId, editing.roleId);
      }

      if (selectedRole?.type !== 'admin') {
        await AccessControlAPI.updateTablePatterns(editing.userId, editing.tablePatterns);
      }

      await fetchData();
      setSuccess(`Đã cập nhật phân quyền cho ${editing.username}.`);
      closeDialog();
    } catch {
      setError('Cập nhật thất bại. Vui lòng kiểm tra quyền admin và thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const roleStats = useMemo(() => {
    return users.reduce(
      (acc, user) => {
        const type = user.role?.type;
        if (type === 'admin') acc.admin += 1;
        if (type === 'reader') acc.reader += 1;
        if (type === 'writer') acc.writer += 1;
        if (type === 'user') acc.user += 1;
        if (!type) acc.unassigned += 1;
        return acc;
      },
      { admin: 0, reader: 0, writer: 0, user: 0, unassigned: 0 },
    );
  }, [users]);

  return (
    <div className="space-y-6 max-w-7xl pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Access Control</h1>
        <p className="text-slate-500 mt-1">Quản lý role và danh sách bảng được phép truy cập cho từng người dùng.</p>
      </div>

      {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Người dùng</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="text-3xl font-bold text-slate-900">{users.length}</span>
            <Users className="h-5 w-5 text-slate-400" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Role đang dùng</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="text-3xl font-bold text-slate-900">{roles.length}</span>
            <Shield className="h-5 w-5 text-slate-400" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Bảng khả dụng</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="text-3xl font-bold text-slate-900">{knownTables.length}</span>
            <TableProperties className="h-5 w-5 text-slate-400" />
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Danh sách phân quyền</CardTitle>
          <Button variant="outline" size="sm" onClick={() => void fetchData()} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Làm mới
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Bảng được truy cập</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.userId}>
                    <TableCell className="font-semibold text-slate-800">{user.username}</TableCell>
                    <TableCell className="text-slate-600">{user.email}</TableCell>
                    <TableCell>
                      {user.role ? (
                        <Badge variant="outline" className={`capitalize ${
                          user.role.type === 'admin' ? 'bg-slate-100' :
                          user.role.type === 'reader' ? 'bg-blue-100' :
                          user.role.type === 'writer' ? 'bg-emerald-100' :
                          user.role.type === 'user' ? 'bg-purple-100' :
                          ''
                        }`}>
                          {user.role.roleName} ({user.role.type})
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-50 text-red-700">No role</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.role?.type === 'admin' ? (
                        <span className="text-sm text-emerald-700">Toàn bộ bảng</span>
                      ) : user.role?.tablePatterns?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {user.role.tablePatterns.slice(0, 4).map((pattern) => (
                            <Badge key={pattern} variant="secondary">{pattern}</Badge>
                          ))}
                          {user.role.tablePatterns.length > 4 ? (
                            <Badge variant="secondary">+{user.role.tablePatterns.length - 4}</Badge>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">Chưa có quyền bảng</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(user)}
                        // disabled={!user.role}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Chỉnh sửa
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Thống kê role</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 text-sm">
          <Badge className="bg-slate-900 text-white hover:bg-slate-900">Admin: {roleStats.admin}</Badge>
          <Badge className="bg-blue-600 text-white hover:bg-blue-600">Reader: {roleStats.reader}</Badge>
          <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Writer: {roleStats.writer}</Badge>
          <Badge className="bg-purple-600 text-white hover:bg-purple-600">User: {roleStats.user}</Badge>
          {roleStats.unassigned > 0 && <Badge className="bg-red-600 text-white hover:bg-red-600">Unassigned: {roleStats.unassigned}</Badge>}
        </CardContent>
      </Card>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa quyền người dùng: {editing?.username}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role-select">Role</Label>
              <select
                id="role-select"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                value={editing?.roleId ?? ''}
                onChange={(event) => handleRoleChange(Number(event.target.value))}
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.roleName} ({role.type})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Bảng được truy cập</Label>
              {selectedRole?.type === 'admin' ? (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                  Role admin có toàn quyền, không cần chọn bảng cụ thể.
                </div>
              ) : selectedRole?.type === 'user' ? (
                <div className="rounded-md border border-purple-200 bg-purple-50 p-3 text-sm text-purple-700">
                  Role user không có quyền truy cập bảng mặc định. Vui lòng nâng cấp lên reader hoặc writer để cấp quyền.
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto rounded-md border border-slate-200 p-3">
                  {knownTables.length === 0 ? (
                    <p className="text-sm text-slate-500">Chưa có danh sách bảng để chọn.</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {knownTables.map((tableName) => {
                        const checked = Boolean(editing?.tablePatterns.includes(tableName));
                        return (
                          <label
                            key={tableName}
                            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-50"
                          >
                            <input
                              type="checkbox"
                              className="h-4 w-4"
                              checked={checked}
                              onChange={() => togglePattern(tableName)}
                            />
                            <span className="font-mono text-sm text-slate-700">{tableName}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={saving}>
              Hủy
            </Button>
            <Button onClick={() => void handleSave()} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}