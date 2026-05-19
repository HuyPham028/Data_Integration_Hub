'use client';

import { useState, useEffect, useRef } from 'react';
import { IntegrationAPI, JobAPI } from '@/lib/api-client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RefreshCw, PlayCircle, Activity, Database, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { LogLine, Terminal } from '@/components/dashboard/terminal';
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
    };

    return () => eventSource.close();
  }, [API_URL]);

  // Tự động cuộn Terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

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

  const totalRuns = allRuns.length;
  
  // Job Completion Rate: Consider 'done', 'done_with_warnings', and 'partial_success' as completed jobs
  const completedRuns = allRuns.filter((run) => run.status !== 'failed' && run.status !== 'running').length;
  const failedRuns = allRuns.filter((run) => run.status === 'failed').length;
  const completionRate = totalRuns > 0 ? Math.round((completedRuns / totalRuns) * 100) : 0;

  // Total Records Synced (A much better vanity metric for ETL)
  const totalRecordsSynced = allRuns.reduce((sum, run) => sum + Number(run.details?.metrics?.success || 0), 0);

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

  const nextRunAt = (() => {
    const nexts = scheduledJobs
      .map((j) => j.nextRunAt)
      .filter((n): n is string => !!n)
      .map((s) => new Date(s));
    if (!nexts.length) return 'N/A';
    const earliest = new Date(Math.min(...nexts.map((d) => d.getTime())));
    
    const now = new Date();
    if (earliest.toDateString() === now.toDateString()) {
      return earliest.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    }
    return earliest.toLocaleString('vi-VN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  })();

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
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-4 flex flex-col justify-center">
                <div className="flex items-center text-sm text-slate-500 mb-1">
                  <Database className="h-4 w-4 mr-1 text-blue-500" /> Records
                </div>
                <div className="text-2xl font-bold text-slate-800">
                  {new Intl.NumberFormat('vi-VN').format(totalRecordsSynced)}
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-4 flex flex-col justify-center">
                <div className="flex items-center text-sm text-slate-500 mb-1">
                  <CheckCircle2 className="h-4 w-4 mr-1 text-emerald-500" /> Job Success
                </div>
                <div className="text-2xl font-bold text-emerald-600">
                  {completionRate}%
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-4 flex flex-col justify-center">
                <div className="flex items-center text-sm text-slate-500 mb-1">
                  <AlertTriangle className="h-4 w-4 mr-1 text-red-400" /> Failed Jobs
                </div>
                <div className="text-2xl font-bold text-red-500">
                  {failedRuns}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-4 flex flex-col justify-center">
                <div className="text-sm text-slate-500 mb-1">Active Jobs</div>
                <div className="text-2xl font-bold text-slate-800">{activeJobsCount}</div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-4 flex flex-col justify-center">
                <div className="text-sm text-slate-500 mb-1">Avg Duration</div>
                <div className="text-2xl font-bold text-slate-800">
                  {formatDuration(avgDurationMs)}
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-4 flex flex-col justify-center">
                <div className="flex items-center text-sm text-slate-500 mb-1">
                  <Clock className="h-4 w-4 mr-1 text-amber-500" /> Next Run
                </div>
                <div className="text-lg font-bold text-slate-800 truncate" title={nextRunAt}>
                  {nextRunAt}
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
        <Terminal logs={logs} terminalEndRef={terminalEndRef} heightClassName="h-[32vh] md:h-[36vh]" />
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