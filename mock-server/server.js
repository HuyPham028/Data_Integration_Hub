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

app.use(cors());
app.use(express.json());

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
// ✅ TC-01 — HAPPY PATH (Đặt CUỐI CÙNG để không chặn /test/* routes)
// Defense: Baseline — Toàn bộ pipeline chạy thành công
// -----------------------------------------------------------------------
const happyPathDatasets = {
  dm_gioi_tinh: [
    { id: 1, ma: "M", ten: "Nam", active: true },
    { id: 2, ma: "F", ten: "Nữ", active: true },
    { id: 3, ma: "O", ten: "Khác", active: false },
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
