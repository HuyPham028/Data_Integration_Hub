'use client';

import { useState, useEffect, useCallback } from 'react';
import { Layers, Plus, Pencil, Trash2, Play, X, ChevronDown, ChevronUp, RefreshCw, Loader2 } from 'lucide-react';
import { ViewsAPI, ViewDefinition, ViewPreviewResult } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/lib/i18n';

// ─── Types ────────────────────────────────────────────────────────────────────

type Mode = 'list' | 'create' | 'edit';

// ─── SQL Editor (simple textarea) ─────────────────────────────────────────────

function SqlEditor({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={6}
      spellCheck={false}
      className="w-full rounded-md border border-slate-300 bg-slate-950 p-3 font-mono text-sm text-green-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
    />
  );
}

// ─── Preview Table ─────────────────────────────────────────────────────────────

function PreviewTable({ data }: { data: ViewPreviewResult }) {
  if (data.rows.length === 0) {
    return <p className="text-sm text-slate-500 italic">Query hợp lệ nhưng không có dòng nào.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-md border border-slate-200">
      <table className="min-w-full text-xs">
        <thead className="bg-slate-100">
          <tr>
            {data.columns.map((col) => (
              <th key={col} className="px-3 py-2 text-left font-semibold text-slate-600 whitespace-nowrap">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
              {data.columns.map((col) => (
                <td key={col} className="px-3 py-1.5 text-slate-700 whitespace-nowrap max-w-xs truncate">
                  {row[col] == null ? <span className="text-slate-400 italic">null</span> : String(row[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Form (Create / Edit) ──────────────────────────────────────────────────────

function ViewForm({
  initial,
  onSave,
  onCancel,
  isEdit,
}: {
  initial?: ViewDefinition;
  onSave: (data: { viewName: string; sqlQuery: string; description: string }) => Promise<void>;
  onCancel: () => void;
  isEdit: boolean;
}) {
  const { t } = useLanguage();
  const [viewName, setViewName] = useState(initial?.viewName ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [sqlQuery, setSqlQuery] = useState(initial?.sqlQuery ?? '');
  const [preview, setPreview] = useState<ViewPreviewResult | null>(null);
  const [previewError, setPreviewError] = useState('');
  const [previewing, setPreviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const handlePreview = async () => {
    if (!sqlQuery.trim()) return;
    setPreviewing(true);
    setPreviewError('');
    setPreview(null);
    try {
      const result = await ViewsAPI.preview(sqlQuery);
      setPreview(result);
      setShowPreview(true);
    } catch (e: any) {
      setPreviewError(e?.response?.data?.message ?? 'Lỗi khi chạy preview.');
      setShowPreview(true);
    } finally {
      setPreviewing(false);
    }
  };

  const handleSave = async () => {
    if (!viewName.trim()) { setError(t('view.errName')); return; }
    if (!sqlQuery.trim()) { setError(t('view.errSql')); return; }
    setError('');
    setSaving(true);
    try {
      await onSave({ viewName: viewName.trim(), sqlQuery: sqlQuery.trim(), description: description.trim() });
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Lỗi khi lưu view.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
      <h2 className="text-lg font-semibold text-slate-800">
        {isEdit ? t('view.edit') : t('view.createBtn')}
      </h2>

      {/* View Name */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">{t('view.name')} <span className="text-red-500">*</span></label>
          <Input
            value={viewName}
            onChange={(e) => setViewName(e.target.value)}
            placeholder={t('view.namePlaceholder')}
            disabled={isEdit}
            className={isEdit ? 'bg-slate-100 cursor-not-allowed' : ''}
          />
          {isEdit && <p className="text-xs text-slate-400">Tên view không thể thay đổi sau khi tạo.</p>}
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">{t('view.desc')}</label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('view.descPlaceholder')}
          />
        </div>
      </div>

      {/* SQL Editor */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">{t('view.sql')} <span className="text-red-500">*</span></label>
        <SqlEditor value={sqlQuery} onChange={setSqlQuery} placeholder={t('view.sqlPlaceholder')} />
        <p className="text-xs text-slate-400">Chỉ cho phép câu lệnh SELECT. Không được chứa DROP, INSERT, UPDATE, DELETE.</p>
      </div>

      {/* Error */}
      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {/* Preview */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePreview} disabled={previewing || !sqlQuery.trim()}>
            {previewing ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Play className="mr-1 h-4 w-4" />}
            {t('view.preview')}
          </Button>
          {(preview || previewError) && (
            <button onClick={() => setShowPreview(!showPreview)} className="flex items-center text-xs text-slate-500 hover:text-slate-700">
              {t('view.previewTitle')}
              {showPreview ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />}
            </button>
          )}
        </div>

        {showPreview && (
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            {previewError
              ? <p className="text-sm text-red-600">{previewError}</p>
              : preview
                ? <PreviewTable data={preview} />
                : null}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {t('view.save')}
        </Button>
        <Button variant="outline" onClick={onCancel}>{t('view.cancel')}</Button>
      </div>
    </div>
  );
}

// ─── View Row (expandable SQL) ─────────────────────────────────────────────────

function ViewRow({
  view,
  onEdit,
  onDrop,
}: {
  view: ViewDefinition;
  onEdit: (v: ViewDefinition) => void;
  onDrop: (v: ViewDefinition) => void;
}) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr className="border-b border-slate-100 hover:bg-slate-50">
        <td className="px-4 py-3 font-mono text-sm font-medium text-blue-700">{view.viewName}</td>
        <td className="px-4 py-3 text-sm text-slate-600">{view.description ?? <span className="italic text-slate-400">—</span>}</td>
        <td className="px-4 py-3 text-xs text-slate-500">{new Date(view.updatedAt).toLocaleString('vi-VN')}</td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setExpanded(!expanded)}
              className="rounded px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
              title="Xem SQL"
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            <button
              onClick={() => onEdit(view)}
              className="rounded p-1 text-slate-400 hover:bg-blue-50 hover:text-blue-600"
              title={t('view.edit')}
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDrop(view)}
              className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
              title={t('view.drop')}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-slate-100 bg-slate-950">
          <td colSpan={4} className="px-4 py-3">
            <pre className="text-xs text-green-400 whitespace-pre-wrap font-mono">{view.sqlQuery}</pre>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ViewsPage() {
  const { t } = useLanguage();
  const [views, setViews] = useState<ViewDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>('list');
  const [editTarget, setEditTarget] = useState<ViewDefinition | null>(null);
  const [dropTarget, setDropTarget] = useState<ViewDefinition | null>(null);
  const [dropping, setDropping] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setViews(await ViewsAPI.list());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (data: { viewName: string; sqlQuery: string; description: string }) => {
    await ViewsAPI.create(data);
    showToast(t('view.successCreate'));
    setMode('list');
    load();
  };

  const handleUpdate = async (data: { viewName: string; sqlQuery: string; description: string }) => {
    if (!editTarget) return;
    await ViewsAPI.update(editTarget.id, { sqlQuery: data.sqlQuery, description: data.description });
    showToast(t('view.successUpdate'));
    setMode('list');
    setEditTarget(null);
    load();
  };

  const handleDrop = async () => {
    if (!dropTarget) return;
    setDropping(true);
    try {
      await ViewsAPI.drop(dropTarget.id);
      showToast(t('view.successDrop'));
      setDropTarget(null);
      load();
    } finally {
      setDropping(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-100 p-2">
            <Layers className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t('view.title')}</h1>
            <p className="text-sm text-slate-500">{t('view.subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <RefreshCw className="h-4 w-4" />
          </button>
          {mode === 'list' && (
            <Button onClick={() => { setEditTarget(null); setMode('create'); }}>
              <Plus className="mr-2 h-4 w-4" />
              {t('view.createBtn')}
            </Button>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="rounded-md bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-700 flex items-center justify-between">
          {toast}
          <button onClick={() => setToast('')}><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Form */}
      {(mode === 'create' || mode === 'edit') && (
        <ViewForm
          initial={editTarget ?? undefined}
          isEdit={mode === 'edit'}
          onSave={mode === 'edit' ? handleUpdate : handleCreate}
          onCancel={() => { setMode('list'); setEditTarget(null); }}
        />
      )}

      {/* List */}
      {mode === 'list' && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : views.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
              <Layers className="h-10 w-10 opacity-30" />
              <p className="text-sm">{t('view.noViews')}</p>
            </div>
          ) : (
            <table className="min-w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{t('view.colName')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{t('view.colDesc')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{t('view.colUpdated')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{t('view.colActions')}</th>
                </tr>
              </thead>
              <tbody>
                {views.map((v) => (
                  <ViewRow
                    key={v.id}
                    view={v}
                    onEdit={(view) => { setEditTarget(view); setMode('edit'); }}
                    onDrop={setDropTarget}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Drop Confirm Modal */}
      {dropTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-red-100 p-2">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">{t('view.drop')}</h3>
            </div>
            <p className="text-sm text-slate-600">{t('view.confirmDrop')}</p>
            <p className="rounded-md bg-slate-100 px-3 py-2 font-mono text-sm text-slate-700">{dropTarget.viewName}</p>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setDropTarget(null)} disabled={dropping}>
                {t('view.cancel')}
              </Button>
              <Button variant="destructive" onClick={handleDrop} disabled={dropping}>
                {dropping ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                {t('view.drop')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
