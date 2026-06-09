import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';

interface PrometheusRangeResult {
  metric: Record<string, string>;
  values: [number, string][];
}

interface PrometheusInstantResult {
  metric: Record<string, string>;
  value: [number, string];
}

@Controller('metrics')
@UseGuards(JwtAuthGuard)
export class MetricsController {
  private readonly prometheusUrl: string;

  constructor(private readonly config: ConfigService) {
    this.prometheusUrl = this.config.get<string>('PROMETHEUS_URL', 'http://prometheus:9090');
  }

  @Get('kong')
  async getKongMetrics(@Query('minutes') minutes = '60') {
    const mins = Math.min(Math.max(parseInt(minutes) || 60, 5), 10080);
    const end = Math.floor(Date.now() / 1000);
    const start = end - mins * 60;
    // ~120 data points cho mọi khoảng thời gian
    const step = mins <= 60 ? 15 : mins <= 360 ? 60 : mins <= 1440 ? 120 : 900;

    // Loại trừ route nội bộ của monitoring dashboard khỏi tất cả metrics
    const EXCLUDE_ROUTE = `route!="metrics-internal-route"`;

    const [requestRate, statusCodes, latencyP99, connections, errorRate, bandwidth, nginxReqs] =
      await Promise.allSettled([
        this.queryRange(`sum by (service) (rate(kong_http_requests_total{${EXCLUDE_ROUTE}}[2m]))`, start, end, step),
        this.queryRange(`sum by (code) (rate(kong_http_requests_total{${EXCLUDE_ROUTE}}[2m]))`, start, end, step),
        this.queryRange(
          // Kong 3.x renamed kong_latency_bucket{type="request"} → kong_request_latency_ms_bucket
          `histogram_quantile(0.99, sum by (le, service) (rate(kong_request_latency_ms_bucket{${EXCLUDE_ROUTE}}[2m])))`,
          start, end, step,
        ),
        this.queryInstant(`sum by (state) (kong_nginx_connections_total)`),
        this.queryInstant(
          `sum(rate(kong_http_requests_total{code=~"5..",${EXCLUDE_ROUTE}}[5m])) / sum(rate(kong_http_requests_total{${EXCLUDE_ROUTE}}[5m])) * 100`,
        ),
        this.queryRange(`sum by (direction) (rate(kong_bandwidth_bytes{${EXCLUDE_ROUTE}}[2m]))`, start, end, step),
        this.queryRange(`rate(kong_nginx_requests_total[2m])`, start, end, step),
      ]);

    const reqRateSeries = this.toTimeSeries(requestRate, 'service');
    const nginxReqSeries = this.toTimeSeries(nginxReqs, 'instance');

    return {
      // Use per-service metrics if available, fallback to basic nginx requests
      requestRate: reqRateSeries.length ? reqRateSeries : nginxReqSeries.map(p => ({ ...p, 'total': p['unknown'] ?? p[Object.keys(p).find(k => k !== 'time')!] })),
      statusCodes: this.toStatusSeries(statusCodes),
      // Kong 3.x: kong_request_latency_ms_bucket đã tính bằng ms, không cần *1000
      latencyP99: this.toTimeSeries(latencyP99, 'service', (v) => parseFloat(v.toFixed(2))),
      connections: this.toInstantMap(connections, 'state'),
      errorRate: this.toSingleValue(errorRate),
      bandwidth: this.toTimeSeries(bandwidth, 'direction', (v) => parseFloat((v / 1024 / 1024).toFixed(4))),
    };
  }

  // ─── Prometheus helpers ───────────────────────────────────────────────────

  private async queryRange(query: string, start: number, end: number, step: number, _transform?: (v: number) => number) {
    const url = `${this.prometheusUrl}/api/v1/query_range?query=${encodeURIComponent(query)}&start=${start}&end=${end}&step=${step}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`Prometheus ${res.status}`);
    const json = (await res.json()) as { status: string; data: { result: PrometheusRangeResult[] } };
    if (json.status !== 'success') throw new Error('Prometheus error');
    return json.data.result;
  }

  private async queryInstant(query: string) {
    const url = `${this.prometheusUrl}/api/v1/query?query=${encodeURIComponent(query)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`Prometheus ${res.status}`);
    const json = (await res.json()) as { status: string; data: { result: PrometheusInstantResult[] } };
    if (json.status !== 'success') throw new Error('Prometheus error');
    return json.data.result;
  }

  // ─── Transformers ─────────────────────────────────────────────────────────

  private toTimeSeries(
    settled: PromiseSettledResult<PrometheusRangeResult[]>,
    labelKey: string,
    transform: (v: number) => number = (v) => parseFloat(v.toFixed(4)),
  ) {
    if (settled.status === 'rejected' || !settled.value.length) return [];

    // Build merged timeline
    const timeMap = new Map<number, Record<string, number>>();
    for (const series of settled.value) {
      const label = series.metric[labelKey] ?? 'unknown';
      for (const [ts, val] of series.values) {
        if (!timeMap.has(ts)) timeMap.set(ts, {});
        timeMap.get(ts)![label] = transform(parseFloat(val));
      }
    }

    return Array.from(timeMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([ts, vals]) => ({
        time: new Date(ts * 1000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' }),
        ...vals,
      }));
  }

  private toStatusSeries(settled: PromiseSettledResult<PrometheusRangeResult[]>) {
    if (settled.status === 'rejected' || !settled.value.length) return [];

    const timeMap = new Map<number, { '2xx': number; '4xx': number; '5xx': number }>();

    for (const series of settled.value) {
      const code = series.metric['code'] ?? '0';
      const bucket = code.startsWith('2') ? '2xx' : code.startsWith('4') ? '4xx' : code.startsWith('5') ? '5xx' : null;
      if (!bucket) continue;

      for (const [ts, val] of series.values) {
        if (!timeMap.has(ts)) timeMap.set(ts, { '2xx': 0, '4xx': 0, '5xx': 0 });
        timeMap.get(ts)![bucket] += parseFloat(parseFloat(val).toFixed(4));
      }
    }

    return Array.from(timeMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([ts, vals]) => ({
        time: new Date(ts * 1000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' }),
        ...vals,
      }));
  }

  private toInstantMap(
    settled: PromiseSettledResult<PrometheusInstantResult[]>,
    labelKey: string,
  ): Record<string, number> {
    if (settled.status === 'rejected') return {};
    return Object.fromEntries(
      settled.value.map((r) => [r.metric[labelKey] ?? 'value', parseFloat(r.value[1])]),
    );
  }

  private toSingleValue(settled: PromiseSettledResult<PrometheusInstantResult[]>): number | null {
    if (settled.status === 'rejected' || !settled.value.length) return null;
    const val = parseFloat(settled.value[0].value[1]);
    return isNaN(val) ? null : parseFloat(val.toFixed(2));
  }

  // ─── Docker ───────────────────────────────────────────────────────────────

  @Get('docker')
  async getDockerServices() {
    const [containers, statsMap] = await Promise.all([
      this.dockerGet<DockerContainer[]>('/containers/json?all=true&size=true'),
      this.getAllStats(),
    ]);

    return containers.map((c) => {
      const name = (c.Names[0] ?? '').replace('/', '');
      const stats = statsMap[c.Id] ?? null;
      const ports = c.Ports.filter((p) => p.PublicPort)
        .map((p) => `${p.PublicPort}→${p.PrivatePort}`)
        .join(', ');

      const uptimeSeconds = c.State === 'running' ? Math.floor(Date.now() / 1000 - c.Created) : null;

      return {
        id: c.Id.substring(0, 12),
        name,
        image: c.Image.split(':')[0],
        state: c.State,
        status: c.Status,
        ports: ports || null,
        uptimeSeconds,
        cpu: stats?.cpu ?? null,
        memUsedMB: stats?.memUsedMB ?? null,
        memLimitMB: stats?.memLimitMB ?? null,
        memPercent: stats?.memPercent ?? null,
        storageMB: c.SizeRootFs != null ? parseFloat((c.SizeRootFs / 1024 / 1024).toFixed(0)) : null,
        storageRwMB: c.SizeRw != null ? parseFloat((c.SizeRw / 1024 / 1024).toFixed(1)) : null,
      };
    });
  }

  private async getAllStats(): Promise<Record<string, ContainerStats>> {
    const containers = await this.dockerGet<DockerContainer[]>('/containers/json');
    const results = await Promise.allSettled(
      containers.map(async (c) => {
        const s = await this.dockerGet<DockerStats>(`/containers/${c.Id}/stats?stream=false&one-shot=true`);
        const cpuDelta = s.cpu_stats.cpu_usage.total_usage - s.precpu_stats.cpu_usage.total_usage;
        const sysDelta = (s.cpu_stats.system_cpu_usage ?? 0) - (s.precpu_stats.system_cpu_usage ?? 0);
        const numCpus = s.cpu_stats.online_cpus ?? s.cpu_stats.cpu_usage.percpu_usage?.length ?? 1;
        const cpu = sysDelta > 0 ? parseFloat(((cpuDelta / sysDelta) * numCpus * 100).toFixed(2)) : 0;

        const memUsed = s.memory_stats.usage - (s.memory_stats.stats?.cache ?? 0);
        const memLimit = s.memory_stats.limit;
        return {
          id: c.Id,
          stats: {
            cpu,
            memUsedMB: parseFloat((memUsed / 1024 / 1024).toFixed(1)),
            memLimitMB: parseFloat((memLimit / 1024 / 1024).toFixed(0)),
            memPercent: parseFloat(((memUsed / memLimit) * 100).toFixed(1)),
          } as ContainerStats,
        };
      }),
    );

    const map: Record<string, ContainerStats> = {};
    for (const r of results) {
      if (r.status === 'fulfilled') map[r.value.id] = r.value.stats;
    }
    return map;
  }

  // ─── WireGuard ────────────────────────────────────────────────────────────

  @Get('wireguard')
  getWireguardPeers() {
    const statusFile = '/app/wg-status.json';
    const mappingFile = path.join(process.cwd(), 'wireguard-peers.json');

    // Đọc peer mapping
    let peerMap: Record<string, { name: string; role: string }> = {};
    try {
      peerMap = JSON.parse(fs.readFileSync(mappingFile, 'utf-8')) as typeof peerMap;
    } catch {
      // Dùng mapping rỗng nếu file không tồn tại
    }

    // Đọc wg status
    let wgData: { updated: number; peers: WgPeer[] };
    try {
      wgData = JSON.parse(fs.readFileSync(statusFile, 'utf-8')) as typeof wgData;
    } catch {
      return { available: false, message: 'Chưa có dữ liệu WireGuard. Chạy wg-export.sh trên EC2.', peers: [] };
    }

    const now = Math.floor(Date.now() / 1000);
    const staleSecs = now - wgData.updated;

    const peers = wgData.peers.map((p) => {
      const info = peerMap[p.allowed_ips] ?? { name: p.allowed_ips, role: 'unknown' };
      const lastSeen = p.last_handshake
        ? new Date(p.last_handshake * 1000).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
        : null;
      const ageSecs = p.last_handshake ? now - p.last_handshake : null;

      return {
        pubkeyShort: p.pubkey.substring(0, 8) + '...',
        endpoint: p.endpoint || null,
        allowedIps: p.allowed_ips,
        name: info.name,
        role: info.role,
        online: p.online,
        lastSeen,
        ageSecs,
        rxMB: parseFloat((p.rx / 1024 / 1024).toFixed(2)),
        txMB: parseFloat((p.tx / 1024 / 1024).toFixed(2)),
      };
    });

    return {
      available: true,
      updatedAt: new Date(wgData.updated * 1000).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
      staleSeconds: staleSecs,
      onlineCount: peers.filter((p) => p.online).length,
      totalCount: peers.length,
      peers,
    };
  }

  private dockerGet<T>(path: string): Promise<T> {
    return new Promise((resolve, reject) => {
      const req = http.request(
        { socketPath: '/var/run/docker.sock', path: `/v1.44${path}`, method: 'GET' },
        (res) => {
          let data = '';
          res.on('data', (chunk: string) => (data += chunk));
          res.on('end', () => {
            try { resolve(JSON.parse(data) as T); }
            catch (e) { reject(e); }
          });
        },
      );
      req.on('error', reject);
      req.end();
    });
  }
}

// ─── Docker API types ─────────────────────────────────────────────────────────

interface WgPeer {
  pubkey: string;
  endpoint: string;
  allowed_ips: string;
  last_handshake: number;
  online: boolean;
  rx: number;
  tx: number;
}

interface DockerContainer {
  Id: string;
  Names: string[];
  Image: string;
  State: string;
  Status: string;
  Created: number;
  Ports: { PublicPort?: number; PrivatePort: number; Type: string }[];
  SizeRootFs?: number;
  SizeRw?: number;
}

interface DockerStats {
  cpu_stats: { cpu_usage: { total_usage: number; percpu_usage?: number[] }; system_cpu_usage?: number; online_cpus?: number };
  precpu_stats: { cpu_usage: { total_usage: number }; system_cpu_usage?: number };
  memory_stats: { usage: number; limit: number; stats?: { cache?: number } };
}

interface ContainerStats {
  cpu: number;
  memUsedMB: number;
  memLimitMB: number;
  memPercent: number;
}
