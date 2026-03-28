'use client';

import { useEffect, useState } from 'react';
import { IntegrationAPI } from '@/lib/api-client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Activity, Clock, ServerCrash, CheckCircle2, PlayCircle } from "lucide-react";

export default function SyncLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State xem chi tiết lỗi
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

  // Helper format thời gian
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', { 
      day: '2-digit', month: '2-digit', year: 'numeric', 
      hour: '2-digit', minute: '2-digit', second: '2-digit' 
    }).format(date);
  };

  // Helper render Badge Status
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'done':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle2 className="w-3 h-3 mr-1"/> Thành công</Badge>;
      case 'running':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 animate-pulse"><PlayCircle className="w-3 h-3 mr-1"/> Đang chạy...</Badge>;
      case 'partial_success':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><Activity className="w-3 h-3 mr-1"/> Thành công một phần</Badge>;
      case 'failed':
        return <Badge variant="destructive"><ServerCrash className="w-3 h-3 mr-1"/> Thất bại</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sync History & Logs</h1>
          <p className="text-slate-500 mt-1">Lịch sử các tiến trình ETL (Extract, Transform, Load).</p>
        </div>
        <button 
          onClick={fetchLogs} 
          className="text-sm flex items-center text-blue-600 hover:text-blue-800"
        >
          <Activity className="w-4 h-4 mr-1" /> Làm mới
        </button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách tiến trình gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
             <div className="flex justify-center p-8"><Loader2 className="animate-spin text-blue-500" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tiến trình (Job)</TableHead>
                  <TableHead>Loại (Type)</TableHead>
                  <TableHead>Thời gian bắt đầu</TableHead>
                  <TableHead>Thời lượng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Thống kê</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log._id} className="cursor-pointer hover:bg-slate-50" onClick={() => setSelectedLog(log)}>
                    <TableCell className="font-semibold text-slate-800">{log.title}</TableCell>
                    <TableCell>
                      <span className="text-xs uppercase font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">{log.type}</span>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      <div className="flex items-center"><Clock className="w-3 h-3 mr-1"/> {formatDate(log.createdAt)}</div>
                    </TableCell>
                    <TableCell className="text-sm font-mono text-slate-500">
                      {log.details?.durationMs ? `${(log.details.durationMs / 1000).toFixed(2)}s` : '-'}
                    </TableCell>
                    <TableCell>{renderStatusBadge(log.status)}</TableCell>
                    <TableCell className="text-sm">
                      {log.details?.metrics ? (
                        <div className="flex gap-2 text-xs">
                          <span className="text-green-600 bg-green-50 px-1 rounded">OK: {log.details.metrics.success || 0}</span>
                          <span className="text-red-600 bg-red-50 px-1 rounded">Err: {log.details.metrics.failed || 0}</span>
                        </div>
                      ) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
                {logs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">Chưa có lịch sử đồng bộ nào.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal Xem chi tiết Log (Rất quan trọng để debug lỗi Prisma) */}
      <Dialog open={selectedLog !== null} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Chi tiết Job: <span className="text-blue-600">{selectedLog?.title}</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-lg border">
              <div><span className="text-slate-500">Tag:</span> <b>{selectedLog?.tag}</b></div>
              <div><span className="text-slate-500">Trạng thái:</span> {renderStatusBadge(selectedLog?.status)}</div>
              <div><span className="text-slate-500">Bắt đầu:</span> {formatDate(selectedLog?.details?.startTime)}</div>
              <div><span className="text-slate-500">Kết thúc:</span> {formatDate(selectedLog?.details?.endTime)}</div>
            </div>

            {selectedLog?.details?.errors && selectedLog.details.errors.length > 0 && (
              <div className="mt-4">
                <h4 className="font-bold text-red-600 mb-2 flex items-center"><ServerCrash className="w-4 h-4 mr-1"/> Log Lỗi Chi Tiết ({selectedLog.details.errors.length} lỗi)</h4>
                <div className="bg-red-50 border border-red-100 rounded-lg p-3 max-h-64 overflow-y-auto">
                  <ul className="space-y-2 text-sm text-red-800 font-mono">
                    {selectedLog.details.errors.map((err: any, idx: number) => (
                      <li key={idx} className="border-b border-red-200 pb-2 last:border-0">
                        {/* Hiển thị chi tiết lỗi Prisma nếu có */}
                        <div className="font-bold">Record ID: {err.pk || err.table || 'Unknown'}</div>
                        <div className="text-xs mt-1 whitespace-pre-wrap">{err.error}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {!selectedLog?.details?.errors?.length && selectedLog?.status === 'done' && (
              <div className="p-4 bg-green-50 text-green-700 rounded-lg border border-green-200 flex items-center">
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Tiến trình thực thi hoàn hảo, không có lỗi Prisma (Type mismatch) nào xảy ra.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}