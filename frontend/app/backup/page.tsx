'use client';

import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { BackupAPI, IntegrationAPI, type RetentionPolicy } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, ArrowLeft, Download, RefreshCcw, Database, FolderArchive, Tags, CloudUpload, Trash2, Settings2, Infinity, Clock, Pencil, Check, X } from "lucide-react";
import { useState, useEffect } from "react";
import BackupSelect from "@/components/modals/BackupSelect";
import ConfirmDialog from "@/components/modals/ConfirmModal";
import { toast } from "sonner";
import Image from "next/image";
import { formatDate, getS3StatusBadge } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";

type SchemaInfo = {
  tableName: string;
  recordsCount: number;
  status: string;
};

type BackupItem = {
  key: string;
  size: number;
  lastModified: string;
  expiresAt?: string | null;
  s3Status?: 'not_synced' | 'synced' | 'out_of_date';
  s3UploadedAt?: string | null;
};

export default function BackupPage() {
  const { t } = useLanguage();

  // UI State
  const [activeTab, setActiveTab] = useState<'manual' | 'scheduled' | 'pre-sync' | 'schema-change'>('manual');
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Data State
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [availableSchemas, setAvailableSchemas] = useState<SchemaInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [selectedRestoreKey, setSelectedRestoreKey] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  // Sync to S3
  const [syncingKey, setSyncingKey] = useState<string | null>(null);
  const [isSyncingAllS3, setIsSyncingAllS3] = useState(false);

  // Retention policies
  const [retentions, setRetentions] = useState<RetentionPolicy[]>([]);
  const [editingTrigger, setEditingTrigger] = useState<string | null>(null);
  const [editingDays, setEditingDays] = useState<string>('');
  const [savingRetention, setSavingRetention] = useState(false);

  const fetchRetentions = async () => {
    try {
      const data = await BackupAPI.getRetentionPolicies();
      setRetentions(data);
    } catch { /* silent */ }
  };

  const handleSaveRetention = async (trigger: string) => {
    setSavingRetention(true);
    try {
      const days = editingDays === '' || editingDays === '∞' ? null : parseInt(editingDays);
      await BackupAPI.updateRetentionPolicy(trigger, days);
      toast.success(`Đã cập nhật retention cho "${trigger}"`);
      setEditingTrigger(null);
      await fetchRetentions();
    } catch {
      toast.error('Cập nhật thất bại');
    } finally {
      setSavingRetention(false);
    }
  };

  // 1. Fetch Backups based on Tab
  const fetchBackups = async (tab: string) => {
    setIsLoading(true);
    try {
      const response = await BackupAPI.listBackups(`${tab}/`);
      setBackups(response.backups || []);
    } catch (error) {
      console.error("Failed to fetch backups", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSchemas = async () => {
    try {
      const schemas = await IntegrationAPI.getSchemas();
      setAvailableSchemas(schemas || []);
    } catch (error) {
      console.error("Failed to fetch schemas", error);
    }
  };

  // Run when component mounts or tab changes
  useEffect(() => {
    fetchBackups(activeTab);
    setSelectedTable(null); // Reset view when changing tabs
  }, [activeTab]);

  useEffect(() => {
    fetchSchemas();
    void fetchRetentions();
  }, []);

  const uniqueTables = Array.from(
    new Set(backups.map((b) => b.key.split('/')[1]).filter(Boolean))
  );

  const selectedTableBackups = selectedTable 
    ? backups.filter((b) => b.key.includes(`/${selectedTable}/`))
    : [];

  // Actions
  const handleTriggerBackup = async (selectedTables: string[]) => {
    try {
      await BackupAPI.triggerBackup(selectedTables);

      toast.success(
        `${t('backup.toastStarted')} ${selectedTables.length} ${t('backup.toastTables')}`
      );

      setIsModalOpen(false)
      fetchBackups(activeTab);
    } catch (error) {
      toast.error(t('backup.toastErrCreate'));
    }
  };

  const handleDownload = async (key: string) => {
    try {
      await BackupAPI.downloadBackup(key);
      toast.success(t('backup.toastDownload'));
    } catch (error) {
      toast.error(t('backup.toastErrLink'));
    }
  };

  const handleCleanupBackups = async () => {
    try {
      setIsCleaningUp(true);

      const result = await BackupAPI.cleanupBackups();

      toast.success(result.message || 'Cleanup completed');
      fetchBackups(activeTab);
    } catch (error) {
      toast.error(t('backup.toastErrCleanup'));
    } finally {
      setIsCleaningUp(false);
    }
  };

  const handleRestoreClick = (key: string) => {
    setSelectedRestoreKey(key);
    setIsRestoreOpen(true);
  };

  const handleConfirmRestore = async () => {
    if (!selectedRestoreKey) return;

    try {
      setIsRestoring(true);

      await BackupAPI.restoreBackup(selectedRestoreKey);

      toast.success(t('backup.toastRestore'));

      setIsRestoreOpen(false);
      setSelectedRestoreKey(null);

      fetchBackups(activeTab);
    } catch (error) {
      toast.error(t('backup.toastErrRestore'));
    } finally {
      setIsRestoring(false);
    }
  };

  const handleSyncToS3 = async (key: string) => {
    try {
      setSyncingKey(key);

      const result = await BackupAPI.syncToS3(key);

      toast.success(result.message || t('backup.toastS3Done'));
    } catch (error) {
      toast.error(t('backup.toastErrS3'));
    } finally {
      setSyncingKey(null);
    }
  };

  const handleSyncAllToS3 = async () => {
    try {
      setIsSyncingAllS3(true);

      const result = await BackupAPI.syncAllToS3();

      toast.success(result.message || t('backup.toastS3AllDone'));
    } catch (error) {
      toast.error(t('backup.toastErrS3All'));
    } finally {
      setIsSyncingAllS3(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">{t('backup.title')}</h1>

      {/* Toolbar */}
      <div className="flex justify-between items-center">
        {/* Tabs */}
        <div className="flex justify-start gap-2 bg-gray-100 p-1 rounded-md">
          <button 
            onClick={() => setActiveTab('manual')} 
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              activeTab === 'manual' ? 'bg-white shadow' : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            Manual
          </button>
          <button 
            onClick={() => setActiveTab('scheduled')} 
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              activeTab === 'scheduled' ? 'bg-white shadow' : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            Scheduled
          </button>
          <button 
            onClick={() => setActiveTab('pre-sync')} 
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              activeTab === 'pre-sync' ? 'bg-white shadow' : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            Pre-sync
          </button>
          <button 
            onClick={() => setActiveTab('schema-change')} 
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              activeTab === 'schema-change' ? 'bg-white shadow' : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            Schema Change
          </button>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2">
          <button 
            onClick={handleCleanupBackups}
            disabled={isCleaningUp}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-4 py-2 rounded-md transition"
          >
            <Trash2 size={18} />
            <span>
              {isCleaningUp ? t('backup.deleting') : t('backup.deleteExpired')}
            </span>
          </button>
          <button
            onClick={handleSyncAllToS3}
            disabled={isSyncingAllS3}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-4 py-2 rounded-md transition"
          >
            <FolderArchive size={18} />
            <span>
              {isSyncingAllS3 ? t('backup.syncing') : t('backup.syncAll')}
            </span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition"
          >
            <Plus size={18} />
            <span>{t('backup.addBackup')}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="border rounded-md bg-white">
        
        {/* VIEW 1: Show List of Tables */}
        {!selectedTable && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('backup.colTable')}</TableHead>
                <TableHead className="text-right">{t('backup.colAction')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={2} className="text-center py-4">{t('backup.loading')}</TableCell></TableRow>
              ) : uniqueTables.length === 0 ? (
                <TableRow><TableCell colSpan={2} className="text-center py-4">{t('backup.noData')}</TableCell></TableRow>
              ) : (
                uniqueTables.map((tableName) => (
                  <TableRow 
                    key={tableName as string} 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => setSelectedTable(tableName as string)}
                  >
                    <TableCell className="font-medium">{tableName}</TableCell>
                    <TableCell className="text-right text-blue-600">{t('backup.viewHistory')}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}

        {/* VIEW 2: Show Backup History for Selected Table */}
        {selectedTable && (
          <div>
            <div className="p-4 border-b flex items-center gap-4 bg-gray-50">
              <button 
                onClick={() => setSelectedTable(null)}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-black"
              >
                <ArrowLeft size={16} /> {t('backup.back')}
              </button>
              <h2 className="font-semibold text-lg">{t('backup.historyTitle')} <span className="text-blue-600">{selectedTable}</span></h2>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('backup.colFile')}</TableHead>
                  <TableHead>{t('backup.colUpdated')}</TableHead>
                  <TableHead>{t('backup.colS3Updated')}</TableHead>
                  <TableHead>{t('backup.colS3Status')}</TableHead>
                  <TableHead>{t('backup.colExpiry')}</TableHead>
                  <TableHead className="text-right">{t('backup.colAction')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedTableBackups.map((backup) => {
                  // Extract filename from full path (e.g., "manual/users/file.json" -> "file.json")
                  const fileName = backup.key.split('/').pop(); 
                  const time = new Date(backup.lastModified).toLocaleString('vi-VN');

                  return (
                    <TableRow key={backup.key}>
                      <TableCell className="font-medium">{fileName}</TableCell>
                      <TableCell>{formatDate(backup.lastModified)}</TableCell>
                      <TableCell className={`${backup.s3UploadedAt? '' : 'text-center'}`}>{backup.s3UploadedAt? formatDate(backup.s3UploadedAt) : '//'}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {getS3StatusBadge(backup.s3Status)}
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="text-sm">
                          {formatDate(backup.expiresAt)}
                        </span>
                      </TableCell>

                      <TableCell className="text-right space-x-3">
                        <button
                          onClick={() => handleSyncToS3(backup.key)}
                          className="text-orange-500 hover:text-orange-700 disabled:opacity-50"
                          title={t('backup.tooltipUpload')}
                          disabled={syncingKey === backup.key}
                        >
                          <CloudUpload size={18} className={`inline ${syncingKey === backup.key ? 'animate-pulse' : ''}`} />
                        </button>
                        <button 
                          onClick={() => handleDownload(backup.key)}
                          className="text-blue-600 hover:text-blue-800"
                          title={t('backup.tooltipDownload')}
                        >
                          <Download size={18} className="inline" />
                        </button>
                        <button 
                          onClick={() => handleRestoreClick(backup.key)}
                          className="text-orange-500 hover:text-orange-700"
                          title={t('backup.tooltipRestore')}
                        >
                          <RefreshCcw size={18} className="inline" />
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* ── Retention Policy ── */}
      {retentions.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 px-6 py-4 border-b">
            <Settings2 className="w-4 h-4 text-slate-600" />
            <span className="font-semibold text-slate-800">Chính sách lưu trữ (Retention Policy)</span>
            <span className="ml-auto text-xs text-slate-400">Sau khi hết hạn → backup tự động bị xóa khi chạy cleanup</span>
          </div>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 uppercase tracking-wide border-b bg-slate-50">
                  <th className="px-6 py-3 text-left">Loại backup</th>
                  <th className="px-6 py-3 text-left">Mô tả</th>
                  <th className="px-6 py-3 text-left">Giữ trong</th>
                  <th className="px-6 py-3 text-left">Cập nhật lần cuối</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {retentions.map((r) => {
                  const meta: Record<string, { label: string; desc: string; color: string }> = {
                    'manual':        { label: 'Manual',        desc: 'Backup thủ công do admin tạo',             color: 'blue' },
                    'scheduled':     { label: 'Scheduled',     desc: 'Backup tự động hàng tuần (CN 2:00 AM)',    color: 'purple' },
                    'pre-sync':      { label: 'Pre-Sync',      desc: 'Snapshot trước mỗi lần đồng bộ dữ liệu',  color: 'orange' },
                    'schema-change': { label: 'Schema Change', desc: 'Snapshot khi cấu trúc bảng thay đổi',     color: 'green' },
                  };
                  const m = meta[r.trigger] ?? { label: r.trigger, desc: '', color: 'slate' };
                  const colorMap: Record<string, string> = {
                    blue: 'bg-blue-50 text-blue-700', purple: 'bg-purple-50 text-purple-700',
                    orange: 'bg-orange-50 text-orange-700', green: 'bg-green-50 text-green-700',
                    slate: 'bg-slate-100 text-slate-600',
                  };
                  const isEditing = editingTrigger === r.trigger;

                  return (
                    <tr key={r.trigger} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${colorMap[m.color]}`}>
                          {m.label}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-xs text-slate-500">{m.desc}</td>
                      <td className="px-6 py-3">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={1}
                              value={editingDays}
                              onChange={(e) => setEditingDays(e.target.value)}
                              placeholder="∞ = mãi mãi"
                              className="w-28 border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') void handleSaveRetention(r.trigger);
                                if (e.key === 'Escape') setEditingTrigger(null);
                              }}
                            />
                            <span className="text-xs text-slate-400">ngày (để trống = vĩnh viễn)</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            {r.days === null ? (
                              <><Infinity className="w-4 h-4 text-green-600" /><span className="text-green-700 font-medium text-sm">Vĩnh viễn</span></>
                            ) : (
                              <><Clock className="w-4 h-4 text-blue-500" /><span className="font-medium text-sm">{r.days} ngày</span></>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3 text-xs text-slate-400">
                        {new Date(r.updatedAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                      </td>
                      <td className="px-6 py-3 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => void handleSaveRetention(r.trigger)}
                              disabled={savingRetention}
                              className="p-1.5 rounded hover:bg-green-50 text-green-600 disabled:opacity-50"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingTrigger(null)}
                              className="p-1.5 rounded hover:bg-red-50 text-red-500"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setEditingTrigger(r.trigger); setEditingDays(r.days?.toString() ?? ''); }}
                            className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <BackupSelect
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        schemas={availableSchemas}
        onStartSync={handleTriggerBackup}
        title={t('backup.selectTitle')}
        subtitle={t('backup.selectSubtitle')}
        searchPlaceholder={t('backup.searchPlaceholder')}
        startButtonLabel={t('backup.startBtn')}
      />

      <ConfirmDialog
        open={isRestoreOpen}
        onOpenChange={setIsRestoreOpen}
        title={t('backup.restoreTitle')}
        description={t('backup.restoreDesc')}
        confirmText={t('backup.restoreBtn')}
        cancelText={t('backup.cancelBtn')}
        destructive
        loading={isRestoring}
        onConfirm={handleConfirmRestore}
      />
    </div>
  );
}