'use client';

import { useEffect, useState } from 'react';
import { ReaderAPI } from '@/lib/api-client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Database, Search, LayoutGrid, FileDown, Loader2, ChevronLeft, ChevronRight, Lock, LogOut, Zap, Copy, Check, Eye, EyeOff } from "lucide-react";
import { clearAuthSession } from '@/lib/auth-session';
import { useLanguage } from '@/lib/i18n';

export default function DataExplorerPage() {
  const { t } = useLanguage();

  // States cho danh sách bảng
  const [allowedTables, setAllowedTables] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<any | null>(null);
  const [loadingTables, setLoadingTables] = useState(true);

  // States cho Dữ liệu của bảng đang chọn
  const [tableData, setTableData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  
  // Pagination & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Export CSV
  const [exportingCSV, setExportingCSV] = useState(false);

  // API modal
  const [apiModalOpen, setApiModalOpen] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [copiedField, setCopiedField] = useState<'url' | 'curl' | 'token' | null>(null);
  const [apiTestResult, setApiTestResult] = useState<string | null>(null);
  const [apiTesting, setApiTesting] = useState(false);

  // 1. Load danh sách bảng khi vào trang
  useEffect(() => {
    const fetchTables = async () => {
      const tables = await ReaderAPI.getAllowedTables();
      setAllowedTables(tables);
      setLoadingTables(false);
      // Mặc định chọn bảng đầu tiên nếu có
      if (tables.length > 0) setSelectedTable(tables[0]);
    };
    fetchTables();
  }, []);

  // 2. Load dữ liệu khi đổi Bảng, đổi Trang, hoặc Tìm kiếm
  useEffect(() => {
    if (!selectedTable) return;
    
    const fetchData = async () => {
      setLoadingData(true);
      try {
        const response = await ReaderAPI.getTableData(selectedTable.id, currentPage, searchTerm);
        setColumns(response.columns);
        setTableData(response.data);
        setTotalPages(response.metadata.totalPages);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu");
      } finally {
        setLoadingData(false);
      }
    };

    // Debounce search (Chờ người dùng gõ xong mới gọi API)
    const delayDebounce = setTimeout(() => {
      fetchData();
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [selectedTable, currentPage, searchTerm]);

  // Hàm helper đổi Bảng
  const handleSelectTable = (table: any) => {
    setSelectedTable(table);
    setCurrentPage(1); // Reset page về 1
    setSearchTerm(''); // Xóa search cũ
  };

  const handleExportCSV = async () => {
    if (!selectedTable) return;
    setExportingCSV(true);
    try {
      const { columns, data } = await ReaderAPI.exportAllTableData(selectedTable.id, searchTerm);

      if (data.length === 0) return;

      // Escape giá trị có chứa dấu phẩy, ngoặc kép, hoặc xuống dòng
      const escapeCell = (val: unknown): string => {
        if (val === null || val === undefined) return '';
        const str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const rows = [
        columns.join(','),
        ...data.map((row) => columns.map((col) => escapeCell(row[col])).join(',')),
      ];

      // BOM ﻿ để Excel nhận diện đúng UTF-8 (tiếng Việt không bị lỗi)
      const blob = new Blob(['﻿' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedTable.id}_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Lỗi khi export CSV:', error);
    } finally {
      setExportingCSV(false);
    }
  };

  const handleLogOut = () => {
    clearAuthSession();
    window.location.href = '/login';
  };

  const getApiUrl = (page = 1) => {
    const base = process.env.NEXT_PUBLIC_KONG_URL || '';
    return `${base}/api/master-data/${selectedTable?.id}?page=${page}&limit=10`;
  };

  const getAccessToken = () =>
    typeof window !== 'undefined' ? (localStorage.getItem('access_token') ?? '') : '';

  const getCurlCommand = () => {
    const token = getAccessToken();
    return `curl -X GET "${getApiUrl()}" \\\n  -H "Authorization: Bearer ${token}"`;
  };

  const handleCopy = (field: 'url' | 'curl' | 'token', text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleApiTest = async () => {
    setApiTesting(true);
    setApiTestResult(null);
    try {
      const token = getAccessToken();
      const res = await fetch(getApiUrl(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setApiTestResult(JSON.stringify(json, null, 2));
    } catch (err: any) {
      setApiTestResult(`Error: ${err.message}`);
    } finally {
      setApiTesting(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-6">
      
      {/* CỘT TRÁI: Danh sách bảng được cấp quyền */}
      <Card className="w-1/4 flex flex-col border-slate-200 h-full overflow-hidden">
        <CardHeader className="bg-slate-50 border-b py-4">
          <CardTitle className="text-lg flex items-center text-slate-800">
            <Lock className="w-4 h-4 mr-2 text-green-600" /> {t('explorer.accessTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 overflow-y-auto flex-1">
          {loadingTables ? (
             <div className="flex justify-center p-4"><Loader2 className="animate-spin w-5 h-5 text-blue-500" /></div>
          ) : (
            <div className="space-y-1">
              {allowedTables.map((table) => (
                <button
                  key={table.id}
                  onClick={() => handleSelectTable(table)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    selectedTable?.id === table.id 
                      ? 'bg-blue-50 border border-blue-200 shadow-sm' 
                      : 'hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  <div className="flex items-center font-semibold text-sm text-slate-800">
                    <Database className={`w-4 h-4 mr-2 ${selectedTable?.id === table.id ? 'text-blue-600' : 'text-slate-400'}`} />
                    {table.name}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 pl-6 line-clamp-1">{table.description}</div>
                </button>
              ))}
              {allowedTables.length === 0 && (
                <div className="text-center p-4 text-sm text-slate-500">{t('explorer.noTables')}</div>
              )}
            </div>
          )}
        </CardContent>

        <div className="p-3 border-t bg-white">
            <button
              onClick={handleLogOut}
              className="w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
            >
              <LogOut className="w-4 h-4" />
              {t('explorer.logout')}
            </button>
          </div>
      </Card>

      {/* CỘT PHẢI: Hiển thị Dữ liệu */}
      <Card className="flex-1 flex flex-col border-slate-200 h-full overflow-hidden">
        {selectedTable ? (
          <>
            {/* Toolbar: Tiêu đề & Search */}
            <CardHeader className="border-b py-4 bg-white flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-xl flex items-center">
                  <LayoutGrid className="mr-2 h-5 w-5 text-blue-600" /> {selectedTable.name}
                </CardTitle>
                <p className="text-sm text-slate-500 mt-1">{t('explorer.sourceLabel')} ({selectedTable.id})</p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <Input 
                    type="text" 
                    placeholder={t('explorer.search')}
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1); // Gõ search thì quay về trang 1
                    }}
                  />
                </div>
                <Button
                  variant="outline"
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  onClick={() => { setApiTestResult(null); setShowToken(false); setApiModalOpen(true); }}
                >
                  <Zap className="w-4 h-4 mr-2" /> {t('explorer.callApi')}
                </Button>
                <Button
                  variant="outline"
                  className="text-slate-600"
                  onClick={handleExportCSV}
                  disabled={exportingCSV || loadingData || tableData.length === 0}
                >
                  {exportingCSV ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t('explorer.exporting')}</>
                  ) : (
                    <><FileDown className="w-4 h-4 mr-2" /> {t('explorer.exportCSV')}</>
                  )}
                </Button>
              </div>
            </CardHeader>

            {/* Khung chứa Bảng (Có thanh cuộn ngang nếu nhiều cột) */}
            <CardContent className="flex-1 p-0 overflow-auto bg-slate-50 relative">
              {loadingData ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : null}

              <Table className="bg-white min-w-max">
                {/* Header */}
                <TableHeader className="bg-slate-100 sticky top-0 z-0">
                  <TableRow>
                    {columns.length > 0 ? (
                      columns.map((col, idx) => (
                        <TableHead key={idx} className="font-bold text-slate-700 uppercase text-xs">
                          {col}
                        </TableHead>
                      ))
                    ) : (
                      <TableHead className="font-bold text-slate-700 uppercase text-xs">
                        {t('explorer.dataCol')}
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>

                {/* Body */}
                <TableBody>
                  {tableData.length > 0 ? (
                    tableData.map((row, rowIndex) => (
                      <TableRow key={rowIndex} className="hover:bg-blue-50/50">
                        {columns.map((col, colIndex) => (
                          <TableCell key={colIndex} className="text-slate-700 max-w-[200px] truncate">
                            {typeof row[col] === 'boolean' ? (
                              <Badge variant={row[col] ? "default" : "secondary"} className={row[col] ? "bg-green-500" : ""}>
                                {row[col] ? "True" : "False"}
                              </Badge>
                            ) : (
                              // Bổ sung String() để tránh lỗi nếu dữ liệu là Object/Array
                              row[col] ? String(row[col]) : <span className="text-slate-300 italic">null</span>
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={Math.max(columns.length, 1)} className="h-32 text-center text-slate-500">
                        {t('explorer.noData')} "{searchTerm}".
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>

            {/* Pagination */}
            <div className="border-t bg-white p-4 flex items-center justify-between">
              <div className="text-sm text-slate-500">
                {t('explorer.page')} <span className="font-bold text-slate-800">{currentPage}</span> / {totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline" size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || loadingData}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> {t('explorer.prev')}
                </Button>
                <Button
                  variant="outline" size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || loadingData}
                >
                  {t('explorer.next')} <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <Database className="w-16 h-16 mb-4 text-slate-200" />
            <p>{t('explorer.selectTable')}</p>
          </div>
        )}
      </Card>

      {/* API Modal */}
      <Dialog open={apiModalOpen} onOpenChange={setApiModalOpen}>
        <DialogContent className="w-[90vw] !max-w-4xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Zap className="w-5 h-5 text-blue-600" />
              {t('explorer.apiModal.title')} — <span className="text-blue-600">{selectedTable?.id}</span>
            </DialogTitle>
            <DialogDescription>{t('explorer.apiModal.desc')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 mt-2">
            {/* Endpoint URL */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-2">{t('explorer.apiModal.endpoint')}</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm bg-slate-100 rounded-lg px-4 py-3 break-all text-slate-800 font-mono">
                  {getApiUrl()}
                </code>
                <Button size="sm" variant="ghost" className="shrink-0" onClick={() => handleCopy('url', getApiUrl())}>
                  {copiedField === 'url' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Access Token */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-500 uppercase">{t('explorer.apiModal.token')}</p>
                <button
                  className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                  onClick={() => setShowToken(v => !v)}
                >
                  {showToken ? <><EyeOff className="w-3 h-3" /> {t('explorer.apiModal.hideToken')}</> : <><Eye className="w-3 h-3" /> {t('explorer.apiModal.showToken')}</>}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm bg-slate-100 rounded-lg px-4 py-3 break-all text-slate-800 font-mono overflow-hidden">
                  {showToken ? getAccessToken() : '••••••••••••••••••••••••••••••••••••••••'}
                </code>
                <Button size="sm" variant="ghost" className="shrink-0" onClick={() => handleCopy('token', getAccessToken())}>
                  {copiedField === 'token' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* cURL */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-500 uppercase">{t('explorer.apiModal.curl')}</p>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleCopy('curl', getCurlCommand())}>
                  {copiedField === 'curl' ? <><Check className="w-3 h-3 mr-1 text-green-500" /> {t('explorer.apiModal.copied')}</> : <><Copy className="w-3 h-3 mr-1" /> {t('explorer.apiModal.copy')}</>}
                </Button>
              </div>
              <pre className="text-sm bg-slate-900 text-green-300 rounded-lg px-4 py-4 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                {getCurlCommand()}
              </pre>
            </div>

            {/* Test Button */}
            <div className="flex gap-2">
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleApiTest}
                disabled={apiTesting}
              >
                {apiTesting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t('explorer.apiModal.testing')}</> : <><Zap className="w-4 h-4 mr-2" /> {t('explorer.apiModal.test')}</>}
              </Button>
            </div>

            {/* Response */}
            {apiTestResult && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">{t('explorer.apiModal.response')}</p>
                <pre className="text-xs bg-slate-900 text-slate-200 rounded px-3 py-3 overflow-auto max-h-64 whitespace-pre-wrap">
                  {apiTestResult}
                </pre>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}