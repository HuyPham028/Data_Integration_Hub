'use client';

import { useState, useEffect, useRef } from 'react';
import { IntegrationAPI, JobAPI } from '@/lib/api-client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RefreshCw, PlayCircle, Clock, CalendarDays, Activity, CheckCircle2, XCircle, Gauge } from "lucide-react";
import { LogLine, Terminal } from '@/components/dashboard/terminal';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import TableSelect from '@/components/modals/TableSelect';

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
  status: 'running' | 'done' | 'failed' | 'partial_success';
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
  const [isSyncing, setIsSyncing] = useState(false);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [scheduledJobs, setScheduledJobs] = useState<ScheduledJob[]>([]);
  const [recentRuns, setRecentRuns] = useState<EventLog[]>([]);
  const [chartData, setChartData] = useState<Array<{ name: string; success: number; failed: number }>>([]);
  const [draftCron, setDraftCron] = useState<Record<string, string>>({});
  const [newJob, setNewJob] = useState({
    jobName: 'hourly-full-sync',
    cronExpression: '0 * * * *',
    description: 'Hourly full sync',
  });
  
  const API_URL = process.env.NEXT_PUBLIC_KONG_URL;
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availableSchemas, setAvailableSchemas] = useState<any[]>([]);

  // 1. Khởi tạo SSE cho Terminal
  useEffect(() => {
    const eventSource = new EventSource(`${API_URL}/integration/stream-logs`);

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

      const logsData = await IntegrationAPI.getLogs();
      setRecentRuns(logsData.slice(0, 8));

      const formattedChartData = logsData.slice(0, 7).reverse().map((log: EventLog) => {
        const date = new Date(log.createdAt);
        return {
          name: `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`,
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
          await IntegrationAPI.triggerCustomSync(selectedTables);
        } else {
          await IntegrationAPI.triggerFullSync();
        }
      }
      setTimeout(fetchDashboardData, 3000);
    } catch (error: any) {
      setLogs(prev => [...prev, { timestamp: new Date().toISOString(), type: 'ERROR', message: `HTTP Call failed: ${error.message}` }]);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleJob = async (id: string, currentStatus: boolean) => {
    await JobAPI.toggleJob(id, !currentStatus);
    fetchDashboardData();
  };

  const handleUpdateCron = async (job: ScheduledJob) => {
    const nextCronExpression = (draftCron[job._id] || '').trim();
    if (!nextCronExpression) {
      return;
    }

    await JobAPI.updateJob(job._id, {
      cronExpression: nextCronExpression,
    });
    fetchDashboardData();
  };

  const handleCreateJob = async () => {
    const jobName = newJob.jobName.trim();
    const cronExpression = newJob.cronExpression.trim();
    if (!jobName || !cronExpression) {
      return;
    }

    await JobAPI.createJob({
      jobName,
      jobType: 'FULL_SYNC',
      cronExpression,
      isActive: true,
      description: newJob.description.trim() || 'Custom full sync job',
    });

    setNewJob({
      jobName: `full-sync-${Date.now().toString().slice(-5)}`,
      cronExpression: '0 * * * *',
      description: 'Hourly full sync',
    });
    fetchDashboardData();
  };

  const formatDateTime = (value?: string | null) => {
    if (!value) {
      return 'N/A';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'N/A';
    }

    return date.toLocaleString('vi-VN');
  };

  const statusBadgeClass = (status: EventLog['status']) => {
    if (status === 'done') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (status === 'failed') return 'bg-red-50 text-red-700 border-red-200';
    if (status === 'partial_success') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const totalRuns = recentRuns.length;
  const successfulRuns = recentRuns.filter((run) => run.status === 'done').length;
  const failedRuns = recentRuns.filter((run) => run.status === 'failed').length;
  const successRate = totalRuns > 0 ? Math.round((successfulRuns / totalRuns) * 100) : 0;

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 shrink-0">
        <div className="flex flex-col gap-4">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-slate-800 flex items-center text-lg">
                <PlayCircle className="mr-2 h-5 w-5 text-blue-600" /> Manual Trigger
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => setIsModalOpen(true)}
                disabled={isSyncing}
                className="bg-blue-600 hover:bg-blue-700 text-white w-full h-10 font-semibold shadow-md"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'SYSTEM IS SYNCING...' : 'RUN FULL SYNC NOW'}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-slate-800 text-base">Create Scheduled Job</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <Input
                value={newJob.jobName}
                onChange={(e) => setNewJob(prev => ({ ...prev, jobName: e.target.value }))}
                placeholder="Job name"
              />
              <Input
                value={newJob.cronExpression}
                onChange={(e) => setNewJob(prev => ({ ...prev, cronExpression: e.target.value }))}
                placeholder="Cron expression (e.g. 0 * * * *)"
              />
              <Input
                value={newJob.description}
                onChange={(e) => setNewJob(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description"
              />
              <Button onClick={handleCreateJob} className="w-full bg-slate-900 hover:bg-slate-800 text-white">
                Add Job
              </Button>
            </CardContent>
          </Card>

          <Card className="flex-1 border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b">
              <div className="flex justify-between items-center">
                <CardTitle className="text-slate-800 flex items-center text-lg">
                  <Clock className="mr-2 h-5 w-5 text-slate-600" /> Scheduled Jobs
                </CardTitle>
                <Badge variant="outline" className="bg-slate-50">{scheduledJobs.length} Jobs</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y max-h-55 overflow-y-auto">
                {scheduledJobs.length === 0 ? (
                  <div className="p-4 text-sm text-center text-slate-500 italic">No scheduled jobs configured.</div>
                ) : (
                  scheduledJobs.map(job => (
                    <div key={job._id} className="p-4 space-y-3 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="font-semibold text-sm text-slate-800">{job.jobName}</div>
                        <div className="flex items-center gap-3">
                          <Switch 
                            checked={job.isActive} 
                            onCheckedChange={() => handleToggleJob(job._id, job.isActive)} 
                          />
                          <Button 
                            variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-100"
                            onClick={() => handleTriggerSync(job._id)}
                            title="Run this job now"
                          >
                            <PlayCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
                        <Input
                          value={draftCron[job._id] || ''}
                          onChange={(e) => setDraftCron(prev => ({ ...prev, [job._id]: e.target.value }))}
                          className="font-mono"
                          placeholder="Cron expression"
                        />
                        <Button
                          variant="outline"
                          onClick={() => handleUpdateCron(job)}
                        >
                          Save Interval
                        </Button>
                      </div>

                      <div className="text-xs text-slate-500 font-mono flex flex-wrap gap-x-4 gap-y-1">
                        <div className="flex items-center">
                          <CalendarDays className="h-3 w-3 mr-1" /> next: {formatDateTime(job.nextRunAt || null)}
                        </div>
                        <div>last: {formatDateTime(job.lastRunAt)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="xl:col-span-2 flex flex-col gap-4">
          <Card className="border-slate-200 shadow-sm flex flex-col">
            <CardHeader className="pb-0">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-slate-800 flex items-center text-lg">
                    <Activity className="mr-2 h-5 w-5 text-green-600" /> Execution Metrics (Last 7 runs)
                  </CardTitle>
                  <CardDescription>Records synchronized successfully vs failed across recent runs.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 pt-6 pb-4">
              {chartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 italic">No historical data available</div>
              ) : (
                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <Tooltip
                        cursor={{ fill: '#f1f5f9' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
                      <Bar dataKey="success" name="Success" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
                      <Bar dataKey="failed" name="Failed" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={50} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-slate-800 text-lg">Recently Run Jobs</CardTitle>
              <CardDescription>Latest executions and their outcomes.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y max-h-62.5 overflow-y-auto">
                {recentRuns.length === 0 ? (
                  <div className="p-4 text-sm text-center text-slate-500 italic">No run history available.</div>
                ) : (
                  recentRuns.map((run) => (
                    <div key={run._id} className="p-4 flex items-center justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{run.title}</div>
                        <div className="text-xs text-slate-500 mt-1">{formatDateTime(run.createdAt)}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className={statusBadgeClass(run.status)}>
                          {run.status}
                        </Badge>
                        <div className="text-xs text-slate-500">
                          {(run.details?.durationMs || 0) > 0 ? `${Math.round((run.details?.durationMs || 0) / 1000)}s` : '-'}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-auto shrink-0">
        <Terminal logs={logs} terminalEndRef={terminalEndRef} heightClassName="h-[34vh] md:h-[38vh]" />
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