'use client';

import { useState, useEffect, useRef } from 'react';
import { IntegrationAPI } from '@/lib/api-client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, PlayCircle, Terminal as TerminalIcon } from "lucide-react";

interface LogLine {
  timestamp: string;
  type: 'INFO' | 'WARN' | 'ERROR';
  message: string;
}

interface IncomingLogLine {
  timestamp?: string;
  timeStamp?: string;
  type: 'INFO' | 'WARN' | 'ERROR';
  message: string;
}

export default function DashboardPage() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [logs, setLogs] = useState<LogLine[]>([]);
  
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const eventSource = new EventSource('http://localhost:4000/api/v1/integration/stream-logs');

    eventSource.onmessage = (event) => {
      const parsedLog = JSON.parse(event.data) as IncomingLogLine;
      const normalizedLog: LogLine = {
        timestamp: parsedLog.timestamp || parsedLog.timeStamp || new Date().toISOString(),
        type: parsedLog.type,
        message: parsedLog.message,
      };
      setLogs((prev) => [...prev, normalizedLog]);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    setLogs([{ timestamp: new Date().toISOString(), type: 'INFO', message: 'System: Init connection to Hub API...' }]);
    
    try {
      await IntegrationAPI.triggerFullSync();
    } catch (error: any) {
      setLogs(prev => [...prev, { timestamp: new Date().toISOString(), type: 'ERROR', message: `HTTP Call failed: ${error.message}` }]);
    } finally {
      setIsSyncing(false);
    }
  };

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">System Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Nút điều khiển (Bên trái) */}
        <Card className="col-span-1 border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-800 flex items-center">
              <PlayCircle className="mr-2" /> ETL Controller
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-500">
              Nhấn nút dưới đây để kích hoạt NestJS quét toàn bộ API nguồn, chuẩn hóa dữ liệu và lưu vào PostgreSQL. Quá trình sẽ được stream trực tiếp lên Terminal bên cạnh.
            </p>
            <Button 
              onClick={handleTriggerSync} 
              disabled={isSyncing} 
              className="bg-blue-600 hover:bg-blue-700 text-white w-full h-12 text-md"
            >
              <RefreshCw className={`mr-2 h-5 w-5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'System is Syncing...' : 'START SYNC PROCESS'}
            </Button>
          </CardContent>
        </Card>

        {/* MÀN HÌNH TERMINAL (Bên phải - chiếm 2 cột) */}
        <Card className="col-span-1 lg:col-span-2 bg-slate-950 border-slate-800 shadow-xl overflow-hidden">
          <CardHeader className="bg-slate-900 border-b border-slate-800 py-3">
            <CardTitle className="text-slate-300 flex items-center text-sm font-mono">
              <TerminalIcon className="mr-2 h-4 w-4" /> root@univ-hub-server:~
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Vùng chứa text log */}
            <div className="h-100 overflow-y-auto p-4 font-mono text-sm tracking-tight leading-relaxed">
              {logs.length === 0 ? (
                <div className="text-slate-500 italic">Waiting for command...</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="flex gap-3 mb-1 wrap-break-word">
                    <span className="text-slate-500 shrink-0">[{formatTime(log.timestamp)}]</span>
                    
                    {/* Màu sắc tùy theo loại log */}
                    <span className={`shrink-0 w-12 font-bold ${
                      log.type === 'INFO' ? 'text-blue-400' :
                      log.type === 'WARN' ? 'text-yellow-400' : 'text-red-500'
                    }`}>
                      {log.type}
                    </span>
                    
                    {/* Nội dung log */}
                    <span className={`flex-1 ${
                      log.type === 'ERROR' ? 'text-red-400' : 
                      log.type === 'WARN' ? 'text-yellow-200' : 'text-green-400'
                    }`}>
                      {log.message}
                    </span>
                  </div>
                ))
              )}
              {/* Điểm neo để scroll xuống */}
              <div ref={terminalEndRef} />
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}