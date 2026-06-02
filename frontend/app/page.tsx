'use client';

import { useState, useEffect, useRef } from 'react';
import { IntegrationAPI, JobAPI } from '@/lib/api-client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RefreshCw, PlayCircle, Activity, Database, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { LogLine, Terminal, SyncProgress } from '@/components/dashboard/terminal';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import TableSelect from '@/components/modals/TableSelect';
import { getAccessToken } from '@/lib/auth-session';
import { useLanguage } from '@/lib/i18n';

type ScheduledJob = {
  _id: string;
  jobName: string;
  jobType: string;
  cronExpression: string;
  isActive: boolean;
  lastRunAt?: string;
  nextRunAt?: string | null;
  description?: string;
};

type EventLog = {
  _id: string;
  title: string;
  status: 'running' | 'done' | 'done_with_warnings' | 'failed' | 'partial_success';
  createdAt: string;
  details?: {
    durationMs?: number;
    metrics?: {
      success?: number;
      failed?: number;
    };
  };
};

interface IncomingLogLine {
  timestamp?: string;
  timeStamp?: string;
  type: 'INFO' | 'WARN' | 'ERROR';
  message: string;
}

export default function DashboardPage() {
  const { t } = useLanguage();
  const [isSyncing, setIsSyncing] = useState(false);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [scheduledJobs, setScheduledJobs] = useState<ScheduledJob[]>([]);
  // Changed from recentRuns to allRuns to calculate accurate stats
  const [allRuns, setAllRuns] = useState<EventLog[]>([]); 
  const [chartData, setChartData] = useState<Array<{ name: string; success: number; failed: number }>>([]);
  const [draftCron, setDraftCron] = useState<Record<string, string>>({});
  
  const [syncProgress, setSyncProgress] = useState<SyncProgress>(null);

  const API_URL = process.env.NEXT_PUBLIC_KONG_URL;
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availableSchemas, setAvailableSchemas] = useState<any[]>([]);

  // 1. Khởi tạo SSE cho Terminal
  useEffect(() => {
    const token = getAccessToken();
    const eventSource = new EventSource(`${API_URL}/integration/stream-logs?token=${token}`);

    eventSource.onmessage = (event) => {
      const parsedLog = JSON.parse(event.data) as IncomingLogLine;
      const normalizedLog: LogLine = {
        timestamp: parsedLog.timestamp || parsedLog.timeStamp || new Date().toISOString(),
        type: parsedLog.type,
        message: parsedLog.message,
      };
      setLogs((prev) => [...prev, normalizedLog]);

      // ── Parse sync progress from log messages ──────────────────────────
      const msg = parsedLog.message;
      const startMatch = msg.match(/\[START\] Processing table:\s*(\S+)/);
      if (startMatch) {
        const tableName = startMatch[1].replace(/\.+$/, '');
        setSyncProgress((prev) => prev ? { ...prev, currentTable: tableName } : prev);
      } else if (msg.includes('[DONE]') && msg.includes('synced=')) {
        setSyncProgress((prev) =>
          prev ? { ...prev, current: Math.min(prev.current + 1, prev.total) } : prev
        );
      }
    };

    return () => eventSource.close();
  }, [API_URL]);

  // Tự động cuộn Terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Tự clear progress bar sau 3s khi sync hoàn tất
  useEffect(() => {
    if (!syncProgress || syncProgress.total === 0) return;
    if (syncProgress.current >= syncProgress.total) {
      const timer = setTimeout(() => setSyncProgress(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [syncProgress]);

  const fetchDashboardData = async () => {
    try {
      const schemas = await IntegrationAPI.getSchemas();
      setAvailableSchemas(schemas);

      const jobs = await JobAPI.getJobs();
      setScheduledJobs(jobs);
      const nextDraft: Record<string, string> = {};
      for (const job of jobs) {
        nextDraft[job._id] = job.cronExpression;
      }
      setDraftCron(nextDraft);

      // Store ALL fetched logs for accurate statistics
      const logsData: EventLog[] = await IntegrationAPI.getLogs();
      setAllRuns(logsData);

      const formattedChartData = logsData.slice(0, 20).reverse().map((log: EventLog) => {
        const date = new Date(log.createdAt);
        return {
          name: date.toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          }),
          success: Number(log.details?.metrics?.success || 0),
          failed: Number(log.details?.metrics?.failed || 0),
        };
      });
      setChartData(formattedChartData);
    } catch (error) {
      console.error('Failed to load dashboard data', error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleTriggerSync = async (jobId?: string, selectedTables?: string[]) => {
    setIsSyncing(true);
    setLogs([{ timestamp: new Date().toISOString(), type: 'INFO', message: 'System: Init connection to Hub API...' }]);

    // Khởi tạo progress bar
    const stableCount = (availableSchemas as any[]).filter((s) => s.status === 'stable').length;
    const total = selectedTables?.length ?? stableCount;
    if (total > 0) setSyncProgress({ current: 0, total, currentTable: '' });

    try {
      if (jobId) {
        await JobAPI.triggerJob(jobId);
      } else {
        if (selectedTables && selectedTables.length > 0) {
          await IntegrationAPI.triggerCustomSync(selectedTables, 'Dashboard Custom Sync');
        } else {
          await IntegrationAPI.triggerFullSync('Dashboard Full Sync');
        }
      }
      setTimeout(fetchDashboardData, 3000);
    } catch (error: any) {
      setLogs(prev => [...prev, { timestamp: new Date().toISOString(), type: 'ERROR', message: `HTTP Call failed: ${error.message}` }]);
    } finally {
      setIsSyncing(false);
    }
  };

  const formatDateTime = (value?: string | null) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleString('vi-VN');
  };

  // --- STATS CALCULATIONS ---

  const activeJobsCount = scheduledJobs.filter((j) => j.isActive).length;

  const avgDurationMs = (() => {
    const durations = allRuns
      .map((r) => r.details?.durationMs)
      .filter((d): d is number => typeof d === 'number' && !Number.isNaN(d));
    if (durations.length === 0) return 0;
    return Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
  })();

  const formatDuration = (ms: number) => {
    if (!ms) return 'N/A';
    const s = Math.round(ms / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}m ${sec}s`;
  };

  // Last run
  const lastRun = allRuns[0] ?? null;
  const lastRunRecords = Number(lastRun?.details?.metrics?.success ?? 0);
  const lastRunStatus = lastRun?.status ?? null;
  const lastRunTimeAgo = (() => {
    if (!lastRun?.createdAt) return null;
    const diffMs = Date.now() - new Date(lastRun.createdAt).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'vừa xong';
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h trước`;
    return `${Math.floor(diffH / 24)} ngày trước`;
  })();

  // Schema warnings
  const schemaWarnings = (availableSchemas as any[]).filter(
    (s) => s.status === 'changed' || s.status === 'new'
  ).length;

  // Stable tables
  const stableTablesCount = (availableSchemas as any[]).filter((s) => s.status === 'stable').length;
  const totalTablesCount = availableSchemas.length;

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 shrink-0">
        {/* LEFT PANEL */}
        <div className="xl:col-span-5 flex flex-col gap-4">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-slate-800 flex items-center text-lg">
                <PlayCircle className="mr-2 h-5 w-5 text-blue-600" /> {t('dash.manualTrigger') || 'Manual Sync'}
              </CardTitle>
              <CardDescription>
                Kích hoạt đồng bộ ngay lập tức
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              <Button
                onClick={() => handleTriggerSync()}
                disabled={isSyncing}
                className="bg-slate-900 hover:bg-slate-800 text-white w-full h-11 font-bold shadow-md"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? t('dash.syncing') || 'Syncing...' : t('dash.runFull') || 'Run Full Sync'}
              </Button>

              <Button
                variant="outline"
                onClick={() => setIsModalOpen(true)}
                disabled={isSyncing}
                className="w-full h-11 border-slate-300 text-slate-700 font-semibold"
              >
                <Database className="mr-2 h-4 w-4" />
                {t('dash.runCustom') || 'Sync Specific Tables'}
              </Button>
            </CardContent>
          </Card>

          {/* ETL Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            {/* Card 1: Last Run Records */}
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-4 flex flex-col justify-center">
                <div className="flex items-center text-xs text-slate-500 mb-1 gap-1">
                  <Database className="h-3.5 w-3.5 text-blue-500" /> Last Run Records
                </div>
                <div className="text-2xl font-bold text-slate-800">
                  {lastRunRecords > 0
                    ? new Intl.NumberFormat('vi-VN').format(lastRunRecords)
                    : <span className="text-slate-400 text-lg">—</span>}
                </div>
                {lastRunTimeAgo && (
                  <div className="text-[10px] text-slate-400 mt-0.5">{lastRunTimeAgo}</div>
                )}
              </CardContent>
            </Card>

            {/* Card 2: Last Run Status */}
            <Card className={`shadow-sm border ${
              lastRunStatus === 'done' || lastRunStatus === 'done_with_warnings' || lastRunStatus === 'partial_success'
                ? 'border-emerald-200 bg-emerald-50/40'
                : lastRunStatus === 'failed'
                ? 'border-red-200 bg-red-50/40'
                : 'border-slate-200'
            }`}>
              <CardContent className="p-4 flex flex-col justify-center">
                <div className="flex items-center text-xs text-slate-500 mb-1 gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-slate-400" /> Last Run Status
                </div>
                {lastRunStatus ? (
                  <div className={`text-lg font-bold ${
                    lastRunStatus === 'done' ? 'text-emerald-600' :
                    lastRunStatus === 'done_with_warnings' ? 'text-amber-500' :
                    lastRunStatus === 'partial_success' ? 'text-amber-500' :
                    lastRunStatus === 'failed' ? 'text-red-500' :
                    'text-blue-500'
                  }`}>
                    {lastRunStatus === 'done' ? '✓ SUCCESS' :
                     lastRunStatus === 'done_with_warnings' ? '⚠ WARNINGS' :
                     lastRunStatus === 'partial_success' ? '~ PARTIAL' :
                     lastRunStatus === 'failed' ? '✗ FAILED' :
                     '⟳ RUNNING'}
                  </div>
                ) : (
                  <div className="text-lg font-bold text-slate-400">—</div>
                )}
              </CardContent>
            </Card>

            {/* Card 3: Schema Warnings */}
            <Card className={`shadow-sm border ${schemaWarnings > 0 ? 'border-amber-200 bg-amber-50/40' : 'border-slate-200'}`}>
              <CardContent className="p-4 flex flex-col justify-center">
                <div className="flex items-center text-xs text-slate-500 mb-1 gap-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400" /> Schema Warnings
                </div>
                <div className={`text-2xl font-bold ${schemaWarnings > 0 ? 'text-amber-500' : 'text-emerald-600'}`}>
                  {schemaWarnings > 0 ? schemaWarnings : '✓ 0'}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {schemaWarnings > 0 ? 'bảng cần review' : 'tất cả ổn định'}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Card 4: Active Jobs */}
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-4 flex flex-col justify-center">
                <div className="flex items-center text-xs text-slate-500 mb-1 gap-1">
                  <Clock className="h-3.5 w-3.5 text-violet-500" /> Active Jobs
                </div>
                <div className="text-2xl font-bold text-slate-800">{activeJobsCount}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">cron jobs đang chạy</div>
              </CardContent>
            </Card>

            {/* Card 5: Avg Duration */}
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-4 flex flex-col justify-center">
                <div className="flex items-center text-xs text-slate-500 mb-1 gap-1">
                  <Activity className="h-3.5 w-3.5 text-blue-500" /> Avg Duration
                </div>
                <div className="text-2xl font-bold text-slate-800">
                  {formatDuration(avgDurationMs)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">trung bình mỗi lần sync</div>
              </CardContent>
            </Card>

            {/* Card 6: Stable Tables */}
            <Card className={`shadow-sm border ${
              totalTablesCount > 0 && stableTablesCount < totalTablesCount
                ? 'border-amber-200 bg-amber-50/30'
                : 'border-slate-200'
            }`}>
              <CardContent className="p-4 flex flex-col justify-center">
                <div className="flex items-center text-xs text-slate-500 mb-1 gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Stable Tables
                </div>
                <div className="text-2xl font-bold text-slate-800">
                  {stableTablesCount}
                  <span className="text-base font-normal text-slate-400">/{totalTablesCount}</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {totalTablesCount > 0
                    ? `${Math.round((stableTablesCount / totalTablesCount) * 100)}% schema ổn định`
                    : 'đang tải...'}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="xl:col-span-7">
          <Card className="border-slate-200 shadow-sm h-full flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-800 flex items-center text-lg">
                <Activity className="mr-2 h-5 w-5 text-emerald-600" />
                Data Volume Processed (Last 20 Runs)
              </CardTitle>

              <CardDescription>
                Records successfully synced vs failed per run
              </CardDescription>
            </CardHeader>

            <CardContent className="flex-1 min-h-[200px] mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 5, right: 20, left: 0, bottom: 20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e2e8f0"
                  />

                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    angle={-15}
                    textAnchor="end"
                    height={40}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                  />

                  <YAxis 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    tickFormatter={(val) => new Intl.NumberFormat('en-US', { notation: 'compact' }).format(val)}
                  />

                  <Tooltip 
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />

                  <Legend wrapperStyle={{ paddingTop: '10px' }}/>

                  <Bar
                    dataKey="success"
                    name="Records Synced"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />

                  <Bar
                    dataKey="failed"
                    name="Records Failed"
                    fill="#ef4444"
                    radius={[4, 4, 0, 0]}
                    minPointSize={4}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-auto shrink-0 border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <Terminal logs={logs} terminalEndRef={terminalEndRef} heightClassName="h-[32vh] md:h-[36vh]" progress={syncProgress} />
      </div>

      <TableSelect 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        schemas={availableSchemas}
        onStartSync={(selectedTables) => handleTriggerSync(undefined, selectedTables)}
      />
    </div>
  );
}