'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { Activity, Search, RefreshCw, Loader2, User, Table2, Calendar } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface LogEntry {
  id: number;
  username: string | null;
  tableName: string;
  method: string;
  statusCode: number;
  responseTimeMs: number | null;
  ipAddress: string | null;
  createdAt: string;
}

interface LogsResponse {
  total: number;
  page: number;
  limit: number;
  logs: LogEntry[];
}

interface Summary {
  byTable: { table: string; count: number }[];
  byUser: { user: string; count: number }[];
  byDay: { date: string; count: number }[];
}

const STATUS_COLOR: Record<string, string> = {
  '2': 'text-green-600 bg-green-50',
  '4': 'text-yellow-700 bg-yellow-50',
  '5': 'text-red-600 bg-red-50',
};

const METHOD_COLOR: Record<string, string> = {
  GET: 'bg-blue-50 text-blue-700',
  POST: 'bg-green-50 text-green-700',
  PATCH: 'bg-yellow-50 text-yellow-700',
  DELETE: 'bg-red-50 text-red-700',
};

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];

export default function AccessLogsPage() {
  const [logs, setLogs] = useState<LogsResponse | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [summaryDays, setSummaryDays] = useState(7);

  const [filterTable, setFilterTable] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [page, setPage] = useState(1);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '50',
        ...(filterTable ? { table: filterTable } : {}),
        ...(filterUser ? { user: filterUser } : {}),
        ...(filterFrom ? { from: filterFrom } : {}),
        ...(filterTo ? { to: filterTo } : {}),
      });

      const [logsRes, summaryRes] = await Promise.all([
        apiClient.get(`/api-logs?${params}`),
        apiClient.get(`/api-logs/summary?days=${summaryDays}`),
      ]);
      setLogs(logsRes.data as LogsResponse);
      setSummary(summaryRes.data as Summary);
    } finally {
      setLoading(false);
    }
  }, [page, filterTable, filterUser, filterFrom, filterTo, summaryDays]);

  useEffect(() => { void fetchAll(); }, [fetchAll]);

  const handleSearch = () => { setPage(1); void fetchAll(); };

  const totalPages = logs ? Math.ceil(logs.total / logs.limit) : 1;

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-600" />
            API Access Logs
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Theo dõi user nào gọi bảng nào trong master-data
          </p>
        </div>
        <button
          onClick={() => void fetchAll()}
          disabled={loading}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border hover:bg-slate-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* Summary charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* By day */}
        <div className="lg:col-span-1 bg-white border rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-4 h-4" /> Requests theo ngày
            </p>
            <select
              value={summaryDays}
              onChange={(e) => setSummaryDays(Number(e.target.value))}
              className="text-xs border rounded px-2 py-1"
            >
              <option value={7}>7 ngày</option>
              <option value={14}>14 ngày</option>
              <option value={30}>30 ngày</option>
            </select>
          </div>
          {summary?.byDay.length ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={summary.byDay} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-[180px] flex items-center justify-center text-slate-400 text-sm">Chưa có dữ liệu</div>}
        </div>

        {/* Top tables */}
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
            <Table2 className="w-4 h-4" /> Top bảng được truy cập
          </p>
          {summary?.byTable.length ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={summary.byTable} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 80 }}>
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="table" type="category" tick={{ fontSize: 10 }} width={80} />
                <Tooltip />
                <Bar dataKey="count" radius={[0, 3, 3, 0]}>
                  {summary.byTable.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-[180px] flex items-center justify-center text-slate-400 text-sm">Chưa có dữ liệu</div>}
        </div>

        {/* Top users */}
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
            <User className="w-4 h-4" /> Top user gọi nhiều nhất
          </p>
          {summary?.byUser.length ? (
            <div className="space-y-2 mt-1">
              {summary.byUser.slice(0, 6).map((u, i) => (
                <div key={u.user} className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 w-4">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-0.5">
                      <span className="text-xs font-medium text-slate-700">{u.user}</span>
                      <span className="text-xs text-slate-500">{u.count}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(u.count / (summary.byUser[0]?.count || 1)) * 100}%`,
                          background: CHART_COLORS[i % CHART_COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : <div className="h-[180px] flex items-center justify-center text-slate-400 text-sm">Chưa có dữ liệu</div>}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border rounded-xl p-4 shadow-sm">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[140px]">
            <label className="text-xs text-slate-500 mb-1 block">Bảng</label>
            <Input value={filterTable} onChange={(e) => setFilterTable(e.target.value)} placeholder="dm_dan_toc..." className="h-8 text-sm" />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="text-xs text-slate-500 mb-1 block">User</label>
            <Input value={filterUser} onChange={(e) => setFilterUser(e.target.value)} placeholder="admin..." className="h-8 text-sm" />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Từ ngày</label>
            <Input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} className="h-8 text-sm" />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Đến ngày</label>
            <Input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} className="h-8 text-sm" />
          </div>
          <Button onClick={handleSearch} size="sm" className="h-8 gap-1.5">
            <Search className="w-3.5 h-3.5" /> Tìm kiếm
          </Button>
          <Button onClick={() => { setFilterTable(''); setFilterUser(''); setFilterFrom(''); setFilterTo(''); setPage(1); }} variant="outline" size="sm" className="h-8">
            Xóa lọc
          </Button>
        </div>
      </div>

      {/* Log table */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50">
          <span className="text-sm font-semibold text-slate-700">
            {logs ? `${logs.total.toLocaleString()} records` : '—'}
          </span>
          <span className="text-xs text-slate-400">Trang {page}/{totalPages}</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Đang tải...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 uppercase tracking-wide border-b bg-slate-50">
                  <th className="px-4 py-2 text-left">Thời gian</th>
                  <th className="px-4 py-2 text-left">User</th>
                  <th className="px-4 py-2 text-left">Bảng</th>
                  <th className="px-4 py-2 text-left">Method</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Response time</th>
                  <th className="px-4 py-2 text-left">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {logs?.logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-slate-800">{log.username ?? '—'}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-700">{log.tableName}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-xs font-mono font-medium ${METHOD_COLOR[log.method] ?? 'bg-slate-100 text-slate-600'}`}>
                        {log.method}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLOR[String(log.statusCode)[0]] ?? 'bg-slate-100 text-slate-600'}`}>
                        {log.statusCode}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-500">
                      {log.responseTimeMs != null ? `${log.responseTimeMs}ms` : '—'}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-400">{log.ipAddress ?? '—'}</td>
                  </tr>
                ))}
                {!logs?.logs.length && (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400 text-sm">Chưa có log nào</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 px-4 py-3 border-t">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</Button>
            <span className="text-sm text-slate-600">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>→</Button>
          </div>
        )}
      </div>
    </div>
  );
}
