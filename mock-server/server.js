/**
 * =======================================================================
 * MOCK SOURCE SERVER — Collision Defense Test Suite
 * Data Integration Hub Capstone Project
 *
 * Port: 3001
 * Mỗi route mô phỏng 1 kịch bản kiểm thử cho 1 cơ chế phòng thủ cụ thể.
 *
 * Index đầy đủ: GET http://localhost:3001/
 * =======================================================================
 */

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3001;
const MOCK_TOKEN = process.env.MOCK_TOKEN || "mock-secret-2026";

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  if (req.path === "/") return next();
  const token = req.query.accessToken || req.headers["x-api-key"];
  if (token !== MOCK_TOKEN) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  next();
});

// -----------------------------------------------------------------------
// HELPER — Build chuẩn response phân trang theo API Contract
// -----------------------------------------------------------------------
function buildResponse(
  tableName,
  allData,
  page,
  limit,
  overrideCurrentPage = null,
) {
  const totalRecords = allData.length;
  const totalPages = Math.ceil(totalRecords / limit) || 1;
  const startIndex = (page - 1) * limit;
  const payload = allData.slice(startIndex, startIndex + limit);

  return {
    success: true,
    timestamp: new Date().toISOString(),
    metadata: {
      tableName,
      totalRecords,
      totalPages,
      currentPage: overrideCurrentPage !== null ? overrideCurrentPage : page,
      limit,
    },
    payload,
  };
}

// -----------------------------------------------------------------------
// INDEX — Danh sách tất cả endpoint test
// -----------------------------------------------------------------------
app.get("/", (req, res) => {
  res.json({
    name: "Data Integration Hub — Mock Source Server",
    description: "Collision Defense Test Suite",
    port: PORT,
    testScenarios: {
      "TC-01 (Happy Path)": {
        GET: ["/dm_gioi_tinh", "/tcns_can_bo"],
        defense: "Baseline — Dữ liệu chuẩn, kỳ vọng sync 100% thành công",
      },
      "TC-02 (Schema Filter)": {
        GET: "/test/tc02-schema-filter",
        defense:
          "getValidScalarFields() — Fields lạ bị lọc, không gây Prisma Unknown field error",
        prismaModel: "dm_gioi_tinh",
      },
      "TC-03 (Dedup)": {
        GET: "/test/tc03-dedup",
        defense: "deduplicate() — Trùng PK trong cùng 1 batch, giữ record cuối",
        prismaModel: "dm_gioi_tinh",
      },
      "TC-04 (Type Norm — Int/Boolean)": {
        GET: "/test/tc04-wrong-types",
        defense:
          'normalizeRecord() — String "1"/"true" → Int/Boolean đúng kiểu',
        prismaModel: "dm_gioi_tinh",
      },
      "TC-04b (Type Norm — DateTime)": {
        GET: "/test/tc04b-datetime",
        defense:
          "normalizeRecord() — ISO string → Date object, chuỗi sai → null",
        prismaModel: "tcns_can_bo",
      },
      "TC-05 (Contract — no success field)": {
        GET: "/test/tc05-no-success",
        defense: 'API Contract Validation — Thiếu field "success", fail fast',
        prismaModel: "dm_gioi_tinh",
      },
      "TC-06 (Contract — success: false)": {
        GET: "/test/tc06-success-false",
        defense: "API Contract Validation — success !== true, fail fast",
        prismaModel: "dm_gioi_tinh",
      },
      "TC-07 (Contract — payload not array)": {
        GET: "/test/tc07-payload-not-array",
        defense:
          "API Contract Validation — payload là object thay vì Array, fail fast",
        prismaModel: "dm_gioi_tinh",
      },
      "TC-08 (Contract — no payload)": {
        GET: "/test/tc08-no-payload",
        defense:
          'API Contract Validation — Thiếu field "payload" hoàn toàn, fail fast',
        prismaModel: "dm_gioi_tinh",
      },
      "TC-09 (Page Mismatch)": {
        GET: "/test/tc09-page-mismatch",
        defense:
          "Page Mismatch Guard — Server luôn trả currentPage:1, phát hiện ở lần fetch page 2",
        prismaModel: "dm_gioi_tinh",
      },
      "TC-10 (Empty Payload)": {
        GET: "/test/tc10-empty-payload",
        defense: "Empty payload guard — Dừng loop sớm, tránh vòng lặp vô hạn",
        prismaModel: "dm_gioi_tinh",
      },
      "TC-11 (Dead Letter — Missing PK)": {
        GET: "/test/tc11-missing-pk",
        defense:
          "Dead Letter Log — Record thiếu/null PK bị log, batch còn lại vẫn sync",
        prismaModel: "dm_gioi_tinh",
      },
      "TC-12 (Dead Letter — DB Constraint)": {
        GET: "/test/tc12-constraint-violation",
        defense:
          "Dead Letter Log — Vi phạm VarChar(5), lưu lỗi, tiếp tục record kế",
        prismaModel: "dm_gioi_tinh",
      },
      "TC-13 (Schema Status Gate — config only)": {
        note: 'Không cần mock route. Set status="changed" trong MongoDB SchemaRegistry → chạy sync → bị skip',
      },
      "TC-14 (Bad Endpoint Guard — config only)": {
        note: 'Không cần mock route. Set dataFromApi="/check-all-schemas/xxx" trong MongoDB → chạy sync → bị skip',
      },
      "TC-15 (Idempotent Upsert — dùng lại TC-01)": {
        GET: "/dm_gioi_tinh",
        note: "Gọi sync 2 lần liên tiếp → đếm rows trong PostgreSQL, không tăng",
      },
      "BONUS (Multipage — 25 records, limit nhỏ)": {
        GET: "/test/tc-multipage?limit=5",
        defense:
          "Pagination loop — 5 trang × 5 records, verify tất cả 25 records được sync",
        prismaModel: "dm_gioi_tinh",
      },
      "PERF-01 (RAM Capacity Planning)": {
        GET: "/perf/ram-test?records=100000&recordSize=500&page=1&limit=5000",
        purpose: "Đo peak RAM khi sync N records với kích thước S bytes/record",
        params: "records=N, recordSize=bytes, page, limit",
        prismaModel: "nguoi_hoc",
      },
      "PERF-02 (Incremental Server-side Filter)": {
        GET: "/perf/incremental-test?page=1&limit=5000&updatedAfter=2026-04-20T00:00:00Z",
        purpose:
          "Verify updatedAfter filter — 1000 records, chỉ trả records thay đổi sau mốc",
        params: "updatedAfter=ISO8601 (optional)",
        prismaModel: "nguoi_hoc",
      },
      "TC-16 (Schema Drift / API Contract Violation)": {
        GET: "/test/tc16-schema-change",
        defense:
          "Schema Contract Guard — Phát hiện field lạ không có trong SchemaRegistry metadata, ném lỗi và dừng sync bảng",
        prismaModel: "dm_gioi_tinh",
      },
    },
  });
});

// -----------------------------------------------------------------------
//  TC-02 — SCHEMA FILTER
// Defense: getValidScalarFields() trong SyncEngineService
// Vấn đề: Source API trả về field lạ không có trong Prisma schema
// Kỳ vọng: Fields lạ bị lọc bỏ hoàn toàn, upsert thành công không có Prisma error
// Config SchemaRegistry: tableName="dm_gioi_tinh", dataFromApi="/test/tc02-schema-filter", primaryKey=["id"]
// -----------------------------------------------------------------------
app.get("/test/tc02-schema-filter", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5000;

  const dirtyData = [
    {
      // === Fields HỢP LỆ trong dm_gioi_tinh ===
      id: 901,
      ma: "SF_A",
      ten: "SchemaFilter Test A",
      active: true,
      // === Fields LẠ — phải bị lọc bởi getValidScalarFields() ===
      unknownField: "should be stripped",
      _injected: "<script>alert(1)</script>",
      hackerField: "DROP TABLE users;--",
      extraNumeric: 99999,
      sourceSystemInternalId: "SRC-UUID-abc123",
    },
    {
      id: 902,
      ma: "SF_B",
      ten: "SchemaFilter Test B",
      active: false,
      // Cột tương lai chưa migrate vào Prisma (schema version mismatch)
      newColumn_v2: "2025-01-01",
      legacyCode: "DEPRECATED",
      auditTrailJson: JSON.stringify({ who: "system", when: "2024" }),
    },
  ];

  console.log(
    `[TC-02 SCHEMA FILTER] Page ${page} — ${dirtyData.length} records với ${5} unknown fields mỗi record`,
  );
  setTimeout(
    () => res.json(buildResponse("dm_gioi_tinh", dirtyData, page, limit)),
    100,
  );
});

// -----------------------------------------------------------------------
//  TC-03 — DEDUP PER BATCH
// Defense: deduplicate() trong SyncEngineService
// Vấn đề: Source API trả 2+ records cùng PK trong 1 batch (source data quality issue)
// Kỳ vọng: id=801 xuất hiện 3 lần → chỉ giữ record cuối (V3), log "2 duplicates removed"
// Config SchemaRegistry: tableName="dm_gioi_tinh", dataFromApi="/test/tc03-dedup", primaryKey=["id"]
// -----------------------------------------------------------------------
app.get("/test/tc03-dedup", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5000;

  // Lưu ý constraint dm_gioi_tinh: ma VarChar(5), ten VarChar(20)
  const dupData = [
    // id=801 xuất hiện 3 lần → dedup giữ lại bản CUỐI CÙNG (D1C)
    // ten VarChar(20): tối đa 20 ký tự
    { id: 801, ma: "D1A", ten: "Dup801 v1 overwrite", active: true },
    { id: 802, ma: "N01", ten: "Binh thuong #1", active: true },
    { id: 801, ma: "D1B", ten: "Dup801 v2 overwrite", active: true },
    { id: 803, ma: "N02", ten: "Binh thuong #2", active: false },
    { id: 801, ma: "D1C", ten: "Dup801 v3 KEPT", active: false }, // ← được giữ lại
    // id=804 trùng 2 lần → giữ D2B
    { id: 804, ma: "D2A", ten: "Dup804 v1 overwrite", active: true },
    { id: 804, ma: "D2B", ten: "Dup804 v2 KEPT", active: false }, // ← được giữ lại
  ];

  console.log(
    `[TC-03 DEDUP] ${dupData.length} records raw, id=801 lặp ×3, id=804 lặp ×2 → sau dedup còn 5`,
  );
  setTimeout(
    () => res.json(buildResponse("dm_gioi_tinh", dupData, page, limit)),
    100,
  );
});

// -----------------------------------------------------------------------
//  TC-04 — TYPE NORMALIZATION (Int & Boolean)
// Defense: normalizeRecord() trong SyncEngineService
// Vấn đề: Source API serialize Int/Boolean thành String (lỗi JSON encoder phía source)
// Kỳ vọng: "901" → 901 (Int), "true"/"false"/"1" → true/false (Boolean)
// Config SchemaRegistry: tableName="dm_gioi_tinh", dataFromApi="/test/tc04-wrong-types", primaryKey=["id"]
// -----------------------------------------------------------------------
app.get("/test/tc04-wrong-types", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5000;

  // Lưu ý constraint: ma VarChar(5), ten VarChar(20)
  const wrongTypeData = [
    {
      id: "701", // String → Int
      ma: "TN_A",
      ten: "TypeNorm Test A", // 15 chars
      active: "true", // String → Boolean true
    },
    {
      id: "702", // String → Int
      ma: "TN_B",
      ten: "TypeNorm Test B", // 15 chars
      active: "false", // String → Boolean false
    },
    {
      id: "703", // String → Int
      ma: "TN_C",
      ten: "TypeNorm Test C", // 15 chars
      active: "1", // "1" → Boolean true
    },
    {
      id: "704", // String → Int
      ma: "TN_D",
      ten: "TypeNorm Test D", // 15 chars
      active: "true",
    },
  ];

  console.log(
    `[TC-04 WRONG TYPES] ${wrongTypeData.length} records: id dạng String, active dạng String`,
  );
  setTimeout(
    () => res.json(buildResponse("dm_gioi_tinh", wrongTypeData, page, limit)),
    100,
  );
});

// -----------------------------------------------------------------------
//  TC-04b — TYPE NORMALIZATION (DateTime)
// Defense: normalizeRecord() — ISO string → Date, chuỗi sai → null
// Dùng bảng: nguoi_hoc — id Int @id (KHÔNG autoincrement, source cung cấp)
//   → tránh PostgreSQL sequence conflict của các bảng @default(autoincrement())
// Fields DateTime test: ngaySinh, cccdNgayCap, doanNgayVao
// Config SchemaRegistry: tableName="nguoi_hoc", dataFromApi="/test/tc04b-datetime", primaryKey=["id"]
// -----------------------------------------------------------------------
app.get("/test/tc04b-datetime", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5000;

  // nguoi_hoc.id là Int @id (không autoincrement) → source phải cung cấp
  const dateData = [
    {
      id: 9001,
      ho: "Nguyễn",
      ten: "An",
      ngaySinh: "1990-06-15T00:00:00Z", //  ISO 8601 đầy đủ → Date object
      cccdNgayCap: "2020-03-20T00:00:00Z", //  ISO 8601 đầy đủ → Date object
      doanNgayVao: null, //  null giữ nguyên
      gioiTinh: "M",
      emailCaNhan: "nhan9001@hcmut.edu.vn",
    },
    {
      id: 9002,
      ho: "Trần",
      ten: "Bình",
      ngaySinh: "not-a-valid-date", // ❌ Sai định dạng → normalizeRecord trả null (không crash)
      cccdNgayCap: "2019-07-10", // ✅ Date-only string (không timezone) → Date object
      doanNgayVao: "2015-09-01T00:00:00Z", // ✅ ISO hợp lệ
      gioiTinh: "F",
      emailCaNhan: "binh9002@hcmut.edu.vn",
    },
    {
      id: 9003,
      ho: "Lê",
      ten: "Cường",
      ngaySinh: "2000-01-01", // ✅ Date-only (không có T/Z) → vẫn parse được
      cccdNgayCap: "invalid-date-string", // ❌ Sai → null
      doanNgayVao: "", // ❌ Empty string → new Date('') → Invalid → null
      gioiTinh: "M",
      emailCaNhan: "cuong9003@hcmut.edu.vn",
    },
  ];

  console.log(
    `[TC-04b DATETIME] nguoi_hoc — ${dateData.length} records, test ISO/date-only/invalid string`,
  );
  setTimeout(
    () => res.json(buildResponse("nguoi_hoc", dateData, page, limit)),
    100,
  );
});

// -----------------------------------------------------------------------
// TC-05 — API CONTRACT — Thiếu field "success"
// Defense: Contract check trong DataIntegrationService
// Vấn đề: Source API dùng cấu trúc khác, không có "success" key
// Kỳ vọng: Throw "[API CONTRACT VIOLATION]", table bị skip, ghi log error
// Config SchemaRegistry: tableName="dm_gioi_tinh", dataFromApi="/test/tc05-no-success", primaryKey=["id"]
// -----------------------------------------------------------------------
app.get("/test/tc05-no-success", (req, res) => {
  console.log('[TC-05 NO SUCCESS FIELD] Trả về response thiếu field "success"');
  // Vi phạm: không có "success" → contract check sẽ fail
  res.json({
    timestamp: new Date().toISOString(),
    metadata: {
      tableName: "dm_gioi_tinh",
      totalRecords: 2,
      totalPages: 1,
      currentPage: 1,
      limit: 5000,
    },
    // Dùng key "data" thay vì "payload" + thiếu "success"
    data: [
      { id: 1, ma: "M", ten: "Nam" },
      { id: 2, ma: "F", ten: "Nữ" },
    ],
  });
});

// -----------------------------------------------------------------------
//  TC-06 — API CONTRACT — success: false
// Defense: Contract check trong DataIntegrationService
// Vấn đề: Hệ thống nguồn đang lỗi, trả về success: false
// Kỳ vọng: Throw "[API CONTRACT VIOLATION]", table bị skip, ghi log error
// Config SchemaRegistry: tableName="dm_gioi_tinh", dataFromApi="/test/tc06-success-false", primaryKey=["id"]
// -----------------------------------------------------------------------
app.get("/test/tc06-success-false", (req, res) => {
  console.log("[TC-06 SUCCESS=FALSE] Mô phỏng hệ thống nguồn đang lỗi nội bộ");
  res.json({
    success: false, // ← Vi phạm contract
    error:
      "Upstream database connection timeout. Please retry after 60 seconds.",
    retryAfter: 60,
    errorCode: "DB_CONN_TIMEOUT",
  });
});

// -----------------------------------------------------------------------
//  TC-07 — API CONTRACT — payload không phải Array
// Defense: Contract check trong DataIntegrationService
// Vấn đề: Source API trả payload là Object (lỗi serialization)
// Kỳ vọng: Throw "[API CONTRACT VIOLATION]", table bị skip
// Config SchemaRegistry: tableName="dm_gioi_tinh", dataFromApi="/test/tc07-payload-not-array", primaryKey=["id"]
// -----------------------------------------------------------------------
app.get("/test/tc07-payload-not-array", (req, res) => {
  console.log("[TC-07 PAYLOAD NOT ARRAY] payload là object thay vì array");
  res.json({
    success: true,
    metadata: { totalPages: 1, currentPage: 1, totalRecords: 1, limit: 5000 },
    payload: {
      // ← Vi phạm: Object thay vì Array
      error: "Lỗi serialization phía source",
      hint: "Đây là object, không phải array",
    },
  });
});

// -----------------------------------------------------------------------
//  TC-08 — API CONTRACT — Thiếu field "payload"
// Defense: Contract check trong DataIntegrationService
// Vấn đề: Source API quên trả payload (chỉ trả metadata)
// Kỳ vọng: Throw "[API CONTRACT VIOLATION]" vì payload là undefined
// Config SchemaRegistry: tableName="dm_gioi_tinh", dataFromApi="/test/tc08-no-payload", primaryKey=["id"]
// -----------------------------------------------------------------------
app.get("/test/tc08-no-payload", (req, res) => {
  console.log("[TC-08 NO PAYLOAD] Trả về response không có field payload");
  res.json({
    success: true,
    metadata: {
      tableName: "dm_gioi_tinh",
      totalRecords: 0,
      totalPages: 1,
      currentPage: 1,
      limit: 5000,
    },
    // Thiếu "payload" hoàn toàn ← Vi phạm contract
    message: "Query executed but no payload returned.",
  });
});

// -----------------------------------------------------------------------
//  TC-09 — PAGE MISMATCH GUARD
// Defense: meta.currentPage check trong DataIntegrationService
// Vấn đề: CDN cached response / bug phân trang — server luôn trả currentPage: 1
// Kịch bản:
//   - Page 1: currentPage=1 → OK, totalPages=2 được ghi nhận
//   - Page 2: server vẫn trả currentPage=1 → MISMATCH → break loop
// Kỳ vọng: "[PAGE MISMATCH] Expected page 2, got 1. Skipping." → sync dừng
// Config SchemaRegistry: tableName="dm_gioi_tinh", dataFromApi="/test/tc09-page-mismatch", primaryKey=["id"]
// -----------------------------------------------------------------------
app.get("/test/tc09-page-mismatch", (req, res) => {
  const requestedPage = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5000;

  // Luôn trả currentPage: 1 bất kể page được request
  // → Page 1: match (1 === 1) → OK
  // → Page 2: mismatch (1 !== 2) → bị phát hiện bởi guard
  console.log(
    `[TC-09 PAGE MISMATCH] Requested page=${requestedPage}, nhưng server trả currentPage=1`,
  );

  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    metadata: {
      tableName: "dm_gioi_tinh",
      totalRecords: 6,
      totalPages: 2, // ← Có 2 trang, sẽ trigger loop lần 2
      currentPage: 1, // ← BUG: Luôn trả 1 dù request page 2
      limit,
    },
    payload: [
      { id: 601, ma: "PM_A", ten: "Page Mismatch Test A", active: true },
      { id: 602, ma: "PM_B", ten: "Page Mismatch Test B", active: true },
      { id: 603, ma: "PM_C", ten: "Page Mismatch Test C", active: false },
    ],
  });
});

// -----------------------------------------------------------------------
//  TC-10 — EMPTY PAYLOAD GUARD
// Defense: rawDataArray.length === 0 check trong DataIntegrationService
// Vấn đề: Server khai báo totalPages: 3 nhưng page 2 trả payload rỗng (bug phía source)
// Kỳ vọng: "Page 2 is empty. Stopping pagination." → dừng vòng lặp, không loop vô hạn
// Config SchemaRegistry: tableName="dm_gioi_tinh", dataFromApi="/test/tc10-empty-payload", primaryKey=["id"]
// -----------------------------------------------------------------------
app.get("/test/tc10-empty-payload", (req, res) => {
  const requestedPage = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5000;

  let payload = [];
  if (requestedPage === 1) {
    payload = [
      { id: 501, ma: "EP_A", ten: "Empty Payload Test A", active: true },
      { id: 502, ma: "EP_B", ten: "Empty Payload Test B", active: false },
    ];
  }
  // Page 2 trở đi: payload = [] (rỗng) dù server khai báo totalPages: 3

  console.log(
    `[TC-10 EMPTY PAYLOAD] Page=${requestedPage} → ${payload.length} records (totalPages=3, nhưng page 2+ rỗng)`,
  );
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    metadata: {
      tableName: "dm_gioi_tinh",
      totalRecords: 2,
      totalPages: 3, // ← Server khai báo sai (bug), thực tế chỉ có 1 trang data
      currentPage: requestedPage,
      limit,
    },
    payload,
  });
});

// -----------------------------------------------------------------------
//  TC-11 — DEAD LETTER — Records thiếu Primary Key
// Defense: errors[] → MongoDB (Dead Letter Log) trong SyncEngineService
// Vấn đề: 3/6 records có id=null hoặc không có field id
// Kỳ vọng:
//   - 3 records hợp lệ → sync thành công
//   - 3 records lỗi → vào errors[] trong EventLog (không drop silently)
//   - Batch tiếp tục, không bị abort toàn bộ
// Config SchemaRegistry: tableName="dm_gioi_tinh", dataFromApi="/test/tc11-missing-pk", primaryKey=["id"]
// -----------------------------------------------------------------------
app.get("/test/tc11-missing-pk", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5000;

  const mixedBatch = [
    // Lưu ý constraint: ma VarChar(5), ten VarChar(20)
    { id: 401, ma: "OK_1", ten: "Record hop le #1", active: true },
    { id: null, ma: "ER_1", ten: "PK null: dead ltr", active: true },
    { id: 402, ma: "OK_2", ten: "Record hop le #2", active: false },
    { ma: "ER_2", ten: "No id: dead ltr", active: true },
    { id: 403, ma: "OK_3", ten: "Record hop le #3", active: true },
    { id: null, ma: "ER_3", ten: "PK null2: dead ltr", active: false },
  ];

  console.log(
    `[TC-11 DEAD LETTER - MISSING PK] 6 records: 3 hợp lệ, 3 thiếu PK`,
  );
  setTimeout(
    () => res.json(buildResponse("dm_gioi_tinh", mixedBatch, page, limit)),
    100,
  );
});

// -----------------------------------------------------------------------
//  TC-12 — DEAD LETTER — Vi phạm DB Constraint (VarChar quá dài)
// Defense: errors[] → MongoDB (Dead Letter Log) trong SyncEngineService
// Vấn đề: field ma vượt quá VarChar(5) của dm_gioi_tinh → Prisma/PG throws error
// Kỳ vọng:
//   - Record id=301 và id=303 → sync thành công
//   - Record id=302 → lỗi constraint, vào errors[], không abort toàn batch
// Config SchemaRegistry: tableName="dm_gioi_tinh", dataFromApi="/test/tc12-constraint-violation", primaryKey=["id"]
// -----------------------------------------------------------------------
app.get("/test/tc12-constraint-violation", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5000;

  const constraintData = [
    { id: 301, ma: "CV1", ten: "Record hợp lệ #1", active: true },
    {
      id: 302,
      ma: "THIS_STRING_EXCEEDS_VARCHAR5_LIMIT_BADLY",
      ten: "Violated VarChar(5)",
      active: true,
    }, // intentionally bad ✅
    { id: 303, ma: "CV3", ten: "Record hop le #2 ok", active: false },
  ];

  console.log(
    `[TC-12 CONSTRAINT VIOLATION] 3 records: id=302 vi phạm VarChar(5) trường "ma"`,
  );
  setTimeout(
    () => res.json(buildResponse("dm_gioi_tinh", constraintData, page, limit)),
    100,
  );
});

// -----------------------------------------------------------------------
// BONUS — MULTIPAGE (25 records, limit nhỏ để test pagination loop)
// Config SchemaRegistry: tableName="dm_gioi_tinh", dataFromApi="/test/tc-multipage", primaryKey=["id"]
// Gọi: /test/tc-multipage?page=1&limit=5 (5 trang × 5 records = 25 total)
// -----------------------------------------------------------------------
const largeMockDataset = Array.from({ length: 25 }, (_, i) => ({
  id: 200 + i,
  ma: `MP${String(i).padStart(2, "0")}`,
  ten: `Phan trang so ${i + 1}`, // max "Phan trang so 25" = 16 chars ✅
  active: i % 2 === 0,
}));

app.get("/test/tc-multipage", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;

  const response = buildResponse("dm_gioi_tinh", largeMockDataset, page, limit);
  console.log(
    `[BONUS MULTIPAGE] Page ${page}/${response.metadata.totalPages} → ${response.payload.length} records`,
  );
  setTimeout(() => res.json(response), 100);
});

// -----------------------------------------------------------------------
// PERF-01 — RAM CAPACITY PLANNING TEST
// Mục tiêu: Đo peak RAM của sync job khi fetch N records với record size S bytes
//
// Cách dùng:
//   GET /perf/ram-test?records=100000&recordSize=500&page=1&limit=5000
//
// Config SchemaRegistry để test:
//   tableName: "nguoi_hoc"
//   dataFromApi: "/perf/ram-test?records=100000&recordSize=500"
//   syncStrategy: "upsert"
//   primaryKey: ["id"]
//
// Kết quả mong đợi: NestJS log [nguoi_hoc] Memory report { peakMB, deltaRSS, ... }
// -----------------------------------------------------------------------
app.get("/perf/ram-test", (req, res) => {
  const totalRecords = parseInt(req.query.records) || 10000;
  const recordSizeBytes = parseInt(req.query.recordSize) || 200;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5000;

  // Padding qua hinhThePath (VarChar(500)) — field lớn nhất trong nguoi_hoc
  // Base record ≈ 120 bytes → paddingLen = min(recordSizeBytes - 120, 480)
  const paddingLen = Math.min(Math.max(0, recordSizeBytes - 120), 480);
  const pathPad = "p".repeat(paddingLen);

  // Chỉ dùng fields có trong schema.details của nguoi_hoc
  const allData = Array.from({ length: totalRecords }, (_, i) => ({
    id: 10000 + i,
    ho: "Nguyen",
    ten: `SinhVien${i}`,
    gioiTinh: i % 2 === 0 ? "M" : "F",
    emailCaNhan: `sv${i}@hcmut.edu.vn`,
    hinhThePath: `/photos/sv${i}.jpg${pathPad}`,
    updatedAt: new Date(
      Date.now() - Math.random() * 86400000 * 30,
    ).toISOString(),
  }));

  const response = buildResponse("nguoi_hoc", allData, page, limit);

  console.log(
    `[PERF-01 RAM TEST] records=${totalRecords}, size≈${recordSizeBytes}B/record` +
      ` | page=${page}/${response.metadata.totalPages}, payload=${response.payload.length} records` +
      ` | estimated raw=${((totalRecords * recordSizeBytes) / 1024 / 1024).toFixed(1)}MB total`,
  );

  res.json(response);
});

// -----------------------------------------------------------------------
// PERF-02 — INCREMENTAL SYNC TEST (updatedAfter filter)
// Mục tiêu: Verify server-side filter hoạt động đúng — chỉ trả records có
//           updatedAt > updatedAfter param. Đo lượng records giảm được.
//
// Cách dùng:
//   GET /perf/incremental-test?page=1&limit=5000&updatedAfter=2026-04-20T00:00:00Z
//
// Config SchemaRegistry:
//   tableName: "nguoi_hoc"
//   dataFromApi: "/perf/incremental-test"
//   syncStrategy: "incremental"
//   primaryKey: ["id"]
//
// Dataset: 1000 records, updatedAt trải đều trong 30 ngày qua.
// Nếu updatedAfter = hôm qua → chỉ ~33 records được trả về (thay vì 1000).
// -----------------------------------------------------------------------
app.get("/perf/incremental-test", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5000;
  const updatedAfterRaw = req.query.updatedAfter;
  const updatedAfter = updatedAfterRaw ? new Date(updatedAfterRaw) : null;

  const TOTAL = 1000;
  const now = Date.now();
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

  // Tạo 1000 records với updatedAt trải đều trong 30 ngày qua
  // Chỉ dùng fields có trong schema.details của nguoi_hoc
  const allData = Array.from({ length: TOTAL }, (_, i) => ({
    id: 20000 + i,
    ho: "Trần",
    ten: `SinhVien${i}`,
    gioiTinh: i % 2 === 0 ? "M" : "F",
    emailCaNhan: `sv${i}@hcmut.edu.vn`,
    updatedAt: new Date(
      now - (THIRTY_DAYS_MS * (TOTAL - i)) / TOTAL,
    ).toISOString(),
  }));

  // Server-side filter: chỉ trả records có updatedAt > updatedAfter
  const filtered = updatedAfter
    ? allData.filter((r) => new Date(r.updatedAt) > updatedAfter)
    : allData;

  const response = buildResponse("nguoi_hoc", filtered, page, limit);

  console.log(
    `[PERF-02 INCREMENTAL] updatedAfter=${updatedAfterRaw || "none"}` +
      ` | total=${TOTAL}, filtered=${filtered.length}` +
      ` (${((filtered.length / TOTAL) * 100).toFixed(1)}% trả về)` +
      ` | page=${page}/${response.metadata.totalPages}`,
  );

  res.json(response);
});

// -----------------------------------------------------------------------
// nh_van_bang — 100 000 records, generated deterministically at startup
// Fields: id, maNguoiHoc, cccdSo, maCtdt, maNganh, tnSoQd, tnNgayQd,
//         tnXepLoai, vbNgayCap, vbSoHieu, vbSoVaoSoGoc, nhDaoTaoId
// PK: id (Int @id @default(autoincrement())) — source phải cung cấp
// -----------------------------------------------------------------------
const NH_VAN_BANG_TOTAL = 100000;

console.log(
  "[INIT] Generating nh_van_bang dataset (" +
    NH_VAN_BANG_TOTAL +
    " records)...",
);
const _t0 = Date.now();

const _maCtdtList = [
  "KHMT",
  "KTPM",
  "KTDT",
  "HTTT",
  "QTKD",
  "KTXD",
  "CNSH",
  "VLKT",
];
const _maNganhList = [
  "7480101",
  "7480103",
  "7520207",
  "7340101",
  "7580201",
  "7420101",
  "7510401",
];
const _xepLoaiList = [
  "Xuat sac",
  "Gioi",
  "Kha",
  "Trung binh kha",
  "Trung binh",
];

const nhVanBangDataset = Array.from({ length: NH_VAN_BANG_TOTAL }, (_, i) => {
  const gradYear = 2015 + (Math.floor(i / 10000) % 10); // spread 2015-2024
  const seq = String(i + 1).padStart(6, "0");
  const studentYear = gradYear - 4;
  const month = 5 + (i % 3); // June/July/August graduation
  const day = 1 + (i % 25);
  const issueDay = 1 + ((i + 5) % 27);

  return {
    id: i + 1,
    maNguoiHoc: studentYear + seq.slice(0, 7), // e.g. "20110000001"  ≤20
    cccdSo: String(100000000000 + i), // 12-digit  ≤20
    maCtdt: _maCtdtList[i % _maCtdtList.length], // ≤50
    maNganh: _maNganhList[i % _maNganhList.length], // ≤50
    tnSoQd: "QD-" + gradYear + "-" + seq, // ≤50
    tnNgayQd: new Date(gradYear, month, day).toISOString(),
    tnXepLoai: _xepLoaiList[i % _xepLoaiList.length], // ≤50
    vbNgayCap: new Date(gradYear, month + 2, issueDay).toISOString(),
    vbSoHieu: "VB-" + gradYear + "-" + seq, // ≤50
    vbSoVaoSoGoc: "SG-" + gradYear + "-" + seq, // ≤50
    nhDaoTaoId: null, // nullable FK — avoid constraint violation in demo
  };
});

console.log("[INIT] nh_van_bang ready in " + (Date.now() - _t0) + "ms");

// -----------------------------------------------------------------------
// ✅ TC-01 — HAPPY PATH (Đặt CUỐI CÙNG để không chặn /test/* routes)
// Defense: Baseline — Toàn bộ pipeline chạy thành công
// -----------------------------------------------------------------------
const happyPathDatasets = {
  dm_gioi_tinh: [
    { id: 1, ma: "M", ten: "Nam", active: true },
    { id: 2, ma: "F", ten: "Nữ", active: true },
    { id: 3, ma: "O", ten: "Khác", active: false },
  ],

  // ── 22 bảng danh mục cần mock (field names khớp schema.prisma) ─────────

  // ma VarChar(5), ten VarChar(50)
  dm_chuc_danh_khoa_hoc: [
    { ma: "GS", ten: "Giáo sư", active: true },
    { ma: "PGS", ten: "Phó Giáo sư", active: true },
    { ma: "TS", ten: "Tiến sĩ", active: true },
    { ma: "ThS", ten: "Thạc sĩ", active: true },
    { ma: "CN", ten: "Cử nhân", active: true },
    { ma: "KS", ten: "Kỹ sư", active: true },
    { ma: "BS", ten: "Bác sĩ", active: true },
  ],

  // ma VarChar(20), ten VarChar(100), ngoaiNgu VarChar(5)
  dm_dt_chung_chi_ngoai_ngu: [
    { ma: "IELTS", ten: "IELTS", ngoaiNgu: "EN", active: true },
    { ma: "TOEFL", ten: "TOEFL iBT", ngoaiNgu: "EN", active: true },
    { ma: "TOEIC", ten: "TOEIC", ngoaiNgu: "EN", active: true },
    { ma: "DELF", ten: "DELF/DALF", ngoaiNgu: "FR", active: true },
    { ma: "JLPT", ten: "JLPT", ngoaiNgu: "JA", active: true },
    { ma: "HSK", ten: "HSK", ngoaiNgu: "ZH", active: true },
    { ma: "TOPIK", ten: "TOPIK", ngoaiNgu: "KO", active: true },
  ],

  // ma VarChar(5), ten VarChar(200)
  dm_dt_doi_tuong_anqp: [
    { ma: "DT1", ten: "Đối tượng 1 - Miễn học phần GDQPAN", active: true },
    { ma: "DT2", ten: "Đối tượng 2 - Miễn học phần 1", active: true },
    { ma: "DT3", ten: "Đối tượng 3 - Học đầy đủ", active: true },
    { ma: "DT4", ten: "Đối tượng 4 - Tạm hoãn", active: true },
  ],

  // nhomLuong VarChar(10) @unique, tenBacLuong VarChar(10)
  dm_nhom_luong: [
    { nhomLuong: "A", maBacLuong: 3, tenBacLuong: "Nhom A", heSoLuong: 3.0 },
    { nhomLuong: "B", maBacLuong: 3, tenBacLuong: "Nhom B", heSoLuong: 2.26 },
    { nhomLuong: "C", maBacLuong: 2, tenBacLuong: "Nhom C", heSoLuong: 1.65 },
    // VarChar(10) violation → Dead Letter Log, 3 record trên vẫn sync thành công
    {
      nhomLuong: "D",
      maBacLuong: 1,
      tenBacLuong: "Nhom D",
      heSoLuong: 4.27,
    },
  ],

  // ma VarChar(5), ten VarChar(50)
  dm_trinh_do_pho_thong: [
    { ma: "TH", ten: "Tiểu học", active: true },
    { ma: "THCS", ten: "Trung học cơ sở", active: true },
    { ma: "THPT", ten: "Trung học phổ thông", active: true },
    { ma: "BTTH", ten: "Bổ túc trung học", active: true },
  ],

  // ma VarChar(20), ten VarChar(100), loaiVtvl VarChar(20)?
  dm_vi_tri_viec_lam: [
    { ma: "GV", ten: "Giảng viên", loaiVtvl: "GD", active: true },
    { ma: "GVC", ten: "Giảng viên chính", loaiVtvl: "GD", active: true },
    { ma: "GVCC", ten: "Giảng viên cao cấp", loaiVtvl: "GD", active: true },
    { ma: "NC", ten: "Nghiên cứu viên", loaiVtvl: "NC", active: true },
    { ma: "CV", ten: "Chuyên viên", loaiVtvl: "HC", active: true },
    { ma: "CVC", ten: "Chuyên viên chính", loaiVtvl: "HC", active: true },
    { ma: "CVCC", ten: "Chuyên viên cao cấp", loaiVtvl: "HC", active: true },
  ],

  // ma VarChar(5), ten VarChar(100)
  dm_doi_tuong_chinh_sach: [
    { ma: "CS1", ten: "Con liệt sĩ", active: true },
    { ma: "CS2", ten: "Con thương binh loại 1/4", active: true },
    { ma: "CS3", ten: "Con thương binh loại 2/4", active: true },
    { ma: "CS4", ten: "Dân tộc thiểu số", active: true },
    { ma: "CS5", ten: "Người khuyết tật", active: true },
    { ma: "CS6", ten: "Hộ nghèo", active: true },
    { ma: "CS7", ten: "Hộ cận nghèo", active: true },
  ],

  // ma VarChar(5), ten VarChar(100)
  dm_dt_chung_chi_tin_hoc: [
    { ma: "A", ten: "Chứng chỉ Tin học A", active: true },
    { ma: "B", ten: "Chứng chỉ Tin học B", active: true },
    {
      ma: "C",
      ten: "Chứng chỉ Tin học C",
      active: true,
      noiCap: "Ho Chi Minh",
      thoiHan: "24",
    },
    { ma: "IC3", ten: "IC3 Computing Core", active: true },
    { ma: "MOS", ten: "Microsoft Office Specialist", active: true },
    { ma: "ICDL", ten: "ICDL", active: true },
  ],

  // ma VarChar(5), ten VarChar(50)
  dm_dt_hinh_thuc_cm: [
    { ma: "DH", ten: "Đại học chính quy", active: true },
    { ma: "VLVH", ten: "Vừa làm vừa học", active: true },
    { ma: "LT", ten: "Liên thông", active: true },
    { ma: "BDCM", ten: "Bồi dưỡng chuyên môn", active: true },
    { ma: "TDH", ten: "Tự đào tạo", active: true },
  ],

  // ma VarChar(5), ten VarChar(100)
  dm_dt_van_bang_llct: [
    { ma: "SC", ten: "Sơ cấp lý luận chính trị", active: true },
    { ma: "TC", ten: "Trung cấp lý luận chính trị", active: true },
    { ma: "CC", ten: "Cao cấp lý luận chính trị", active: true },
    { ma: "CD", ten: "Cử nhân chính trị", active: true },
  ],

  // ma VarChar(20), ten VarChar(100)
  dm_ngach_cdnn: [
    { ma: "15.111", ten: "Giảng viên cao cấp", active: true },
    { ma: "15.112", ten: "Giảng viên chính", active: true },
    { ma: "15.113", ten: "Giảng viên", active: true },
    { ma: "01.003", ten: "Chuyên viên cao cấp", active: true },
    { ma: "01.004", ten: "Chuyên viên chính", active: true },
    { ma: "01.005", ten: "Chuyên viên", active: true },
  ],

  // ma VarChar(10), ten VarChar(100)
  dm_noi_cap_cccd: [
    { ma: "CA-HCM", ten: "Công an TP. Hồ Chí Minh", active: true },
    { ma: "CA-HN", ten: "Công an TP. Hà Nội", active: true },
    { ma: "CA-DN", ten: "Công an TP. Đà Nẵng", active: true },
    { ma: "CA-BD", ten: "Công an tỉnh Bình Dương", active: true },
    { ma: "CA-LA", ten: "Công an tỉnh Long An", active: true },
    { ma: "CA-AG", ten: "Công an tỉnh An Giang", active: true },
  ],

  // ma VarChar(50), ten VarChar(500)
  dm_xep_loai_chuyen_mon: [
    { ma: "XS", ten: "Xuất sắc", active: true },
    { ma: "G", ten: "Giỏi", active: true },
    { ma: "K", ten: "Khá", active: true },
    { ma: "TBK", ten: "Trung bình khá", active: true },
    { ma: "TB", ten: "Trung bình", active: true },
    { ma: "Y", ten: "Yếu", active: true },
  ],

  // ma VarChar(5), ten VarChar(50)
  dm_dt_ngoai_ngu: [
    { ma: "EN", ten: "Tiếng Anh", active: true },
    { ma: "FR", ten: "Tiếng Pháp", active: true },
    { ma: "RU", ten: "Tiếng Nga", active: true },
    { ma: "ZH", ten: "Tiếng Trung", active: true },
    { ma: "JA", ten: "Tiếng Nhật", active: true },
    { ma: "KO", ten: "Tiếng Hàn", active: true },
    { ma: "DE", ten: "Tiếng Đức", active: true },
  ],

  // ma VarChar(5), ten VarChar(70)
  dm_loai_chuc_vu: [
    { ma: "LCV1", ten: "Lãnh đạo cấp Bộ", active: true },
    { ma: "LCV2", ten: "Lãnh đạo cấp Trường", active: true },
    { ma: "LCV3", ten: "Lãnh đạo cấp Khoa/Phòng", active: true },
    { ma: "LCV4", ten: "Lãnh đạo cấp Bộ môn", active: true },
    { ma: "NV", ten: "Nhân viên/Chuyên viên", active: true },
  ],

  // ma VarChar(10), ten VarChar(100)
  dm_loai_phu_cap: [
    { ma: "PCTN", ten: "Phụ cấp thâm niên", active: true },
    { ma: "PCCV", ten: "Phụ cấp chức vụ", active: true },
    { ma: "PCDK", ten: "Phụ cấp độc hại", active: true },
    { ma: "PCUU", ten: "Phụ cấp ưu đãi ngành", active: true },
    { ma: "PCTA", ten: "Phụ cấp trách nhiệm", active: true },
    { ma: "PCHT", ten: "Phụ cấp hỗ trợ", active: true },
  ],

  // ma VarChar(20), ten VarChar(200)
  dm_ngan_hang: [
    { ma: "VCB", ten: "Vietcombank", active: true },
    { ma: "BIDV", ten: "BIDV", active: true },
    { ma: "VTB", ten: "Vietinbank", active: true },
    { ma: "AGRIB", ten: "Agribank", active: true },
    { ma: "TCB", ten: "Techcombank", active: true },
    { ma: "MB", ten: "MB Bank", active: true },
    { ma: "ACB", ten: "ACB", active: true },
    { ma: "VPB", ten: "VPBank", active: true },
    { ma: "SCB", ten: "Sacombank", active: true },
    { ma: "SCB", ten: "Sacombank", active: true, diachi: "HCM" },
  ],

  // ma VarChar(20), ten VarChar(200)
  dm_chuyen_nganh_bgd: [
    { ma: "480101", ten: "Khoa học máy tính", active: true },
    {
      ma: "480102",
      ten: "Mạng máy tính và truyền thông dữ liệu",
      active: true,
    },
    { ma: "480103", ten: "Kỹ thuật phần mềm", active: true },
    { ma: "520201", ten: "Kỹ thuật điện", active: true },
    { ma: "520207", ten: "Kỹ thuật điện tử - viễn thông", active: true },
  ],

  // ma VarChar(5), ten VarChar(200)
  dm_danh_hieu_nha_nuoc: [
    { ma: "NGND", ten: "Nhà giáo nhân dân", active: true },
    { ma: "NGUT", ten: "Nhà giáo ưu tú", active: true },
    { ma: "NSND", ten: "Nghệ sĩ nhân dân", active: true },
    { ma: "NSUT", ten: "Nghệ sĩ ưu tú", active: true },
    { ma: "AHLD", ten: "Anh hùng lao động", active: true },
    { ma: "AHLVT", ten: "Anh hùng lực lượng vũ trang", active: true },
  ],

  // ma VarChar(5), ten VarChar(100)
  dm_dt_chung_chi_bdnv: [
    { ma: "QLGD", ten: "Chứng chỉ Quản lý giáo dục", active: true },
    { ma: "NVSP", ten: "Chứng chỉ Nghiệp vụ sư phạm", active: true },
    { ma: "QLNN", ten: "Chứng chỉ Quản lý nhà nước", active: true },
    { ma: "BDTX", ten: "Chứng chỉ Bồi dưỡng thường xuyên", active: true },
    { ma: "CCDG", ten: "Chứng chỉ Chức danh giảng viên", active: true },
  ],

  // ma VarChar(5), ten VarChar(50)
  dm_dt_hinh_thuc_llct: [
    { ma: "TT", ten: "Tập trung", active: true },
    { ma: "VLVH", ten: "Vừa làm vừa học", active: true },
    { ma: "TDH", ten: "Tự nghiên cứu", active: true },
    { ma: "TTNN", ten: "Tập trung nước ngoài", active: true },
  ],

  // dm_gioi_tinh_2 chưa có trong schema.prisma — dùng cùng cấu trúc dm_gioi_tinh
  dm_gioi_tinh_2: [
    { ma: "M", ten: "Nam", active: true },
    { ma: "F", ten: "Nữ", active: true },
    { ma: "O", ten: "Khác", active: true },
  ],

  // ── Bảng nghiệp vụ (field names khớp schema.prisma) ────────────────────

  // nh_van_bang: 100 000 records pre-generated above
  nh_van_bang: nhVanBangDataset,

  // tcns_ly_lich — Lý lịch cán bộ
  // PK upsert: shcc (@unique) — KHÔNG gửi "id" (autoincrement)
  tcns_ly_lich: [
    {
      shcc: "SH111",
      maNhanVien: "CB001",
      ho: "Nguyễn Văn",
      ten: "An",
      ngaySinh: "1985-05-15T00:00:00.000Z",
      gioiTinh: "M",
      danToc: "01",
      tonGiao: "KT",
      quocTich: "VN",
      emailCaNhan: "nvan.personal@gmail.com",
      email: "nvan@hcmut.edu.vn",
      chieuCao: 170,
      canNang: 65,
      nhomMau: "A",
      cccd: "079085012345",
      ngayCapCccd: "2021-03-10T00:00:00.000Z",
      noiCapCccd: "CA-HCM",
      sdt: "0901234567",
      maSoThue: "0123456789",
      stk: "1234567890",
      nganHang: "VCB",
      isDangVien: true,
      ngayVaoDang: "2010-02-03T00:00:00.000Z",
      bhxh: "7901234567890",
      bhyt: "GD4012345678901",
      sucKhoe: "Tốt",
    },
    {
      shcc: "SH112",
      maNhanVien: "CB002",
      ho: "Trần Thị",
      ten: "Bình",
      ngaySinh: "1990-08-20T00:00:00.000Z",
      gioiTinh: "F",
      danToc: "01",
      tonGiao: "KT",
      quocTich: "VN",
      emailCaNhan: "ttbinh.personal@gmail.com",
      email: "ttbinh@hcmut.edu.vn",
      chieuCao: 158,
      canNang: 52,
      nhomMau: "B",
      cccd: "079090056789",
      ngayCapCccd: "2020-07-15T00:00:00.000Z",
      noiCapCccd: "CA-HCM",
      sdt: "0912345678",
      isDangVien: false,
      bhxh: "7901234567891",
      bhyt: "GD4012345678902",
      sucKhoe: "Tốt",
    },
    {
      shcc: "SH113",
      maNhanVien: "CB003",
      ho: "Lê Hoàng",
      ten: "Cường",
      ngaySinh: "1978-12-01T00:00:00.000Z",
      gioiTinh: "M",
      danToc: "01",
      tonGiao: "PG",
      quocTich: "VN",
      emailCaNhan: "lhcuong.personal@gmail.com",
      email: "lhcuong@hcmut.edu.vn",
      chieuCao: 175,
      canNang: 72,
      nhomMau: "O",
      cccd: "079078098765",
      ngayCapCccd: "2019-11-20T00:00:00.000Z",
      noiCapCccd: "CA-HCM",
      sdt: "0923456789",
      isDangVien: true,
      ngayVaoDang: "2005-05-19T00:00:00.000Z",
      bhxh: "7901234567892",
      bhyt: "GD4012345678903",
      sucKhoe: "Khá",
    },
    {
      shcc: "SH114",
      maNhanVien: "CB004",
      ho: "Phạm Minh",
      ten: "Đức",
      ngaySinh: "1982-03-25T00:00:00.000Z",
      gioiTinh: "M",
      danToc: "01",
      tonGiao: "KT",
      quocTich: "VN",
      emailCaNhan: "pmduc.personal@gmail.com",
      email: "pmduc@hcmut.edu.vn",
      chieuCao: 168,
      canNang: 68,
      nhomMau: "AB",
      cccd: "079082076543",
      ngayCapCccd: "2020-04-05T00:00:00.000Z",
      noiCapCccd: "CA-HN",
      sdt: "0934567890",
      isDangVien: true,
      ngayVaoDang: "2008-02-03T00:00:00.000Z",
      bhxh: "7901234567893",
      bhyt: "GD4012345678904",
      sucKhoe: "Tốt",
    },
    {
      shcc: "SH115",
      maNhanVien: "CB005",
      ho: "Vũ Thị",
      ten: "Hoa",
      ngaySinh: "1993-06-10T00:00:00.000Z",
      gioiTinh: "F",
      danToc: "01",
      tonGiao: "KT",
      quocTich: "VN",
      emailCaNhan: "vthoa.personal@gmail.com",
      email: "vthoa@hcmut.edu.vn",
      chieuCao: 162,
      canNang: 55,
      nhomMau: "A",
      cccd: "079093054321",
      ngayCapCccd: "2022-01-18T00:00:00.000Z",
      noiCapCccd: "CA-DN",
      sdt: "0945678901",
      isDangVien: false,
      bhxh: "7901234567894",
      bhyt: "GD4012345678905",
      sucKhoe: "Tốt",
    },
  ],

  // nh_vi_pham_ky_luat — Vi phạm kỷ luật sinh viên
  // PK: id (Int @id @default(autoincrement())) — source cung cấp id
  nh_vi_pham_ky_luat: [
    {
      id: 1,
      maNguoiHoc: "2011100001",
      cccdSo: "079001012345",
      loaiViPham: "hoc_tap",
      hinhThucXuLy: "Khiển trách",
      noiDungLyDo: "Gian lận trong kiểm tra giữa kỳ môn Giải tích",
      loaiKyLuat: "KK",
      soQd: "QD-2024-0015",
      ngayQd: "2024-04-10T00:00:00.000Z",
      namHocHocKy: 20241,
      nhDaoTaoId: null,
    },
    {
      id: 2,
      maNguoiHoc: "2011100002",
      cccdSo: "079001023456",
      loaiViPham: "dao_duc",
      hinhThucXuLy: "Cảnh cáo",
      noiDungLyDo: "Gây mất trật tự trong khuôn viên trường",
      loaiKyLuat: "CC",
      soQd: "QD-2024-0021",
      ngayQd: "2024-05-20T00:00:00.000Z",
      namHocHocKy: 20241,
      nhDaoTaoId: null,
    },
    {
      id: 3,
      maNguoiHoc: "2012200001",
      cccdSo: "079002034567",
      loaiViPham: "hoc_tap",
      hinhThucXuLy: "Đình chỉ học tập 1 học kỳ",
      noiDungLyDo: "Sử dụng tài liệu không được phép trong thi cuối kỳ",
      loaiKyLuat: "DH",
      soQd: "QD-2023-0098",
      ngayQd: "2023-12-15T00:00:00.000Z",
      namHocHocKy: 20231,
      nhDaoTaoId: null,
    },
    {
      id: 4,
      maNguoiHoc: "2013300001",
      cccdSo: "079003045678",
      loaiViPham: "tai_chinh",
      hinhThucXuLy: "Khiển trách",
      noiDungLyDo: "Không đóng học phí đúng hạn nhiều lần",
      loaiKyLuat: "KK",
      soQd: "QD-2024-0033",
      ngayQd: "2024-03-01T00:00:00.000Z",
      namHocHocKy: 20232,
      nhDaoTaoId: null,
    },
  ],

  // nh_dao_tao — Thông tin đào tạo sinh viên
  // PK: id (Int @id @default(autoincrement())) — source cung cấp id
  nh_dao_tao: [
    {
      id: 1,
      cccdSo: "079001012345",
      maNguoiHoc: "2011100001",
      trinhDoDaoTao: "DH",
      emailTruong: "sv01@hcmut.edu.vn",
      maTuyenSinh: "TS2020",
      tsMaNganh: "480103",
      doiTuongUuTien: "KV1",
      khuVucTuyenSinh: "KV2",
      truongThpt: "THPT Nguyễn Du",
      trungTuyenSoQd: "QD-TS-2020-001",
      trungTuyenNgayQd: "2020-08-15T00:00:00.000Z",
      diemMon1: "9.0",
      diemMon2: "8.5",
      diemMon3: "8.75",
      diemUuTien: "1.5",
      tongDiemXetTuyen: "27.75",
      dtMaCtdt: "KTPM",
      dtMaNganh: "7480103",
      loaiHinhDaoTao: "CQ",
      heDaoTao: "DH",
      buoiDaoTao: "S",
      thangVao: 9,
      namVao: 2020,
      namRa: 2024,
      maLop: "CC20KTPM01",
      khoa: "K2020",
      donViQuanLy: "Khoa KHMT",
      coSoDaoTao: "CS1",
      hkGiaHan: 0,
      ngayNhapHoc: "2020-09-07T00:00:00.000Z",
      trangThaiNguoiHoc: "dang_hoc",
      ngayChuyenTrangThai: "2020-09-07T00:00:00.000Z",
      nguoiHocId: null,
    },
    {
      id: 2,
      cccdSo: "079001023456",
      maNguoiHoc: "2011100002",
      trinhDoDaoTao: "DH",
      emailTruong: "sv02@hcmut.edu.vn",
      maTuyenSinh: "TS2020",
      tsMaNganh: "480101",
      doiTuongUuTien: "KV1",
      khuVucTuyenSinh: "KV1",
      truongThpt: "THPT Lê Hồng Phong",
      trungTuyenSoQd: "QD-TS-2020-002",
      trungTuyenNgayQd: "2020-08-15T00:00:00.000Z",
      diemMon1: "9.5",
      diemMon2: "9.0",
      diemMon3: "9.25",
      diemUuTien: "0.0",
      tongDiemXetTuyen: "27.75",
      dtMaCtdt: "KHMT",
      dtMaNganh: "7480101",
      loaiHinhDaoTao: "CQ",
      heDaoTao: "DH",
      buoiDaoTao: "S",
      thangVao: 9,
      namVao: 2020,
      namRa: 2024,
      maLop: "CC20KHMT01",
      khoa: "K2020",
      donViQuanLy: "Khoa KHMT",
      coSoDaoTao: "CS1",
      hkGiaHan: 0,
      ngayNhapHoc: "2020-09-07T00:00:00.000Z",
      trangThaiNguoiHoc: "tot_nghiep",
      ngayChuyenTrangThai: "2024-09-15T00:00:00.000Z",
      nguoiHocId: null,
    },
    {
      id: 3,
      cccdSo: "079002034567",
      maNguoiHoc: "2012200001",
      trinhDoDaoTao: "DH",
      emailTruong: "sv03@hcmut.edu.vn",
      maTuyenSinh: "TS2021",
      tsMaNganh: "520207",
      doiTuongUuTien: "KV2",
      khuVucTuyenSinh: "KV2",
      truongThpt: "THPT Trần Phú",
      trungTuyenSoQd: "QD-TS-2021-015",
      trungTuyenNgayQd: "2021-08-20T00:00:00.000Z",
      diemMon1: "8.0",
      diemMon2: "7.5",
      diemMon3: "8.25",
      diemUuTien: "0.5",
      tongDiemXetTuyen: "24.25",
      dtMaCtdt: "KTDT",
      dtMaNganh: "7520207",
      loaiHinhDaoTao: "CQ",
      heDaoTao: "DH",
      buoiDaoTao: "S",
      thangVao: 9,
      namVao: 2021,
      namRa: 2025,
      maLop: "CC21KTDT01",
      khoa: "K2021",
      donViQuanLy: "Khoa Điện-Điện tử",
      coSoDaoTao: "CS2",
      hkGiaHan: 1,
      ngayNhapHoc: "2021-09-06T00:00:00.000Z",
      trangThaiNguoiHoc: "dinh_chi",
      ngayChuyenTrangThai: "2023-12-20T00:00:00.000Z",
      nguoiHocId: null,
    },
    {
      id: 4,
      cccdSo: "079003045678",
      maNguoiHoc: "2013300001",
      trinhDoDaoTao: "DH",
      emailTruong: "sv04@hcmut.edu.vn",
      maTuyenSinh: "TS2022",
      tsMaNganh: "340101",
      doiTuongUuTien: "KV2H",
      khuVucTuyenSinh: "KV3",
      truongThpt: "THPT Gia Định",
      trungTuyenSoQd: "QD-TS-2022-042",
      trungTuyenNgayQd: "2022-08-18T00:00:00.000Z",
      diemMon1: "8.5",
      diemMon2: "8.0",
      diemMon3: "7.75",
      diemUuTien: "1.0",
      tongDiemXetTuyen: "25.25",
      dtMaCtdt: "QTKD",
      dtMaNganh: "7340101",
      loaiHinhDaoTao: "CQ",
      heDaoTao: "DH",
      buoiDaoTao: "C",
      thangVao: 9,
      namVao: 2022,
      namRa: 2026,
      maLop: "CC22QTKD01",
      khoa: "K2022",
      donViQuanLy: "Khoa QLCN",
      coSoDaoTao: "CS1",
      hkGiaHan: 0,
      ngayNhapHoc: "2022-09-05T00:00:00.000Z",
      trangThaiNguoiHoc: "dang_hoc",
      ngayChuyenTrangThai: "2022-09-05T00:00:00.000Z",
      nguoiHocId: null,
    },
    {
      id: 5,
      cccdSo: "079004056789",
      maNguoiHoc: "2014400001",
      trinhDoDaoTao: "ThS",
      emailTruong: "sv05@hcmut.edu.vn",
      maTuyenSinh: "TS2023-SĐH",
      tsMaNganh: "480103",
      doiTuongUuTien: "KV1",
      khuVucTuyenSinh: "KV1",
      truongThpt: null,
      trungTuyenSoQd: "QD-SĐH-2023-008",
      trungTuyenNgayQd: "2023-09-01T00:00:00.000Z",
      diemMon1: null,
      diemMon2: null,
      diemMon3: null,
      diemUuTien: null,
      tongDiemXetTuyen: null,
      dtMaCtdt: "KTPM-ThS",
      dtMaNganh: "7480103",
      loaiHinhDaoTao: "CQ",
      heDaoTao: "ThS",
      buoiDaoTao: "S",
      thangVao: 9,
      namVao: 2023,
      namRa: 2025,
      maLop: "CC23KTPM-MS01",
      khoa: "K2023-SĐH",
      donViQuanLy: "Khoa KHMT",
      coSoDaoTao: "CS1",
      hkGiaHan: 0,
      ngayNhapHoc: "2023-09-11T00:00:00.000Z",
      trangThaiNguoiHoc: "dang_hoc",
      ngayChuyenTrangThai: "2023-09-11T00:00:00.000Z",
      nguoiHocId: null,
    },
  ],

  // KHÔNG gửi "id" — tcns_can_bo dùng id @default(autoincrement())
  // PK để upsert là "shcc" (@unique) → config SchemaRegistry primaryKey=["shcc"]
  tcns_can_bo: [
    {
      shcc: "SH111",
      ho: "Nguyễn Văn",
      ten: "An",
      ngaySinh: "1985-05-15T00:00:00.000Z",
      gioiTinh: "M",
      maNhanVien: "CB001",
      email: "nvan@hcmut.edu.vn",
      sdt: "0901234567",
    },
    {
      shcc: "SH112",
      ho: "Trần Thị",
      ten: "Bình",
      ngaySinh: "1990-08-20T00:00:00.000Z",
      gioiTinh: "F",
      maNhanVien: "CB002",
      email: "ttbinh@hcmut.edu.vn",
      sdt: "0912345678",
    },
    {
      shcc: "SH113",
      ho: "Lê Hoàng",
      ten: "Cường",
      ngaySinh: "1978-12-01T00:00:00.000Z",
      gioiTinh: "M",
      maNhanVien: "CB003",
      email: "lhcuong@hcmut.edu.vn",
      sdt: "0923456789",
    },
  ],
};

const schemaDefinitions = {
  dm_gioi_tinh: {
    tableName: "dm_gioi_tinh",
    primaryKeys: ["id"],
    items: [
      { field: "id", type: "int", required: true },
      { field: "ma", type: "varchar", required: true, length: 5 },
      { field: "ten", type: "varchar", required: true, length: 20 },
      { field: "active", type: "bit", required: false },
    ],
  },
  dm_chuc_danh_khoa_hoc: {
    tableName: "dm_chuc_danh_khoa_hoc",
    primaryKeys: ["ma"],
    items: [
      { field: "ma", type: "varchar", required: true, length: 5 },
      { field: "ten", type: "varchar", required: true, length: 50 },
      { field: "active", type: "bit", required: false },
    ],
  },
  dm_dt_chung_chi_ngoai_ngu: {
    tableName: "dm_dt_chung_chi_ngoai_ngu",
    primaryKeys: ["ma"],
    items: [
      { field: "ma", type: "varchar", required: true, length: 20 },
      { field: "ten", type: "varchar", required: true, length: 100 },
      { field: "ngoaiNgu", type: "varchar", required: true, length: 5 },
      { field: "active", type: "bit", required: false },
    ],
  },
  dm_dt_doi_tuong_anqp: {
    tableName: "dm_dt_doi_tuong_anqp",
    primaryKeys: ["ma"],
    items: [
      { field: "ma", type: "varchar", required: true, length: 5 },
      { field: "ten", type: "varchar", required: true, length: 200 },
      { field: "active", type: "bit", required: false },
    ],
  },
  dm_nhom_luong: {
    tableName: "dm_nhom_luong",
    primaryKeys: ["nhomLuong"],
    items: [
      { field: "nhomLuong", type: "varchar", required: true, length: 10 },
      { field: "maBacLuong", type: "int", required: true },
      { field: "tenBacLuong", type: "varchar", required: true, length: 10 },
      {
        field: "heSoLuong",
        type: "decimal",
        required: true,
        precision: 10,
        scale: 2,
      },
    ],
  },
  dm_trinh_do_pho_thong: {
    tableName: "dm_trinh_do_pho_thong",
    primaryKeys: ["ma"],
    items: [
      { field: "ma", type: "varchar", required: true, length: 5 },
      { field: "ten", type: "varchar", required: true, length: 50 },
      { field: "active", type: "bit", required: false },
    ],
  },
  dm_vi_tri_viec_lam: {
    tableName: "dm_vi_tri_viec_lam",
    primaryKeys: ["ma"],
    items: [
      { field: "ma", type: "varchar", required: true, length: 20 },
      { field: "ten", type: "varchar", required: true, length: 100 },
      { field: "loaiVtvl", type: "varchar", required: false, length: 20 },
      { field: "active", type: "bit", required: false },
    ],
  },
  dm_doi_tuong_chinh_sach: {
    tableName: "dm_doi_tuong_chinh_sach",
    primaryKeys: ["ma"],
    items: [
      { field: "ma", type: "varchar", required: true, length: 5 },
      { field: "ten", type: "varchar", required: true, length: 100 },
      { field: "active", type: "bit", required: false },
    ],
  },
  dm_dt_chung_chi_tin_hoc: {
    tableName: "dm_dt_chung_chi_tin_hoc",
    primaryKeys: ["ma"],
    items: [
      { field: "ma", type: "varchar", required: true, length: 5 },
      { field: "ten", type: "varchar", required: true, length: 50 },
      { field: "active", type: "bit", required: false },
    ],
  },
  dm_dt_hinh_thuc_cm: {
    tableName: "dm_dt_hinh_thuc_cm",
    primaryKeys: ["ma"],
    items: [
      { field: "ma", type: "varchar", required: true, length: 5 },
      { field: "ten", type: "varchar", required: true, length: 50 },
      { field: "active", type: "bit", required: false },
    ],
  },
  dm_dt_van_bang_llct: {
    tableName: "dm_dt_van_bang_llct",
    primaryKeys: ["ma"],
    items: [
      { field: "ma", type: "varchar", required: true, length: 5 },
      { field: "ten", type: "varchar", required: true, length: 100 },
      { field: "active", type: "bit", required: false },
    ],
  },
  dm_ngach_cdnn: {
    tableName: "dm_ngach_cdnn",
    primaryKeys: ["ma"],
    items: [
      { field: "ma", type: "varchar", required: true, length: 20 },
      { field: "ten", type: "varchar", required: true, length: 100 },
      { field: "active", type: "bit", required: false },
    ],
  },
  dm_noi_cap_cccd: {
    tableName: "dm_noi_cap_cccd",
    primaryKeys: ["ma"],
    items: [
      { field: "ma", type: "varchar", required: true, length: 10 },
      { field: "ten", type: "varchar", required: true, length: 100 },
      { field: "active", type: "bit", required: false },
    ],
  },
  dm_xep_loai_chuyen_mon: {
    tableName: "dm_xep_loai_chuyen_mon",
    primaryKeys: ["ma"],
    items: [
      { field: "ma", type: "varchar", required: true, length: 50 },
      { field: "ten", type: "varchar", required: true, length: 500 },
      { field: "active", type: "bit", required: false },
    ],
  },
  dm_dt_ngoai_ngu: {
    tableName: "dm_dt_ngoai_ngu",
    primaryKeys: ["ma"],
    items: [
      { field: "ma", type: "varchar", required: true, length: 5 },
      { field: "ten", type: "varchar", required: true, length: 50 },
      { field: "active", type: "bit", required: false },
    ],
  },
  dm_loai_chuc_vu: {
    tableName: "dm_loai_chuc_vu",
    primaryKeys: ["ma"],
    items: [
      { field: "ma", type: "varchar", required: true, length: 5 },
      { field: "ten", type: "varchar", required: true, length: 70 },
      { field: "active", type: "bit", required: false },
    ],
  },
  dm_loai_phu_cap: {
    tableName: "dm_loai_phu_cap",
    primaryKeys: ["ma"],
    items: [
      { field: "ma", type: "varchar", required: true, length: 10 },
      { field: "ten", type: "varchar", required: true, length: 100 },
      { field: "active", type: "bit", required: false },
    ],
  },
  dm_ngan_hang: {
    tableName: "dm_ngan_hang",
    primaryKeys: ["ma"],
    items: [
      { field: "ma", type: "varchar", required: true, length: 20 },
      { field: "ten", type: "varchar", required: true, length: 200 },
      { field: "active", type: "bit", required: false },
      { field: "diachi", type: "varchar", required: false, length: 200 },
    ],
  },
  dm_chuyen_nganh_bgd: {
    tableName: "dm_chuyen_nganh_bgd",
    primaryKeys: ["ma"],
    items: [
      { field: "ma", type: "varchar", required: true, length: 20 },
      { field: "ten", type: "varchar", required: true, length: 200 },
      { field: "active", type: "bit", required: false },
    ],
  },
  dm_danh_hieu_nha_nuoc: {
    tableName: "dm_danh_hieu_nha_nuoc",
    primaryKeys: ["ma"],
    items: [
      { field: "ma", type: "varchar", required: true, length: 5 },
      { field: "ten", type: "varchar", required: true, length: 200 },
      { field: "active", type: "bit", required: false },
    ],
  },
  dm_dt_chung_chi_bdnv: {
    tableName: "dm_dt_chung_chi_bdnv",
    primaryKeys: ["ma"],
    items: [
      { field: "ma", type: "varchar", required: true, length: 5 },
      { field: "ten", type: "varchar", required: true, length: 100 },
      { field: "active", type: "bit", required: false },
    ],
  },
  dm_dt_hinh_thuc_llct: {
    tableName: "dm_dt_hinh_thuc_llct",
    primaryKeys: ["ma"],
    items: [
      { field: "ma", type: "varchar", required: true, length: 5 },
      { field: "ten", type: "varchar", required: true, length: 50 },
      { field: "active", type: "bit", required: false },
    ],
  },
  dm_gioi_tinh_2: {
    tableName: "dm_gioi_tinh_2",
    primaryKeys: ["ma"],
    items: [
      { field: "ma", type: "varchar", required: true, length: 5 },
      { field: "ten", type: "varchar", required: true, length: 20 },
      { field: "active", type: "bit", required: false },
    ],
  },
  nh_van_bang: {
    tableName: "nh_van_bang",
    primaryKeys: ["id"],
    items: [
      { field: "id", type: "int", required: true },
      { field: "maNguoiHoc", type: "varchar", required: true, length: 20 },
      { field: "cccdSo", type: "varchar", required: true, length: 20 },
      { field: "maCtdt", type: "varchar", required: true, length: 50 },
      { field: "maNganh", type: "varchar", required: true, length: 50 },
      { field: "tnSoQd", type: "varchar", required: true, length: 50 },
      { field: "tnNgayQd", type: "datetime", required: true },
      { field: "tnXepLoai", type: "varchar", required: true, length: 50 },
      { field: "vbNgayCap", type: "datetime", required: true },
      { field: "vbSoHieu", type: "varchar", required: true, length: 50 },
      { field: "vbSoVaoSoGoc", type: "varchar", required: true, length: 50 },
      { field: "nhDaoTaoId", type: "int", required: false },
    ],
  },
  tcns_can_bo: {
    tableName: "tcns_can_bo",
    primaryKeys: ["shcc"],
    items: [
      { field: "shcc", type: "varchar", required: true, length: 20 },
      { field: "ho", type: "nvarchar", required: true, length: 100 },
      { field: "ten", type: "nvarchar", required: true, length: 100 },
      { field: "ngaySinh", type: "datetime", required: true },
      { field: "gioiTinh", type: "varchar", required: true, length: 5 },
      { field: "maNhanVien", type: "varchar", required: true, length: 20 },
      { field: "email", type: "varchar", required: true, length: 200 },
      { field: "sdt", type: "varchar", required: false, length: 20 },
    ],
  },
  nguoi_hoc: {
    tableName: "nguoi_hoc",
    primaryKeys: ["id"],
    items: [
      { field: "id", type: "int", required: true },
      { field: "ho", type: "nvarchar", required: true, length: 255 },
      { field: "ten", type: "nvarchar", required: true, length: 255 },
      { field: "hinhThePath", type: "nvarchar", required: false, length: 1000 },
      { field: "ngaySinh", type: "datetime", required: false },
      { field: "soDienThoai", type: "varchar", required: false, length: 50 },
      { field: "gioiTinh", type: "varchar", required: false, length: 5 },
      { field: "quocTich", type: "varchar", required: false, length: 50 },
      { field: "tonGiao", type: "varchar", required: false, length: 50 },
      { field: "danToc", type: "varchar", required: false, length: 50 },
    ],
  },
  tcns_ly_lich: {
    tableName: "tcns_ly_lich",
    primaryKeys: ["shcc"],
    items: [
      { field: "shcc", type: "varchar", required: true, length: 255 },
      { field: "maNhanVien", type: "varchar", required: false, length: 20 },
      { field: "ho", type: "nvarchar", required: false, length: 150 },
      { field: "ten", type: "nvarchar", required: false, length: 50 },
      { field: "ngaySinh", type: "datetime", required: false },
      { field: "gioiTinh", type: "varchar", required: false, length: 5 },
      { field: "danToc", type: "varchar", required: false, length: 5 },
      { field: "tonGiao", type: "varchar", required: false, length: 5 },
      { field: "quocTich", type: "varchar", required: false, length: 5 },
      { field: "emailCaNhan", type: "varchar", required: false, length: 70 },
      { field: "email", type: "varchar", required: false, length: 70 },
      { field: "sdt", type: "varchar", required: false, length: 20 },
      { field: "cccd", type: "varchar", required: false, length: 20 },
      { field: "ngayCapCccd", type: "datetime", required: false },
      { field: "noiCapCccd", type: "varchar", required: false, length: 5 },
      { field: "chieuCao", type: "int", required: false },
      { field: "canNang", type: "int", required: false },
      { field: "nhomMau", type: "varchar", required: false, length: 5 },
      { field: "isDangVien", type: "bit", required: false },
      { field: "ngayVaoDang", type: "datetime", required: false },
      { field: "maSoThue", type: "varchar", required: false, length: 20 },
      { field: "stk", type: "varchar", required: false, length: 20 },
      { field: "nganHang", type: "varchar", required: false, length: 100 },
      { field: "bhxh", type: "varchar", required: false, length: 20 },
      { field: "bhyt", type: "varchar", required: false, length: 20 },
      { field: "sucKhoe", type: "varchar", required: false, length: 500 },
    ],
  },
  nh_vi_pham_ky_luat: {
    tableName: "nh_vi_pham_ky_luat",
    primaryKeys: ["id"],
    items: [
      { field: "id", type: "int", required: true },
      { field: "maNguoiHoc", type: "varchar", required: false, length: 20 },
      { field: "cccdSo", type: "varchar", required: false, length: 20 },
      { field: "loaiViPham", type: "varchar", required: false, length: 50 },
      { field: "hinhThucXuLy", type: "varchar", required: false, length: 255 },
      { field: "noiDungLyDo", type: "varchar", required: false, length: 500 },
      { field: "loaiKyLuat", type: "varchar", required: false, length: 50 },
      { field: "soQd", type: "varchar", required: false, length: 50 },
      { field: "ngayQd", type: "datetime", required: false },
      { field: "namHocHocKy", type: "smallint", required: false },
      { field: "nhDaoTaoId", type: "int", required: false },
    ],
  },
  nh_dao_tao: {
    tableName: "nh_dao_tao",
    primaryKeys: ["id"],
    items: [
      { field: "id", type: "int", required: true },
      { field: "cccdSo", type: "varchar", required: false, length: 20 },
      { field: "maNguoiHoc", type: "varchar", required: false, length: 20 },
      { field: "trinhDoDaoTao", type: "varchar", required: false, length: 50 },
      { field: "emailTruong", type: "varchar", required: false, length: 50 },
      { field: "maTuyenSinh", type: "varchar", required: false, length: 50 },
      { field: "tsMaNganh", type: "varchar", required: false, length: 20 },
      { field: "doiTuongUuTien", type: "varchar", required: false, length: 50 },
      {
        field: "khuVucTuyenSinh",
        type: "varchar",
        required: false,
        length: 50,
      },
      { field: "truongThpt", type: "varchar", required: false, length: 50 },
      { field: "trungTuyenSoQd", type: "varchar", required: false, length: 50 },
      { field: "trungTuyenNgayQd", type: "datetime", required: false },
      { field: "diemMon1", type: "varchar", required: false, length: 10 },
      { field: "diemMon2", type: "varchar", required: false, length: 10 },
      { field: "diemMon3", type: "varchar", required: false, length: 10 },
      { field: "diemUuTien", type: "varchar", required: false, length: 10 },
      {
        field: "tongDiemXetTuyen",
        type: "varchar",
        required: false,
        length: 10,
      },
      { field: "dtMaCtdt", type: "varchar", required: false, length: 50 },
      { field: "dtMaNganh", type: "varchar", required: false, length: 50 },
      { field: "loaiHinhDaoTao", type: "varchar", required: false, length: 50 },
      { field: "heDaoTao", type: "varchar", required: false, length: 50 },
      { field: "buoiDaoTao", type: "varchar", required: false, length: 50 },
      { field: "thangVao", type: "smallint", required: false },
      { field: "namVao", type: "smallint", required: false },
      { field: "namRa", type: "smallint", required: false },
      { field: "maLop", type: "varchar", required: false, length: 50 },
      { field: "khoa", type: "varchar", required: false, length: 50 },
      { field: "donViQuanLy", type: "varchar", required: false, length: 50 },
      { field: "coSoDaoTao", type: "varchar", required: false, length: 50 },
      { field: "hkGiaHan", type: "smallint", required: false },
      { field: "ngayNhapHoc", type: "datetime", required: false },
      {
        field: "trangThaiNguoiHoc",
        type: "varchar",
        required: false,
        length: 50,
      },
      { field: "ngayChuyenTrangThai", type: "datetime", required: false },
      { field: "nguoiHocId", type: "int", required: false },
    ],
  },
};

app.get("/:tableName/schema", (req, res) => {
  const { tableName } = req.params;
  const schema = schemaDefinitions[tableName];

  if (!schema) {
    return res.status(404).json({
      success: false,
      message: `Schema cho bảng "${tableName}" không tồn tại trên mock server.`,
    });
  }

  console.log(`[SCHEMA] GET /${tableName}/schema`);
  res.json(schema);
});

app.get("/:tableName", (req, res) => {
  const { tableName } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;

  const tableData = happyPathDatasets[tableName];
  if (!tableData) {
    return res.status(404).json({
      success: false,
      message: `Bảng "${tableName}" không tồn tại trên mock server.`,
    });
  }

  console.log(
    `[TC-01 HAPPY PATH] GET /${tableName}?page=${page}&limit=${limit}`,
  );
  setTimeout(
    () => res.json(buildResponse(tableName, tableData, page, limit)),
    100,
  );
});

// -----------------------------------------------------------------------
// KHỞI ĐỘNG SERVER
// -----------------------------------------------------------------------
app.listen(PORT, () => {
  console.log("=========================================================");
  console.log("  Mock Source Server — Collision Defense Test Suite");
  console.log(`  Chạy tại  : http://localhost:${PORT}`);
  console.log(`  Index     : http://localhost:${PORT}/`);
  console.log("=========================================================");
  console.log("  Sẵn sàng nhận request từ NestJS Integration Hub.");
  console.log("=========================================================");
});
