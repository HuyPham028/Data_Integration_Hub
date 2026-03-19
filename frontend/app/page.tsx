'use client';

import { useState } from 'react';
import { IntegrationAPI } from '@/lib/api-client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, PlayCircle } from "lucide-react";

export default function DashboardPage() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    setSyncMessage("Đang gửi yêu cầu khởi chạy luồng ETL đến NestJS...");
    
    try {
      const response = await IntegrationAPI.triggerFullSync();
      setSyncMessage(`Thành công! ${response.message}`);
    } catch (error: any) {
      setSyncMessage(`Lỗi: ${error.message}. Hãy kiểm tra backend NestJS đang chạy chưa.`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 md:col-span-2 lg:col-span-3 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800 flex items-center">
              <PlayCircle className="mr-2" /> Điều khiển luồng tích hợp (ETL Engine)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-blue-600">
              Nhấn nút dưới đây để kích hoạt NestJS quét toàn bộ API nguồn (myBK, myHCMUT), chuẩn hóa dữ liệu và lưu vào PostgreSQL.
            </p>
            <Button 
              onClick={handleTriggerSync} 
              disabled={isSyncing} 
              className="bg-blue-600 hover:bg-blue-700 text-white w-48"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Đang chạy...' : 'Run Data Sync'}
            </Button>

            {syncMessage && (
              <div className="mt-4 p-3 rounded-md bg-white text-sm text-slate-700 border">
                System Response: <b>{syncMessage}</b>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}