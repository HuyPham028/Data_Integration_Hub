'use client';

import { useEffect, useState, useCallback } from 'react';
import { IntegrationAPI, AdminDataAPI } from '@/lib/api-client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Database, Search, FileDown, Loader2, ChevronLeft, ChevronRight,
  ScanSearch, AlertTriangle, CheckCircle2, Trash2, X, TableProperties, ShieldAlert,
} from 'lucide-react';
import ConfirmDialog from '@/components/modals/ConfirmModal';
import { useLanguage } from '@/lib/i18n';

type SchemaItem = {
  _id: string;
  tableName: string;
  dataFrom: string;
  status: string;
  fieldsCount: number;
};

type OrphanResult = {
  tableName: string;
  primaryKey: string;
  orphanCount: number;
  orphanIds: unknown[];
  error?: string;
};

export default function DataManagementPage() {
  const { t } = useLanguage();

  // ── Table list ─────────────────────────────────────────────────────────────
  const [schemas, setSchemas] = useState<SchemaItem[]>([]);
  const [loadingSchemas, setLoadingSchemas] = useState(true);
  const [selectedTable, setSelectedTable] = useState<SchemaItem | null>(null);

  // ── Table data ─────────────────────────────────────────────────────────────
  const [tableData, setTableData] = useState<Record<string, unknown>[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [exportingCSV, setExportingCSV] = useState(false);

  // ── Orphan panel ────────────────────────────────────────────────────────────
  const [orphanPanelOpen, setOrphanPanelOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [orphanResult, setOrphanResult] = useState<OrphanResult | null>(null);
  const [purging, setPurging] = useState(false);
  const [confirmPurgeOpen, setConfirmPurgeOpen] = useState(false);
  const [purgeSuccess, setPurgeSuccess] = useState<number | null>(null);
  const [orphanError, setOrphanError] = useState('');

  // ── Load schema list ────────────────────────────────────────────────────────
  useEffect(() => {
    IntegrationAPI.getSchemas().then((data) => {
      const stable = (data as SchemaItem[]).filter((s) => s.status === 'stable');
      setSchemas(stable);
      if (stable.length > 0) setSelectedTable(stable[0]);
      setLoadingSchemas(false);
    });
  }, []);

  // ── Load table data ─────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!selectedTable) return;
    setLoadingData(true);
    try {
      const res = await AdminDataAPI.getTableData(selectedTable.tableName, currentPage, searchTerm);
      setColumns(res.columns);
      setTableData(res.data);
      setTotalPages(res.metadata.totalPages);
      setTotalRecords(res.metadata.total);
    } catch {
      setTableData([]);
    } finally {
      setLoadingData(false);
    }
  }, [selectedTable, currentPage, searchTerm]);

  useEffect(() => {
    const timer = setTimeout(fetchData, 350);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const handleSelectTable = (schema: SchemaItem) => {
    setSelectedTable(schema);
    setCurrentPage(1);
    setSearchTerm('');
    setOrphanPanelOpen(false);
    setOrphanResult(null);
    setPurgeSuccess(null);
  };

  // ── Export CSV ──────────────────────────────────────────────────────────────
  const handleExportCSV = async () => {
    if (!selectedTable) return;
    setExportingCSV(true);
    try {
      const { columns: cols, data } = await AdminDataAPI.exportAllTableData(selectedTable.tableName, searchTerm);
      if (data.length === 0) return;

      const escapeCell = (val: unknown): string => {
        if (val === null || val === undefined) return '';
        const str = String(val);
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      };

      const rows = [cols.join(','), ...data.map((row) => cols.map((c) => escapeCell(row[c])).join(','))];
      const blob = new Blob(['﻿' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedTable.tableName}_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportingCSV(false);
    }
  };

  // ── Orphan scan ─────────────────────────────────────────────────────────────
  const handleScanOrphans = async () => {
    if (!selectedTable) return;
    setOrphanPanelOpen(true);
    setScanning(true);
    setOrphanResult(null);
    setPurgeSuccess(null);
    setOrphanError('');
    try {
      const results = await IntegrationAPI.scanOrphans([selectedTable.tableName]);
      setOrphanResult(results[0] ?? null);
    } catch {
      setOrphanError(t('dm.errorScan'));
    } finally {
      setScanning(false);
    }
  };

  // ── Orphan purge ────────────────────────────────────────────────────────────
  const handlePurgeOrphans = async () => {
    if (!orphanResult || !selectedTable) return;
    setPurging(true);
    setOrphanError('');
    try {
      const res = await IntegrationAPI.purgeOrphans(
        orphanResult.tableName,
        orphanResult.primaryKey,
        orphanResult.orphanIds,
      );
      setPurgeSuccess(res.deleted);
      setOrphanResult({ ...orphanResult, orphanCount: 0, orphanIds: [] });
      setConfirmPurgeOpen(false);
      fetchData();
    } catch {
      setOrphanError(t('dm.errorPurge'));
    } finally {
      setPurging(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-4">

      {/* ── LEFT: Table list ─────────────────────────────────────────────────── */}
      <Card className="w-64 flex-shrink-0 flex flex-col border-slate-200 h-full overflow-hidden">
        <CardHeader className="bg-slate-50 border-b py-3 px-4">
          <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <TableProperties className="w-4 h-4 text-blue-600" />
            {t('dm.allTables')}
          </CardTitle>
          <p className="text-xs text-slate-400 mt-0.5">{t('dm.stableOnly')}</p>
        </CardHeader>

        <CardContent className="p-2 overflow-y-auto flex-1">
          {loadingSchemas ? (
            <div className="flex justify-center py-6"><Loader2 className="animate-spin w-5 h-5 text-blue-500" /></div>
          ) : (
            <div className="space-y-0.5">
              {schemas.map((schema) => (
                <button
                  key={schema._id}
                  onClick={() => handleSelectTable(schema)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-all text-sm ${
                    selectedTable?.tableName === schema.tableName
                      ? 'bg-blue-50 border border-blue-200 text-blue-800'
                      : 'hover:bg-slate-100 border border-transparent text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 font-mono font-semibold truncate">
                    <Database className={`w-3.5 h-3.5 flex-shrink-0 ${selectedTable?.tableName === schema.tableName ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span className="truncate text-xs">{schema.tableName}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5 pl-5 truncate">{schema.dataFrom}</div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── RIGHT: Data viewer + Orphan panel ────────────────────────────────── */}
      <div className="flex-1 flex gap-4 min-w-0 h-full overflow-hidden">

        {/* Data viewer */}
        <Card className="flex-1 flex flex-col border-slate-200 h-full overflow-hidden min-w-0">
          {selectedTable ? (
            <>
              {/* Header */}
              <CardHeader className="border-b py-3 px-5 bg-white flex flex-row items-center justify-between space-y-0 flex-shrink-0">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-600" />
                    <span className="font-mono">{selectedTable.tableName}</span>
                    <Badge variant="outline" className="text-xs font-normal bg-emerald-50 text-emerald-700 border-emerald-200">
                      stable
                    </Badge>
                  </CardTitle>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {t('dm.source')} {selectedTable.dataFrom} · {totalRecords.toLocaleString()} {t('dm.records')}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative w-52">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      type="text"
                      placeholder={t('dm.search')}
                      className="pl-8 h-8 text-sm"
                      value={searchTerm}
                      onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    />
                  </div>

                  <Button variant="outline" size="sm" className="h-8 text-slate-600 text-xs"
                    onClick={handleExportCSV} disabled={exportingCSV || loadingData}>
                    {exportingCSV
                      ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />{t('dm.exporting')}</>
                      : <><FileDown className="w-3.5 h-3.5 mr-1.5" />{t('dm.exportCSV')}</>}
                  </Button>

                  <Button size="sm"
                    className={`h-8 text-xs ${orphanPanelOpen ? 'bg-amber-600 hover:bg-amber-700' : 'bg-slate-800 hover:bg-slate-700'} text-white`}
                    onClick={orphanPanelOpen ? () => setOrphanPanelOpen(false) : handleScanOrphans}
                    disabled={scanning}>
                    {scanning
                      ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />{t('dm.scanning')}</>
                      : <><ScanSearch className="w-3.5 h-3.5 mr-1.5" />{t('dm.scanOrphans')}</>}
                  </Button>
                </div>
              </CardHeader>

              {/* Table content */}
              <CardContent className="flex-1 p-0 overflow-auto bg-slate-50/30 relative">
                {loadingData && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm z-10">
                    <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
                  </div>
                )}
                <Table className="bg-white min-w-max">
                  <TableHeader className="bg-slate-100 sticky top-0 z-0">
                    <TableRow>
                      {columns.map((col, i) => (
                        <TableHead key={i} className="font-bold text-slate-600 uppercase text-xs whitespace-nowrap py-2.5">
                          {col}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableData.length > 0 ? (
                      tableData.map((row, ri) => (
                        <TableRow key={ri} className="hover:bg-blue-50/40 text-sm">
                          {columns.map((col, ci) => (
                            <TableCell key={ci} className="text-slate-700 max-w-[200px] truncate py-2 text-xs">
                              {typeof row[col] === 'boolean' ? (
                                <Badge variant={row[col] ? 'default' : 'secondary'} className={`text-xs ${row[col] ? 'bg-green-500' : ''}`}>
                                  {row[col] ? 'True' : 'False'}
                                </Badge>
                              ) : row[col] !== null && row[col] !== undefined ? (
                                String(row[col])
                              ) : (
                                <span className="text-slate-300 italic text-xs">null</span>
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={Math.max(columns.length, 1)} className="h-32 text-center text-slate-400 text-sm">
                          {t('dm.noData')}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>

              {/* Pagination */}
              <div className="border-t bg-white px-5 py-2.5 flex items-center justify-between flex-shrink-0">
                <span className="text-xs text-slate-500">
                  {t('dm.page')} <b className="text-slate-800">{currentPage}</b> / {totalPages}
                </span>
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="sm" className="h-7 text-xs"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1 || loadingData}>
                    <ChevronLeft className="w-3.5 h-3.5 mr-1" />{t('dm.prev')}
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || loadingData}>
                    {t('dm.next')}<ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <TableProperties className="w-14 h-14 mb-3 text-slate-200" />
              <p className="text-sm text-center max-w-xs">{t('dm.selectTable')}</p>
            </div>
          )}
        </Card>

        {/* ── Orphan panel (slide-in) ─────────────────────────────────────── */}
        {orphanPanelOpen && (
          <Card className="w-80 flex-shrink-0 flex flex-col border-slate-200 h-full overflow-hidden">
            <CardHeader className="border-b py-3 px-4 bg-slate-50 flex-shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <ScanSearch className="w-4 h-4 text-amber-600" />
                  {t('dm.orphanTitle')}
                </CardTitle>
                <button onClick={() => setOrphanPanelOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-200 transition-colors"
                  title={t('dm.closePanel')}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              {selectedTable && (
                <p className="text-xs text-slate-500 mt-1">
                  {t('dm.orphanFor')} <span className="font-mono font-semibold text-slate-700">{selectedTable.tableName}</span>
                </p>
              )}
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Scanning state */}
              {scanning && (
                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                  <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                  <p className="text-sm text-slate-500">{t('dm.scanning')}</p>
                </div>
              )}

              {/* Error */}
              {!scanning && orphanError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {orphanError}
                </div>
              )}

              {/* Purge success */}
              {!scanning && purgeSuccess !== null && (
                <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {t('dm.purgeSuccess')} {purgeSuccess} {t('dm.purgeRecords')}
                </div>
              )}

              {/* Orphan result */}
              {!scanning && orphanResult && (
                <>
                  {orphanResult.error ? (
                    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      {orphanResult.error}
                    </div>
                  ) : orphanResult.orphanCount === 0 ? (
                    <div className="flex flex-col items-center py-10 text-center space-y-3">
                      <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                      </div>
                      <p className="text-sm text-slate-600 font-medium">{t('dm.noOrphans')}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Warning banner */}
                      <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <ShieldAlert className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-amber-800">
                            {orphanResult.orphanCount} {t('dm.orphansFound')}
                          </p>
                          <p className="text-xs text-amber-700 mt-0.5">{t('dm.orphanDesc')}</p>
                        </div>
                      </div>

                      {/* Orphan IDs list */}
                      <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <div className="bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                          {t('dm.colOrphanId')} ({orphanResult.primaryKey})
                        </div>
                        <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
                          {orphanResult.orphanIds.map((id, i) => (
                            <div key={i} className="px-3 py-1.5 text-xs font-mono text-slate-700 flex items-center gap-2">
                              <span className="text-slate-300 select-none">{String(i + 1).padStart(2, '0')}</span>
                              <span className="text-rose-600 font-semibold">{String(id)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>

            {/* Purge button footer */}
            {!scanning && orphanResult && orphanResult.orphanCount > 0 && (
              <div className="border-t p-4 flex-shrink-0 bg-white">
                <Button
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white text-sm"
                  onClick={() => setConfirmPurgeOpen(true)}
                  disabled={purging}>
                  {purging
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('dm.purging')}</>
                    : <><Trash2 className="w-4 h-4 mr-2" />{t('dm.purgeOrphans')} ({orphanResult.orphanCount})</>}
                </Button>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* ── Confirm purge dialog ────────────────────────────────────────────── */}
      <ConfirmDialog
        open={confirmPurgeOpen}
        onOpenChange={setConfirmPurgeOpen}
        title={t('dm.confirmPurge')}
        description={t('dm.confirmPurgeDesc').replace('{count}', String(orphanResult?.orphanCount ?? 0))}
        confirmText={t('dm.confirmPurgeBtn')}
        cancelText={t('dm.cancelBtn')}
        destructive
        loading={purging}
        onConfirm={handlePurgeOrphans}
      />
    </div>
  );
}
