'use client';

import { useEffect, useState } from 'react';
import { JobAPI } from '@/lib/api-client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Play, Edit } from "lucide-react";
import { useLanguage } from '@/lib/i18n';

export default function SchedulerPage() {
  const { t } = useLanguage();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    try {
      const data = await JobAPI.getJobs();
      setJobs(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJobs(); }, []);

  const handleToggle = async (id: string, currentStatus: boolean) => {
    await JobAPI.toggleJob(id, !currentStatus);
    fetchJobs();
  };

  const handleRunNow = async (id: string) => {
    try {
      await JobAPI.triggerJob(id);
      alert(t('sched.alertRun'));
      fetchJobs();
    } catch (e) {
      alert(t('sched.alertErr'));
    }
  };

  const formatDate = (date: string) =>
    date ? new Date(date).toLocaleString('vi-VN') : t('sched.neverRun');

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('sched.title')}</h1>
          <p className="text-slate-500">{t('sched.subtitle')}</p>
        </div>
        <Button className="bg-blue-600">{t('sched.addBtn')}</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><CalendarDays className="mr-2" /> {t('sched.listTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('sched.colName')}</TableHead>
                <TableHead>{t('sched.colCron')}</TableHead>
                <TableHead>{t('sched.colStatus')}</TableHead>
                <TableHead>{t('sched.colLast')}</TableHead>
                <TableHead className="text-right">{t('sched.colAction')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job._id}>
                  <TableCell>
                    <div className="font-bold text-slate-800">{job.jobName}</div>
                    <div className="text-xs text-slate-500">{job.description}</div>
                  </TableCell>
                  <TableCell>
                    <code className="bg-slate-100 px-2 py-1 rounded text-blue-600 font-mono">
                      {job.cronExpression}
                    </code>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={job.isActive}
                        onCheckedChange={() => handleToggle(job._id, job.isActive)}
                      />
                      <span className={`text-sm font-medium ${job.isActive ? 'text-green-600' : 'text-slate-400'}`}>
                        {job.isActive ? t('sched.active') : t('sched.paused')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {formatDate(job.lastRunAt)}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleRunNow(job._id)}>
                      <Play className="w-4 h-4 mr-1 text-green-600" /> {t('sched.runNow')}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4 text-blue-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {jobs.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-slate-500">
                    {t('sched.noJobs')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
