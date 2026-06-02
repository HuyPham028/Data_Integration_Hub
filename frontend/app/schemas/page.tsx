'use client';

import { useEffect, useState, useMemo } from 'react';
import { IntegrationAPI } from '@/lib/api-client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  Loader2, Server, AlertTriangle, CheckCircle, 
  X, ArrowRight, FileJson, Terminal, Database
} from "lucide-react";
import ConfirmDialog from '@/components/modals/ConfirmModal';
import { useLanguage } from '@/lib/i18n';

// --- CÁC HÀM LOGIC XỬ LÝ DIFF ---

const calculateDiff = (newFields: any = [], oldFields: any = []) => {
  const safeNewFields = Array.isArray(newFields) ? newFields : [];
  const safeOldFields = Array.isArray(oldFields) ? oldFields : [];

  const diff: any[] = [];
  const oldMap = new Map(safeOldFields.map(f => [f.name, f]));
  const newMap = new Map(safeNewFields.map(f => [f.name, f]));

  safeNewFields.forEach(newF => {
    const oldF = oldMap.get(newF.name);
    if (!oldF) {
      diff.push({ name: newF.name, status: 'added', new: newF, old: null });
    } else if (oldF.type !== newF.type || oldF.length !== newF.length) {
      diff.push({ name: newF.name, status: 'changed', new: newF, old: oldF });
    } else {
      diff.push({ name: newF.name, status: 'unchanged', new: newF, old: oldF });
    }
  });

  safeOldFields.forEach(oldF => {
    if (!newMap.has(oldF.name)) {
      diff.push({ name: oldF.name, status: 'removed', new: null, old: oldF });
    }
  });

  return diff;
};

// --- COMPONENT CHÍNH ---

export default function SchemaRegistryPage() {
  const { t } = useLanguage();
  const [schemas, setSchemas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State Review Modal
  const [selectedSchema, setSelectedSchema] = useState<any | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [updatingStrategy, setUpdatingStrategy] = useState<Set<string>>(new Set());

  const handleStrategyChange = async (tableName: string, strategy: 'upsert' | 'overwrite' | 'incremental') => {
    setUpdatingStrategy(prev => new Set(prev).add(tableName));
    try {
      await IntegrationAPI.updateSyncStrategy(tableName, strategy);
      setSchemas(prev =>
        prev.map(s => s.tableName === tableName ? { ...s, syncStrategy: strategy } : s)
      );
    } catch (error) {
      console.error('Failed to update strategy:', error);
    } finally {
      setUpdatingStrategy(prev => {
        const next = new Set(prev);
        next.delete(tableName);
        return next;
      });
    }
  };

  // Live SQL Preview State
  const [sqlPreview, setSqlPreview] = useState<string>('');
  const [loadingSql, setLoadingSql] = useState(false);

  // Fetch Data
  const fetchSchemas = async () => {
    setLoading(true);
    try {
      const data = await IntegrationAPI.getSchemas();
      setSchemas(data);
    } catch (error) {
      console.error("Lỗi:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSchemas(); }, []);

  // Fetch SQL Preview when a schema is selected
  useEffect(() => {
    if (selectedSchema && selectedSchema.status !== 'stable') {
      setLoadingSql(true);
      setSqlPreview('');
      IntegrationAPI.previewMigration(selectedSchema.tableName)
        .then((sql) => setSqlPreview(sql))
        .catch((err) => setSqlPreview(`-- Lỗi khi tạo SQL Preview: ${err.message}`))
        .finally(() => setLoadingSql(false));
    }
  }, [selectedSchema]);

  const handleApplyLiveMigration = async () => {
    if (!selectedSchema || !sqlPreview.trim()) return;
    setIsApplying(true);
    try {
      await IntegrationAPI.resolveSchema(selectedSchema.tableName, sqlPreview);
      setSelectedSchema(null);
      await fetchSchemas();
      alert('Migration applied successfully and pushed to GitHub!');
    } catch (error: any) {
      console.error("Lỗi khi Apply Migration:", error);
      alert(`Lỗi: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsApplying(false);
    }
  };

  const handleReject = async () => {
    if (!selectedSchema) return;
    setIsRejecting(true);
    try {
      await IntegrationAPI.rejectSchema(selectedSchema.tableName);
      setSelectedSchema(null);
      setIsOpen(false);
      await fetchSchemas();
    } catch (error) {
      console.error("Lỗi khi Reject:", error);
    } finally {
      setIsRejecting(false);
    }
  };

  const diffData = useMemo(() => {
    if (!selectedSchema) return { diff: [], stats: { added: 0, removed: 0, changed: 0 } };
    const oldData = selectedSchema.status === 'new' ? [] : (selectedSchema.oldDetails || []);
    const diff = calculateDiff(selectedSchema.details || [], oldData);

    return {
      diff,
      stats: {
        added: diff.filter(d => d.status === 'added').length,
        removed: diff.filter(d => d.status === 'removed').length,
        changed: diff.filter(d => d.status === 'changed').length,
      }
    };
  }, [selectedSchema]);

  const hasBreakingChange = diffData.stats.removed > 0 || diffData.stats.changed > 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('schema.title')}</h1>
        <p className="text-slate-500 mt-1">{t('schema.subtitle')}</p>
      </div>

      {/* Bảng danh sách Schema */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50/50 border-b pb-4">
          <CardTitle className="text-lg">Metadata Models</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
             <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-500" /></div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="pl-6">{t('schema.colTable')}</TableHead>
                  <TableHead>{t('schema.colSource')}</TableHead>
                  <TableHead>{t('schema.colFields')}</TableHead>
                  <TableHead>{t('schema.colStatus')}</TableHead>
                  <TableHead>Chiến thuật đồng bộ</TableHead>
                  <TableHead className="text-right pr-6">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schemas.map((schema) => (
                  <TableRow key={schema._id} className="hover:bg-slate-50/50">
                    <TableCell className="pl-6 font-mono text-sm font-semibold text-slate-700">
                      {schema.tableName}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-white text-slate-500 border-slate-200">
                        <Server className="w-3 h-3 mr-1"/> {schema.dataFrom || 'Unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500">{schema.fieldsCount} fields</TableCell>
                    <TableCell>
                      {schema.status === 'stable' && <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200"><CheckCircle className="w-3 h-3 mr-1"/> Stable</Badge>}
                      {schema.status === 'new' && <Badge className="bg-blue-50 text-blue-700 border-blue-200"><FileJson className="w-3 h-3 mr-1"/> New Model</Badge>}
                      {schema.status === 'changed' && <Badge className="bg-amber-50 text-amber-700 border-amber-200"><AlertTriangle className="w-3 h-3 mr-1"/> Schema Drift</Badge>}
                    </TableCell>
                    <TableCell>
                      <div className="relative">
                        <select
                          value={schema.syncStrategy || 'upsert'}
                          disabled={updatingStrategy.has(schema.tableName)}
                          onChange={(e) =>
                            handleStrategyChange(
                              schema.tableName,
                              e.target.value as 'upsert' | 'overwrite' | 'incremental',
                            )
                          }
                          className={`
                            text-xs font-medium px-2 py-1.5 pr-7 rounded-md border appearance-none cursor-pointer
                            bg-white border-slate-200 text-slate-700
                            hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                            disabled:opacity-50 disabled:cursor-not-allowed
                            transition-colors
                          `}
                        >
                          <option value="upsert">upsert</option>
                          <option value="overwrite">overwrite</option>
                          <option value="incremental">incremental</option>
                        </select>
                        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
                          {updatingStrategy.has(schema.tableName) ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          )}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      {schema.status !== 'stable' ? (
                        <Button 
                          size="sm" 
                          className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                          onClick={() => setSelectedSchema(schema)}
                        >
                          Review & Apply <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      ) : (
                        <span className="text-xs font-medium text-slate-400">{t('schema.synced')}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* GitOps Live Apply Modal */}
      <Dialog
        open={selectedSchema !== null}
        onOpenChange={(open) => {
          if(!open && !isApplying) setSelectedSchema(null);
        }}
      >
        <DialogContent className="sm:max-w-6xl p-0 overflow-hidden bg-slate-50 shadow-2xl border-slate-200 sm:rounded-xl flex flex-col max-h-[90vh]">
          
          {/* Header */}
          <div className="p-6 border-b bg-white flex justify-between items-start shrink-0">
            <div>
              <DialogTitle className="text-xl flex items-center gap-2 font-bold text-slate-900">
                Schema Deployment: <span className="font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">{selectedSchema?.tableName}</span>
              </DialogTitle>
              <DialogDescription className="mt-2 text-slate-500">
                Review the structural changes and the generated SQL migration before applying live to the PostgreSQL database.
              </DialogDescription>
              
              <div className="flex gap-3 text-xs mt-4 font-medium">
                {diffData.stats.added > 0 && <Badge className="bg-emerald-100 text-emerald-800 border-0">+{diffData.stats.added} Added</Badge>}
                {diffData.stats.removed > 0 && <Badge className="bg-rose-100 text-rose-800 border-0">-{diffData.stats.removed} Removed</Badge>}
                {diffData.stats.changed > 0 && <Badge className="bg-amber-100 text-amber-800 border-0">~{diffData.stats.changed} Changed</Badge>}
              </div>
            </div>
          </div>

          {/* Body: 2 Columns - Visual Diff & SQL Preview */}
          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left Column: Visual Diff */}
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                <Database className="w-4 h-4 text-slate-500" />
                Visual Drift Analysis
              </h3>
              
              {hasBreakingChange && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3 text-rose-800">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm">{t('schema.breakWarn')}</h4>
                    <p className="text-xs mt-1 opacity-90">{t('schema.breakDesc')}</p>
                  </div>
                </div>
              )}

              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                <div className="grid grid-cols-2 text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 border-b border-slate-200">
                  <div className="p-3 pl-4 border-r border-slate-200">{t('schema.newStruct')}</div>
                  <div className="p-3 pl-4">{t('schema.oldStruct')}</div>
                </div>
                <div className="divide-y divide-slate-100 text-sm max-h-[400px] overflow-y-auto">
                  {diffData.diff.map((row) => (
                    <div key={row.name} className="grid grid-cols-2">
                      <div className={`p-3 pl-4 flex justify-between items-center border-r border-slate-200 ${row.status === 'added' ? 'bg-emerald-100' : row.status === 'changed' ? 'bg-blue-200' : ''}`}>
                        {row.new ? (
                          <>
                            <span className="font-mono font-medium text-slate-900">{row.new.name}</span>
                            <span className="text-slate-500 text-xs bg-white px-2 py-1 rounded-md border border-slate-100">{row.new.type}</span>
                          </>
                        ) : (
                          <span className="text-slate-300 italic">{t('schema.removed')}</span>
                        )}
                      </div>
                      <div className={`p-3 pl-4 flex justify-between items-center ${row.status === 'removed' ? 'bg-rose-50/50' : row.status === 'changed' ? 'bg-amber-50/50' : ''}`}>
                        {row.old ? (
                          <>
                            <span className="font-mono text-slate-600 line-through decoration-slate-300 opacity-80">{row.old.name}</span>
                            <span className="text-slate-400 text-xs">{row.old.type}</span>
                          </>
                        ) : (
                          <span className="text-slate-300 italic">{t('schema.notExisted')}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: SQL Preview */}
            <div className="space-y-4 flex flex-col">
              <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-slate-500" />
                migration.sql Preview
              </h3>
              
              <div className="flex-1 bg-[#0d1117] border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-inner min-h-[400px]">
                <div className="bg-[#161b22] px-4 py-2 border-b border-slate-800 flex items-center text-xs text-slate-400 font-mono">
                  <div className="flex space-x-2 mr-4">
                    <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                  </div>
                  prisma/migrations/.../migration.sql
                </div>
                <div className="flex-1 relative flex flex-col">
                  {loadingSql ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 space-y-3">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                      <p className="text-sm">Generating SQL dry-run...</p>
                    </div>
                  ) : (
                    <textarea
                      className="flex-1 w-full h-full min-h-[360px] p-4 bg-transparent text-sm font-mono text-slate-300 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500/50 rounded-b-xl"
                      value={sqlPreview}
                      onChange={(e) => setSqlPreview(e.target.value)}
                      spellCheck={false}
                      placeholder="-- SQL will appear here after loading..."
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-5 border-t border-slate-200 bg-white flex justify-between items-center shrink-0">
            <Button
              variant="ghost"
              onClick={() => setIsOpen(true)}
              disabled={isRejecting || isApplying}
              className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            >
              <X className="w-4 h-4 mr-2" />
              {t('schema.rejectBtn') || 'Reject Changes'}
            </Button>

            <Button
              size="lg"
              onClick={handleApplyLiveMigration}
              disabled={isApplying || loadingSql || isRejecting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md px-8"
            >
              {isApplying ? (
                <>
                  <Loader2 className="animate-spin w-5 h-5 mr-2" />
                  Deploying to Database...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Accept & Apply Live
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        title={t('schema.confirmReject')}
        description={t('schema.confirmRejectDesc')}
        confirmText={t('schema.rejectBtn')}
        cancelText={t('schema.cancelBtn')}
        destructive
        loading={isRejecting}
        onConfirm={handleReject}
      />
    </div>
  );
}