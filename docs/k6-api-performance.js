/**
 * k6 Load Test — Data Integration Hub API Performance
 * Slide 6.2: Hiệu năng API (P50 / P95 / P99)
 *
 * Endpoint thực tế trong codebase:
 *   GET  /auth/me                       → lightweight auth (thay cho /integration/status)
 *   POST /integration/run-custom-sync   → chạy sync bảng cụ thể
 *   POST /backup/trigger                → kích hoạt backup
 *   GET  /backup/list                   → danh sách backup
 *
 * Chạy trên EC2:
 *   k6 run --env BASE_URL=http://localhost:8000 \
 *          --env USERNAME=Data_Integration_Hub_Admin \
 *          --env PASSWORD=Admin@123456 \
 *          k6-api-performance.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

// ─── Config ──────────────────────────────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';
const USERNAME  = __ENV.USERNAME  || 'Data_Integration_Hub_Admin';
const PASSWORD  = __ENV.PASSWORD  || 'Admin@123456';

// ─── Custom metrics (true = record in ms) ────────────────────────────────────
const tAuthMe        = new Trend('p_GET_auth_me',              true);
const tRunSync       = new Trend('p_POST_integration_sync',    true);
const tBackupTrigger = new Trend('p_POST_backup_trigger',      true);
const tBackupList    = new Trend('p_GET_backup_list',          true);

// ─── Load profile ─────────────────────────────────────────────────────────────
export const options = {
  scenarios: {
    load: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '30s', target: 5  },
        { duration: '2m',  target: 10 },
        { duration: '30s', target: 0  },
      ],
    },
  },
  thresholds: {
    'p_GET_auth_me{p:95}':           ['p(95)<200'],
    'p_GET_backup_list{p:95}':       ['p(95)<500'],
    'p_POST_integration_sync{p:95}': ['p(95)<5000'],
    'p_POST_backup_trigger{p:95}':   ['p(95)<10000'],
    http_req_failed:                 ['rate<0.02'],
  },
};

// ─── Setup: login lấy JWT ─────────────────────────────────────────────────────
export function setup() {
  const res = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ username: USERNAME, password: PASSWORD }),
    { headers: { 'Content-Type': 'application/json' } },
  );

  if (res.status !== 200 && res.status !== 201) {
    console.error(`[SETUP] Login thất bại ${res.status}: ${res.body}`);
    return { token: '' };
  }

  const token = JSON.parse(res.body).accessToken || '';
  console.log(`[SETUP] Login OK — token: ${token.substring(0, 20)}...`);
  return { token };
}

// ─── Main loop ────────────────────────────────────────────────────────────────
export default function (data) {
  const h = {
    'Content-Type':  'application/json',
    'Authorization': `Bearer ${data.token}`,
  };

  // 1. GET /auth/me — lightweight, luôn chạy
  {
    const r = http.get(`${BASE_URL}/auth/me`, { headers: h });
    tAuthMe.add(r.timings.duration);
    check(r, { 'auth/me 200': (x) => x.status === 200 });
  }

  sleep(0.3);

  // 2. GET /backup/list — đọc danh sách, luôn chạy
  {
    const r = http.get(`${BASE_URL}/backup/list`, { headers: h });
    tBackupList.add(r.timings.duration);
    check(r, { 'backup/list 200': (x) => x.status === 200 });
  }

  sleep(0.3);

  // 3. POST /backup/trigger — heavy I/O, chỉ VU 1, mỗi 10 iteration
  if (__VU === 1 && __ITER % 10 === 0) {
    const r = http.post(
      `${BASE_URL}/backup/trigger`,
      JSON.stringify({ tableName: 'dm_gioi_tinh', trigger: 'manual' }),
      { headers: h, timeout: '30s' },
    );
    tBackupTrigger.add(r.timings.duration);
    check(r, { 'backup/trigger 2xx': (x) => x.status >= 200 && x.status < 300 });
    sleep(2); // cho backup xong
  }

  // 4. POST /integration/run-custom-sync — heavy CPU+DB, chỉ VU 1, mỗi 15 iteration
  if (__VU === 1 && __ITER % 15 === 0) {
    const r = http.post(
      `${BASE_URL}/integration/run-custom-sync`,
      JSON.stringify({ tableNames: ['dm_gioi_tinh'] }),
      { headers: h, timeout: '60s' },
    );
    tRunSync.add(r.timings.duration);
    check(r, { 'run-sync 2xx': (x) => x.status >= 200 && x.status < 300 });
    sleep(3);
  }

  sleep(0.5);
}

// ─── Teardown: in hướng dẫn copy kết quả ────────────────────────────────────
export function teardown() {
  console.log('\n========================================');
  console.log('SAO CHÉP VÀO SLIDE 6.2:');
  console.log('  p_GET_auth_me         → cột "GET /auth/me"');
  console.log('  p_POST_integration_sync → cột "POST /integration/run-custom-sync"');
  console.log('  p_POST_backup_trigger → cột "POST /backup/trigger"');
  console.log('  p_GET_backup_list     → cột "GET /backup/list"');
  console.log('  Lấy giá trị p(50) p(95) p(99) từ mỗi dòng Trend');
  console.log('========================================\n');
}
