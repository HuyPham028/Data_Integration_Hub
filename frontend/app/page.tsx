'use client';

import { useState } from 'react';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Database, RefreshCw, Server, CheckCircle2, AlertCircle, Clock } from "lucide-react";

// --- FAKE DATA (Mô phỏng dữ liệu từ MongoDB) ---
const mockSchemas = [
  { tableName: "nh_dao_tao", source: "myBK", fields: 36, status: "stable" },
  { tableName: "tcns_ly_lich", source: "myHCMUT", fields: 37, status: "changed" }, // changed = cần admin review
  { tableName: "dm_gioi_tinh", source: "myHCMUT", fields: 3, status: "stable" },
];

const mockLogs = [
  { id: 1, task: "Sync nh_dao_tao", status: "done", records: 68743, time: "2 mins ago" },
  { id: 2, task: "Sync dm_gioi_tinh", status: "done", records: 3, time: "2 mins ago" },
  { id: 3, task: "Sync tcns_ly_lich", status: "failed", records: 0, time: "1 hour ago" },
];

export default function DashboardPage() {
  const [isSyncing, setIsSyncing] = useState(false);

  // Hàm này sau này sẽ gọi đến POST /api/v1/integration/run-full-sync của NestJS
  const handleRunSync = () => {
    setIsSyncing(true);
    // Giả lập thời gian NestJS đang kéo data
    setTimeout(() => {
      setIsSyncing(false);
      alert("Đồng bộ hoàn tất! (Vui lòng check PostgreSQL)");
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 text-slate-900">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Data Integration Hub</h1>
            <p className="text-slate-500 mt-1">Trang quản trị Trục tích hợp dữ liệu đại học</p>
          </div>
          <Button onClick={handleRunSync} disabled={isSyncing} className="bg-blue-600 hover:bg-blue-700">
            <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Đang đồng bộ (ETL)...' : 'Chạy đồng bộ ngay (Sync Now)'}
          </Button>
        </div>

        {/* Tổng quan (Metrics) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Schema Đang Quản Lý</CardTitle>
              <Database className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">103 Bảng</div>
              <p className="text-xs text-slate-500">Từ hệ thống myBK & myHCMUT</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Trạng Thái Kết Nối API</CardTitle>
              <Server className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Online</div>
              <p className="text-xs text-slate-500">Ping: 24ms</p>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-red-800">Cảnh Báo Cấu Trúc (Schema)</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">1 Bảng thay đổi</div>
              <p className="text-xs text-red-500">Cần review cấu trúc PostgreSQL</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content (Bảng Schema & Bảng Log) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Cột 1: Schema Registry */}
          <Card>
            <CardHeader>
              <CardTitle>Schema Registry (MongoDB)</CardTitle>
              <CardDescription>Danh sách các bảng đã nhận diện từ hệ thống nguồn</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên bảng</TableHead>
                    <TableHead>Nguồn</TableHead>
                    <TableHead>Trạng thái Hash</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockSchemas.map((schema) => (
                    <TableRow key={schema.tableName}>
                      <TableCell className="font-medium">{schema.tableName}</TableCell>
                      <TableCell><Badge variant="outline">{schema.source}</Badge></TableCell>
                      <TableCell>
                        {schema.status === 'stable' ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-0"><CheckCircle2 className="w-3 h-3 mr-1"/> Khớp</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-0"><AlertCircle className="w-3 h-3 mr-1"/> Có thay đổi</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Cột 2: System Logs */}
          <Card>
            <CardHeader>
              <CardTitle>Lịch sử đồng bộ (Event Logs)</CardTitle>
              <CardDescription>Tiến trình ETL nạp dữ liệu vào PostgreSQL</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tiến trình</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Cập nhật</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.task}</TableCell>
                      <TableCell>
                        {log.status === 'done' ? (
                          <Badge className="bg-green-500">Thành công</Badge>
                        ) : (
                          <Badge variant="destructive">Thất bại</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm flex items-center">
                        <Clock className="w-3 h-3 mr-1" /> {log.time}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}