'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Activity, Network } from "lucide-react";

export default function KongGatewayPage() {
  const [isLoading, setIsLoading] = useState(true);

  const grafana_url = process.env.NEXT_PUBLIC_GRAFANA_URL; 

  return (
    <div className="space-y-6 h-full flex flex-col max-w-[1600px] w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <Network className="mr-3 w-8 h-8 text-blue-600" />
          API Gateway Monitoring
        </h1>
        <p className="text-slate-500 mt-1">
          Giám sát lưu lượng truy cập, độ trễ và tỷ lệ lỗi của Trục tích hợp (Powered by Kong & Grafana).
        </p>
      </div>

      <Card className="flex-1 flex flex-col border-slate-200 shadow-sm overflow-hidden min-h-[600px]">
        {/* <CardHeader className="bg-slate-50 border-b pb-4">
          <CardTitle className="flex items-center text-lg text-slate-800">
            <Activity className="w-5 h-5 mr-2 text-green-500" /> 
            Live Traffic Metrics
          </CardTitle>
          <CardDescription>
            Dữ liệu được cập nhật theo thời gian thực (Real-time).
          </CardDescription>
        </CardHeader> */}
        
        <CardContent className="p-0 flex-1 relative bg-slate-900">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 z-10">
              <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
              <p className="text-slate-500 font-medium animate-pulse">Đang kết nối đến Prometheus & Grafana...</p>
            </div>
          )}

          <iframe
            src={grafana_url}
            width="100%"
            height="100%"
            className="border-0 w-full h-full"
            onLoad={() => setIsLoading(false)} 
            allowFullScreen
          />
        </CardContent>
      </Card>
    </div>
  );
}