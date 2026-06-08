'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Network, RefreshCw, Loader2, AlertTriangle, Wifi, WifiOff, Activity, Container, Cpu, MemoryStick, Shield, User } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

// ─── Types ────────────────────────────────────────────────────────────────────

type TimePoint = Record<string, number | string>;

interface WgPeerInfo {
  pubkeyShort: string;
  endpoint: string | null;
  allowedIps: string;
  name: string;
  role: string;
  online: boolean;
  lastSeen: string | null;
  ageSecs: number | null;
  rxMB: number;
  txMB: number;
}

interface WgStatus {
  available: boolean;
  message?: string;
  updatedAt?: string;
  staleSeconds?: number;
  onlineCount?: number;
  totalCount?: number;
  peers: WgPeerInfo[];
}

interface DockerService {
  id: string;
  name: string;
  image: string;
  state: string;
  status: string;
  ports: string | null;
  uptimeSeconds: number | null;
  cpu: number | null;
  memUsedMB: number | null;
  memLimitMB: number | null;
  memPercent: number | null;
  storageMB: number | null;
  storageRwMB: number | null;
}

interface KongMetrics {
  requestRate: TimePoint[];
  statusCodes: TimePoint[];
  latencyP99: TimePoint[];
  connections: Record<string, number>;
  errorRate: number | null;
  bandwidth: TimePoint[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LINE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
const REFRESH_INTERVAL_MS = 30_000;

function formatUptime(seconds: number | null): string {
  if (seconds === null) return '—';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`;
}

function getSeriesKeys(data: TimePoint[]): string[] {
  if (!data.length) return [];
  return Object.keys(data[0]).filter((k) => k !== 'time');
}

// Hiển thị ~6 mốc trên trục X, tránh bị sát nhau
function xTicks(data: TimePoint[]): number {
  return Math.max(1, Math.floor(data.length / 6));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, unit = '', color = 'blue' }: {
  label: string; value: string | number | null; unit?: string; color?: string;
}) {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-600', green: 'text-green-600', red: 'text-red-500', yellow: 'text-yellow-500',
  };
  return (
    <div className="bg-white border rounded-xl p-4 flex flex-col gap-1 shadow-sm">
      <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</span>
      <span className={`text-2xl font-bold ${colorMap[color] ?? 'text-slate-800'}`}>
        {value === null ? '—' : `${value}${unit}`}
      </span>
    </div>
  );
}

function ChartCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border rounded-xl p-4 shadow-sm">
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      {description && <p className="text-xs text-slate-400 mb-3 mt-0.5">{description}</p>}
      {!description && <div className="mb-3" />}
      {children}
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="h-48 flex flex-col items-center justify-center text-slate-400 gap-2">
      <Activity className="w-8 h-8 opacity-40" />
      <span className="text-sm">Chưa có dữ liệu từ Kong</span>
      <span className="text-xs opacity-70">Cần có traffic qua API Gateway</span>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function KongGatewayPage() {
  const [metrics, setMetrics] = useState<KongMetrics | null>(null);
  const [docker, setDocker] = useState<DockerService[] | null>(null);
  const [wg, setWg] = useState<WgStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [minutes, setMinutes] = useState(60);

  const fetchMetrics = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [kongRes, dockerRes, wgRes] = await Promise.allSettled([
        apiClient.get(`/metrics/kong?minutes=${minutes}`),
        apiClient.get('/metrics/docker'),
        apiClient.get('/metrics/wireguard'),
      ]);
      if (kongRes.status === 'fulfilled') setMetrics(kongRes.value.data as KongMetrics);
      else setError('Không kết nối được Prometheus');
      if (dockerRes.status === 'fulfilled') setDocker(dockerRes.value.data as DockerService[]);
      if (wgRes.status === 'fulfilled') setWg(wgRes.value.data as WgStatus);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  }, [minutes]);

  useEffect(() => {
    void fetchMetrics();
    const timer = setInterval(() => void fetchMetrics(true), REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [fetchMetrics]);

  const activeConnections = metrics
    ? (metrics.connections['active'] ?? Object.values(metrics.connections)[0] ?? 0)
    : null;

  const totalReqRate = metrics?.requestRate.length
    ? (() => {
        const last = metrics.requestRate[metrics.requestRate.length - 1];
        return parseFloat(
          Object.entries(last)
            .filter(([k]) => k !== 'time')
            .reduce((s, [, v]) => s + (v as number), 0)
            .toFixed(3),
        );
      })()
    : null;

  return (
    <div className="space-y-5 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Network className="w-7 h-7 text-blue-600" />
            API Gateway Monitoring
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Giám sát lưu lượng Kong Gateway theo thời gian thực (Prometheus)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Time range selector */}
          <select
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
            className="border rounded-lg px-3 py-1.5 text-sm bg-white"
          >
            <option value={15}>15 phút</option>
            <option value={30}>30 phút</option>
            <option value={60}>1 giờ</option>
            <option value={180}>3 giờ</option>
            <option value={360}>6 giờ</option>
            <option value={1440}>1 ngày</option>
            <option value={10080}>7 ngày</option>
          </select>

          {/* Status indicator */}
          <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${error ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            {error ? <WifiOff className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
            {error ? 'Offline' : lastUpdated ? `Cập nhật ${lastUpdated.toLocaleTimeString('vi-VN')}` : '—'}
          </span>

          <button
            onClick={() => void fetchMetrics()}
            disabled={loading}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error} — Đảm bảo Prometheus và Kong đang chạy.</span>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !metrics && (
        <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Đang tải dữ liệu từ Prometheus...</span>
        </div>
      )}

      {/* Dashboard */}
      {metrics && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Request rate (req/s)" value={totalReqRate} color="blue" />
            <StatCard
              label="Error rate"
              value={metrics.errorRate !== null ? metrics.errorRate : null}
              unit="%"
              color={metrics.errorRate !== null && metrics.errorRate > 5 ? 'red' : 'green'}
            />
            <StatCard label="Active connections" value={activeConnections} color="blue" />
            <StatCard
              label="Trạng thái"
              value={error ? 'Lỗi' : 'Online'}
              color={error ? 'red' : 'green'}
            />
          </div>

          {/* Charts grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Request rate by service */}
            <ChartCard
              title="Request rate theo service (req/s)"
              description="Số request/giây đến từng service qua Kong. Spike cao = traffic tăng đột biến, 0 = không có traffic."
            >
              {!metrics.requestRate.length ? <EmptyChart /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={metrics.requestRate} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="time" tick={{ fontSize: 11 }} interval={xTicks(metrics.requestRate)} />
                    <YAxis tick={{ fontSize: 11 }} width={40} />
                    <Tooltip />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                    {getSeriesKeys(metrics.requestRate).map((k, i) => (
                      <Line key={k} type="monotone" dataKey={k} stroke={LINE_COLORS[i % LINE_COLORS.length]} dot={false} strokeWidth={2} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            {/* Status codes */}
            <ChartCard
              title="HTTP status (2xx / 4xx / 5xx) (req/s)"
              description="Phân loại response theo mã HTTP. 2xx = thành công, 4xx = lỗi client (sai token/không có quyền), 5xx = lỗi server."
            >
              {!metrics.statusCodes.length ? <EmptyChart /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={metrics.statusCodes} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="time" tick={{ fontSize: 11 }} interval={xTicks(metrics.statusCodes)} />
                    <YAxis tick={{ fontSize: 11 }} width={40} />
                    <Tooltip />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="2xx" fill="#10b981" stackId="a" />
                    <Bar dataKey="4xx" fill="#f59e0b" stackId="a" />
                    <Bar dataKey="5xx" fill="#ef4444" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            {/* P99 Latency */}
            <ChartCard
              title="Latency P99 theo service (ms)"
              description="99% request được xử lý trong thời gian này. P99 = 200ms nghĩa là chỉ 1% request chậm hơn 200ms. Càng thấp càng tốt."
            >
              {!metrics.latencyP99.length ? <EmptyChart /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={metrics.latencyP99} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="time" tick={{ fontSize: 11 }} interval={xTicks(metrics.latencyP99)} />
                    <YAxis tick={{ fontSize: 11 }} width={45} unit="ms" />
                    <Tooltip formatter={(v) => [v != null ? `${v} ms` : '—']} />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                    {getSeriesKeys(metrics.latencyP99).map((k, i) => (
                      <Line key={k} type="monotone" dataKey={k} stroke={LINE_COLORS[i % LINE_COLORS.length]} dot={false} strokeWidth={2} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            {/* Bandwidth */}
            <ChartCard
              title="Bandwidth (MB/s)"
              description="Lưu lượng dữ liệu qua Kong. Ingress = dữ liệu client gửi lên, Egress = dữ liệu server trả về client."
            >
              {!metrics.bandwidth.length ? <EmptyChart /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={metrics.bandwidth} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="time" tick={{ fontSize: 11 }} interval={xTicks(metrics.bandwidth)} />
                    <YAxis tick={{ fontSize: 11 }} width={55} unit=" MB/s" />
                    <Tooltip formatter={(v) => [v != null ? `${v} MB/s` : '—']} />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="ingress" stroke="#3b82f6" dot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="egress" stroke="#f59e0b" dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>

          {/* WireGuard VPN */}
          {wg && (
            <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b bg-slate-50">
                <Shield className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-semibold text-slate-700">WireGuard VPN Peers</span>
                {wg.available && (
                  <span className="ml-auto flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                      {wg.onlineCount} online / {wg.totalCount} total
                    </span>
                    <span>Cập nhật: {wg.updatedAt}</span>
                  </span>
                )}
              </div>

              {!wg.available ? (
                <div className="flex items-center gap-3 p-4 text-sm text-slate-500">
                  <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />
                  {wg.message}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-slate-500 uppercase tracking-wide border-b">
                        <th className="px-4 py-2 text-left">Người dùng</th>
                        <th className="px-4 py-2 text-left">VPN IP</th>
                        <th className="px-4 py-2 text-left">Trạng thái</th>
                        <th className="px-4 py-2 text-left">Endpoint thực</th>
                        <th className="px-4 py-2 text-left">Kết nối lần cuối</th>
                        <th className="px-4 py-2 text-left">↓ Nhận</th>
                        <th className="px-4 py-2 text-left">↑ Gửi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {wg.peers.map((peer) => (
                        <tr key={peer.allowedIps} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-slate-400" />
                              <div>
                                <div className="font-medium text-slate-800 text-sm">{peer.name}</div>
                                <div className="text-xs text-slate-400">{peer.role}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-600">
                            {peer.allowedIps.replace('/32', '')}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                              peer.online
                                ? 'bg-green-50 text-green-700'
                                : peer.lastSeen
                                ? 'bg-slate-100 text-slate-600'
                                : 'bg-red-50 text-red-600'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${peer.online ? 'bg-green-500 animate-pulse' : peer.lastSeen ? 'bg-slate-400' : 'bg-red-400'}`} />
                              {peer.online ? 'Online' : peer.lastSeen ? 'Offline' : 'Chưa kết nối'}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-500">
                            {peer.endpoint ? peer.endpoint.split(':')[0] : '—'}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500">
                            {peer.lastSeen ?? '—'}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-600">{peer.rxMB} MB</td>
                          <td className="px-4 py-3 text-xs text-slate-600">{peer.txMB} MB</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Docker Services */}
          {docker && (
            <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b bg-slate-50">
                <Container className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-semibold text-slate-700">Docker Services</span>
                <span className="ml-auto text-xs text-slate-400">
                  {docker.filter(d => d.state === 'running').length}/{docker.length} running
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-slate-500 uppercase tracking-wide border-b">
                      <th className="px-4 py-2 text-left">Container</th>
                      <th className="px-4 py-2 text-left">Image</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-left">Uptime</th>
                      <th className="px-4 py-2 text-left">Ports</th>
                      <th className="px-4 py-2 text-left">
                        <span className="flex items-center gap-1"><Cpu className="w-3 h-3" /> CPU</span>
                      </th>
                      <th className="px-4 py-2 text-left">
                        <span className="flex items-center gap-1"><MemoryStick className="w-3 h-3" /> Memory</span>
                      </th>
                      <th className="px-4 py-2 text-left">Storage (Image)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {docker.map((svc) => (
                      <tr key={svc.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-2.5 font-mono text-xs font-medium text-slate-800">{svc.name}</td>
                        <td className="px-4 py-2.5 text-xs text-slate-500">{svc.image}</td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            svc.state === 'running'
                              ? 'bg-green-50 text-green-700'
                              : svc.state === 'exited'
                              ? 'bg-red-50 text-red-600'
                              : 'bg-yellow-50 text-yellow-700'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              svc.state === 'running' ? 'bg-green-500' : svc.state === 'exited' ? 'bg-red-500' : 'bg-yellow-500'
                            }`} />
                            {svc.state}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-slate-500">{formatUptime(svc.uptimeSeconds)}</td>
                        <td className="px-4 py-2.5 text-xs text-slate-500 font-mono">{svc.ports ?? '—'}</td>
                        <td className="px-4 py-2.5">
                          {svc.cpu !== null ? (
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${svc.cpu > 80 ? 'bg-red-400' : svc.cpu > 50 ? 'bg-yellow-400' : 'bg-blue-400'}`}
                                  style={{ width: `${Math.min(svc.cpu, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs text-slate-600">{svc.cpu}%</span>
                            </div>
                          ) : <span className="text-xs text-slate-400">—</span>}
                        </td>
                        <td className="px-4 py-2.5">
                          {svc.memUsedMB !== null ? (
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${(svc.memPercent ?? 0) > 80 ? 'bg-red-400' : (svc.memPercent ?? 0) > 60 ? 'bg-yellow-400' : 'bg-emerald-400'}`}
                                  style={{ width: `${Math.min(svc.memPercent ?? 0, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs text-slate-600">{svc.memUsedMB}MB</span>
                            </div>
                          ) : <span className="text-xs text-slate-400">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-slate-600">
                          {svc.storageMB != null ? `${svc.storageMB} MB` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <p className="text-xs text-slate-400 text-center">
            Tự động làm mới mỗi 30 giây · Dữ liệu từ Prometheus → Kong Prometheus Plugin
          </p>
        </>
      )}
    </div>
  );
}
