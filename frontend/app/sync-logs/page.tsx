'use client';

import React, { useEffect, useState } from 'react';
import { IntegrationAPI } from '@/lib/api-client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Loader2, Activity, Clock, ServerCrash, CheckCircle2, 
  PlayCircle, ChevronDown, ChevronRight, FileText, Database 
} from "lucide-react";

export default function SyncLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State quản lý dòng nào đang được mở (Chevron Down)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  
  // State xem chi tiết lỗi thô (Raw Errors Modal)
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await IntegrationAPI.getLogs();
      setLogs(data);
    } catch (error) {
      console.error("Lỗi khi lấy logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Hàm Toggle mở/đóng Chevron
  const toggleRow = (logId: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(logId)) {
      newExpandedRows.delete(logId);
    } else {
      newExpandedRows.add(logId);
    }
    setExpandedRows(newExpandedRows);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', { 
      day: '2-digit', month: '2-digit', year: 'numeric', 
      hour: '2-digit', minute: '2-digit', second: '2-digit' 
    }).format(date);
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'done':
      case 'success':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle2 className="w-3 h-3 mr-1"/> Thành công</Badge>;
      case 'running':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 animate-pulse"><PlayCircle className="w-3 h-3 mr-1"/> Đang chạy</Badge>;
      case 'partial_success':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><Activity className="w-3 h-3 mr-1"/> Lỗi một phần</Badge>;
      case 'failed':
        return <Badge variant="destructive"><ServerCrash className="w-3 h-3 mr-1"/> Thất bại</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lịch sử Đồng bộ (Sync Logs)</h1>
          <p className="text-slate-500 mt-1">Quản lý lịch sử các tiến trình ETL và chi tiết từng bảng dữ liệu.</p>
        </div>
        <Button variant="outline" onClick={fetchLogs} className="text-blue-600 border-blue-200 hover:bg-blue-50">
          <Activity className="w-4 h-4 mr-2" /> Làm mới dữ liệu
        </Button>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
          <CardTitle>Danh sách Tiến trình Cron Job</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
             <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="w-[50px]"></TableHead> {/* Cột cho Chevron */}
                  <TableHead>Tên Tiến trình (Job)</TableHead>
                  <TableHead>Bắt đầu lúc</TableHead>
                  <TableHead>Thời lượng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Tổng Record</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => {
                  const isExpanded = expandedRows.has(log._id);
                  const metrics = log.details?.metrics || {};
                  const tableResults = metrics.tableResults || [];

                  return (
                    <React.Fragment key={log._id}>
                      {/* DÒNG CHA: CRON JOB (Bấm vào để expand) */}
                      <TableRow 
                        className={`cursor-pointer transition-colors ${isExpanded ? 'bg-blue-50/30' : 'hover:bg-slate-50'}`}
                        onClick={() => toggleRow(log._id)}
                      >
                        <TableCell>
                          {isExpanded ? <ChevronDown className="w-5 h-5 text-blue-600" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-slate-800">{log.title}</div>
                          <div className="text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded inline-block mt-1">
                            {log.type}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          <div className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400"/> {formatDate(log.details?.startTime)}</div>
                        </TableCell>
                        <TableCell className="text-sm font-mono text-slate-600">
                          {log.details?.durationMs ? `${(log.details.durationMs / 1000).toFixed(2)}s` : '-'}
                        </TableCell>
                        <TableCell>{renderStatusBadge(log.status)}</TableCell>
                        <TableCell className="text-sm">
                          <div className="flex gap-2">
                            <span className="text-green-700 font-medium">{metrics.success || 0} OK</span>
                            {metrics.failed > 0 && <span className="text-red-600 font-medium border-l pl-2">{metrics.failed} Lỗi</span>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation(); // Tránh kích hoạt toggle row
                              setSelectedLog(log);
                            }}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                          >
                            <FileText className="w-4 h-4 mr-1" /> Log Thô
                          </Button>
                        </TableCell>
                      </TableRow>

                      {/* DÒNG CON: DANH SÁCH CÁC BẢNG (Chỉ hiện khi Expanded) */}
                      {isExpanded && (
                        <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                          <TableCell colSpan={7} className="p-0 border-b-2 border-blue-100">
                            <div className="px-14 py-4">
                              <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center">
                                <Database className="w-4 h-4 mr-2 text-slate-500" />
                                Chi tiết đồng bộ theo Bảng (Tables)
                              </h4>
                              
                              {tableResults.length > 0 ? (
                                <div className="rounded-md border border-slate-200 bg-white overflow-hidden shadow-sm">
                                  <Table>
                                    <TableHeader className="bg-slate-100/50">
                                      <TableRow>
                                        <TableHead className="h-8 text-xs font-semibold">Tên Bảng</TableHead>
                                        <TableHead className="h-8 text-xs font-semibold w-[150px]">Trạng thái</TableHead>
                                        <TableHead className="h-8 text-xs font-semibold w-[150px]">Record đã lưu</TableHead>
                                        <TableHead className="h-8 text-xs font-semibold">Ghi chú (Lỗi)</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {tableResults.map((tResult: any, idx: number) => (
                                        <TableRow key={idx} className="last:border-0 border-b border-slate-100">
                                          <TableCell className="py-2 text-sm font-mono text-slate-700">{tResult.table}</TableCell>
                                          <TableCell className="py-2">{renderStatusBadge(tResult.status)}</TableCell>
                                          <TableCell className="py-2 text-sm font-medium">
                                            {tResult.status === 'success' ? (
                                              <span className="text-green-600">+{tResult.totalRecordsSynced || 0}</span>
                                            ) : '-'}
                                          </TableCell>
                                          <TableCell className="py-2 text-xs text-red-600 font-mono break-words max-w-[300px]">
                                            {tResult.error || ''}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              ) : (
                                <div className="text-sm text-slate-500 italic p-3 bg-white border border-slate-200 rounded-md">
                                  Tiến trình không có dữ liệu bảng nào (Có thể bị Skip do schema chưa an toàn hoặc không có data mới).
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}

                {logs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                      Chưa có lịch sử đồng bộ nào.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal Xem chi tiết Raw Error (Giữ nguyên từ code cũ) */}
      <Dialog open={selectedLog !== null} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="sm:max-w-[60vw] w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Raw Log: <span className="text-blue-600">{selectedLog?.title}</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm bg-slate-50 p-4 rounded-lg border">
              <div><span className="text-slate-500 block text-xs">Tag:</span> <b>{selectedLog?.tag}</b></div>
              <div><span className="text-slate-500 block text-xs">Trạng thái:</span> <div className="mt-1">{renderStatusBadge(selectedLog?.status)}</div></div>
              <div><span className="text-slate-500 block text-xs">Bắt đầu:</span> <div className="font-medium">{formatDate(selectedLog?.details?.startTime)}</div></div>
              <div><span className="text-slate-500 block text-xs">Kết thúc:</span> <div className="font-medium">{formatDate(selectedLog?.details?.endTime)}</div></div>
            </div>

            {selectedLog?.details?.errors && selectedLog.details.errors.length > 0 && (
              <div className="mt-4">
                <h4 className="font-bold text-red-600 mb-2 flex items-center"><ServerCrash className="w-4 h-4 mr-1"/> Lỗi Hệ thống (System Errors)</h4>
                <div className="bg-red-50 border border-red-100 rounded-lg p-3 max-h-64 overflow-y-auto">
                  <ul className="space-y-2 text-sm text-red-800 font-mono">
                    {selectedLog.details.errors.map((err: any, idx: number) => (
                      <li key={idx} className="border-b border-red-200 pb-2 last:border-0">
                        {typeof err === 'object' ? (
                          <>
                            <div className="font-bold">Target: {err.pk || err.table || 'Unknown'}</div>
                            <div className="text-xs mt-1 whitespace-pre-wrap">{err.error || JSON.stringify(err)}</div>
                          </>
                        ) : (
                          <div className="text-xs whitespace-pre-wrap">{err}</div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}