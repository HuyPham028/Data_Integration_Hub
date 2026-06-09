import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SchemaRegistry } from '../schema-registry/schemas/schema-registry.schema';

// ─── Tables managed by hand (have relations / custom id types) ──────────────
const STATIC_TABLE_NAMES = new Set([
  'nguoi_hoc',
  'nh_dao_tao',
  'nh_van_bang',
  'nh_vi_pham_ky_luat',
  'nh_hoat_dong_ngoai_khoa',
  'nh_sinh_hoat_cong_dan',
]);

// ─── MongoDB type → Prisma type hint ────────────────────────────────────────
const TYPE_MAP: Record<string, string> = {
  varchar: 'String',
  nvarchar: 'String',
  char: 'String',
  nchar: 'String',
  string: 'String',   // generic fallback from older schema entries
  text: 'String',
  ntext: 'String',
  int: 'Int',
  integer: 'Int',
  bigint: 'BigInt',
  smallint: 'Int',
  tinyint: 'Int',
  bit: 'Boolean',
  boolean: 'Boolean',
  bool: 'Boolean',
  float: 'Float',
  real: 'Float',
  double: 'Float',
  decimal: 'Decimal',
  numeric: 'Decimal',
  money: 'Decimal',
  smallmoney: 'Decimal',
  number: 'Decimal',
  datetime: 'DateTime',
  datetime2: 'DateTime',
  date: 'DateTime',
  time: 'DateTime',
  timestamp: 'DateTime',
  uniqueidentifier: 'String',
  uuid: 'String',
  json: 'Json',
  jsonb: 'Json',
};

// ─── File header (generator + datasource) ────────────────────────────────────
const SCHEMA_HEADER = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}
`;

// ─── Static relational models (NguoiHoc group) ───────────────────────────────
const STATIC_RELATIONAL_MODELS = `
/// Bảng Người học (Sinh viên)
model NguoiHoc {
  id                   Int        @id
  cccdSo               String?    @db.VarChar(20)
  cccdNgayCap          DateTime?
  cccdNoiCap           String?    @db.VarChar(255)
  ho                   String?    @db.VarChar(255)
  ten                  String?    @db.VarChar(255)
  ngaySinh             DateTime?
  noiSinhPhuongXa      String?    @db.VarChar(50)
  emailCaNhan          String?    @db.VarChar(255)
  soDienThoai          String?    @db.VarChar(50)
  gioiTinh             String?    @db.VarChar(5)
  quocTich             String?    @db.VarChar(50)
  tonGiao              String?    @db.VarChar(50)
  danToc               String?    @db.VarChar(50)
  chaHoTen             String?    @db.VarChar(255)
  chaNamSinh           Int?       @db.SmallInt
  chaNgheNghiep        String?    @db.VarChar(255)
  chaNoiCongTac        String?    @db.VarChar(50)
  chaDienThoai         String?    @db.VarChar(50)
  meHoTen              String?    @db.VarChar(255)
  meNamSinh            Int?       @db.SmallInt
  meNgheNghiep         String?    @db.VarChar(255)
  meNoiCongTac         String?    @db.VarChar(50)
  meDienThoai          String?    @db.VarChar(50)
  nguoiLienHeHoTen     String?    @db.VarChar(255)
  nguoiLienHePhuongXa  String?    @db.VarChar(50)
  nguoiLienHeSoNha     String?    @db.VarChar(255)
  nguoiLienHeDienThoai String?    @db.VarChar(50)
  lienLacSoNhaDuong    String?    @db.VarChar(255)
  lienLacPhuongXa      String?    @db.VarChar(50)
  thuongTruSoNhaDuong  String?    @db.VarChar(255)
  thuongTruPhuongXa    String?    @db.VarChar(50)
  thuongTruQuocGia     String?    @db.VarChar(50)
  doanNgayVao          DateTime?
  dangNgayVao          DateTime?
  bhytSoThe            String?    @db.VarChar(255)
  bhtnSoThe            String?    @db.VarChar(255)
  hinhThePath          String?    @db.VarChar(500)
  createdAt            DateTime   @default(now())
  updatedAt            DateTime   @updatedAt
  nhDaoTaos            NhDaoTao[]

  @@map("nguoi_hoc")
}

/// Bảng Người học - Đào tạo
model NhDaoTao {
  id                  Int              @id @default(autoincrement())
  cccdSo              String?          @db.VarChar(20)
  maNguoiHoc          String?          @db.VarChar(20)
  trinhDoDaoTao       String?          @db.VarChar(50)
  emailTruong         String?          @db.VarChar(50)
  maTuyenSinh         String?          @db.VarChar(50)
  tsMaNganh           String?          @db.VarChar(20)
  doiTuongUuTien      String?          @db.VarChar(50)
  khuVucTuyenSinh     String?          @db.VarChar(50)
  truongThpt          String?          @db.VarChar(50)
  trungTuyenSoQd      String?          @db.VarChar(50)
  trungTuyenNgayQd    DateTime?
  trungTuyenToHopMon  String?          @db.VarChar(50)
  diemMon1            String?          @db.VarChar(10)
  diemMon2            String?          @db.VarChar(10)
  diemMon3            String?          @db.VarChar(10)
  diemUuTien          String?          @db.VarChar(10)
  tongDiemXetTuyen    String?          @db.VarChar(10)
  dtMaCtdt            String?          @db.VarChar(50)
  dtMaNganh           String?          @db.VarChar(50)
  loaiHinhDaoTao      String?          @db.VarChar(50)
  heDaoTao            String?          @db.VarChar(50)
  buoiDaoTao          String?          @db.VarChar(50)
  thangVao            Int?             @db.SmallInt
  namVao              Int?             @db.SmallInt
  namRa               Int?             @db.SmallInt
  maLop               String?          @db.VarChar(50)
  khoa                String?          @db.VarChar(50)
  donViQuanLy         String?          @db.VarChar(50)
  coSoDaoTao          String?          @db.VarChar(50)
  hkGiaHan            Int?             @db.SmallInt
  ngayNhapHoc         DateTime?
  trangThaiNguoiHoc   String?          @db.VarChar(50)
  ngayChuyenTrangThai DateTime?
  qlctdtCtdt          String?          @db.VarChar(255)
  nguoiHocId          Int?
  createdAt           DateTime         @default(now())
  updatedAt           DateTime         @updatedAt
  nguoiHoc            NguoiHoc?        @relation(fields: [nguoiHocId], references: [id])
  nhVanBangs          NhVanBang[]
  nhViPhamKyLuats     NhViPhamKyLuat[]

  @@index([maNguoiHoc])
  @@map("nh_dao_tao")
}

/// Bảng Người học - Văn bằng
model NhVanBang {
  id           Int       @id @default(autoincrement())
  maNguoiHoc   String?   @db.VarChar(20)
  cccdSo       String?   @db.VarChar(20)
  maCtdt       String?   @db.VarChar(50)
  maNganh      String?   @db.VarChar(50)
  tnSoQd       String?   @db.VarChar(50)
  tnNgayQd     DateTime?
  tnXepLoai    String?   @db.VarChar(50)
  vbNgayCap    DateTime?
  vbSoHieu     String?   @db.VarChar(50)
  vbSoVaoSoGoc String?   @db.VarChar(50)
  nhDaoTaoId   Int?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  nhDaoTao     NhDaoTao? @relation(fields: [nhDaoTaoId], references: [id])

  @@map("nh_van_bang")
}

/// Bảng Người học - Vi phạm kỷ luật
model NhViPhamKyLuat {
  id           Int       @id @default(autoincrement())
  maNguoiHoc   String?   @db.VarChar(20)
  cccdSo       String?   @db.VarChar(20)
  loaiViPham   String?   @db.VarChar(50)
  hinhThucXuLy String?   @db.VarChar(255)
  noiDungLyDo  String?   @db.VarChar(500)
  loaiKyLuat   String?   @db.VarChar(50)
  soQd         String?   @db.VarChar(50)
  ngayQd       DateTime?
  namHocHocKy  Int?      @db.SmallInt
  nhDaoTaoId   Int?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  nhDaoTao     NhDaoTao? @relation(fields: [nhDaoTaoId], references: [id])

  @@map("nh_vi_pham_ky_luat")
}

/// Bảng hoạt động ngoại khoa sinh viên
model NhHoatDongNgoaiKhoa {
  id           String    @id @db.VarChar(36)
  maNguoiHoc   String?   @db.VarChar(10)
  namHocHocKy  Int?
  tenHoatDong  String?   @db.VarChar(20)
  noiDung      String?   @db.VarChar(255)
  ngayBd       DateTime?
  ngayKt       DateTime?
  ngayThamGia  Float?
  soNgay       Float?
  diaDiem      String?   @db.VarChar(100)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@index([maNguoiHoc])
  @@map("nh_hoat_dong_ngoai_khoa")
}

/// Bảng sinh hoạt công dân sinh viên
model NhSinhHoatCongDan {
  id           String    @id @db.VarChar(36)
  maNguoiHoc   String?   @db.VarChar(10)
  dotSinhHoat  String?   @db.VarChar(100)
  chuyenDe     String?   @db.VarChar(255)
  ngayBd       DateTime?
  ngayKt       DateTime?
  kqThamGia    String?   @db.VarChar(50)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@index([maNguoiHoc])
  @@map("nh_sinh_hoat_cong_dan")
}
`;

// ─── System models (auth, backup, views, api logs) ───────────────────────────
const STATIC_SYSTEM_MODELS = `
model BackupRetentionPolicy {
  trigger   String   @id
  days      Int?
  updatedAt DateTime @updatedAt

  @@map("backup_retention_policy")
}

enum UserRole {
  admin
  reader
  writer
  user
}

model User {
  id           Int       @id @default(autoincrement())
  username     String    @unique @db.VarChar(100)
  email        String    @unique @db.VarChar(150)
  passwordHash String    @map("password_hash")
  fullName     String?   @map("full_name") @db.VarChar(150)
  isActive     Boolean?  @default(true) @map("is_active")
  createdAt    DateTime? @default(now()) @map("created_at") @db.Timestamp(6)
  role         UserRole  @default(reader) @map("role")
  /// Cấu hình quyền truy cập bảng dạng YAML-like
  roleSettings Json?     @map("role_settings")
  /// WireGuard IP được gán cho user (vd: 10.8.0.2). Nếu set, chỉ IP này mới login được.
  vpnIp        String?   @map("vpn_ip") @db.VarChar(45)

  @@map("users")
}

model ViewDefinition {
  id          Int      @id @default(autoincrement())
  viewName    String   @unique @map("view_name") @db.VarChar(100)
  description String?  @db.VarChar(500)
  sqlQuery    String   @map("sql_query") @db.Text
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@map("view_definitions")
}

model ApiAccessLog {
  id             Int      @id @default(autoincrement())
  userId         Int?
  username       String?  @db.VarChar(100)
  tableName      String   @db.VarChar(100)
  method         String   @db.VarChar(10)
  statusCode     Int
  responseTimeMs Int?
  ipAddress      String?  @db.VarChar(45)
  createdAt      DateTime @default(now()) @map("created_at")

  @@index([tableName])
  @@index([userId])
  @@index([createdAt])
  @@map("api_access_logs")
}
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Map a MongoDB field type → Prisma @db.XYZ hint */
function getDbHint(
  rawType: string,
  length: number | null,
  precision?: number | null,
  scale?: number | null,
): string {
  const t = rawType.toLowerCase();
  if (t === 'smallint') return '@db.SmallInt';
  if (t === 'bigint') return '@db.BigInt';
  if ((t === 'decimal' || t === 'numeric') && precision != null && scale != null)
    return `@db.Decimal(${precision}, ${scale})`;
  if (t === 'float') return '@db.DoublePrecision';
  if (t === 'real') return '@db.Real';
  if (t === 'datetime' || t === 'datetime2') return '@db.Timestamp(6)';
  if (t === 'date') return '@db.Date';
  if (t === 'time') return '@db.Time(6)';
  if (t === 'json' || t === 'jsonb') return '';
  if (
    ['varchar', 'nvarchar', 'char', 'nchar', 'string'].includes(t) &&
    length != null &&
    length > 0
  )
    return `@db.VarChar(${length})`;
  if (['text', 'ntext'].includes(t)) return '@db.Text';
  return '';
}

/** snake_case field → camelCase Prisma field name */
function toCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

/** Known acronyms that should stay UPPERCASE in model names */
const ACRONYMS = new Set(['llct', 'cdnn', 'cccd', 'bgd', 'bdnv', 'cm']);

/** table_name → ModelName (PascalCase, preserving known acronyms) */
function toModelName(tableName: string): string {
  return tableName
    .split('_')
    .map((w) => ACRONYMS.has(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class PrismaSchemaGeneratorService {
  private readonly logger = new Logger(PrismaSchemaGeneratorService.name);

  constructor(
    @InjectModel(SchemaRegistry.name)
    private readonly registryModel: Model<SchemaRegistry>,
  ) {}

  /**
   * Generates the complete schema.prisma content from the MongoDB Schema Registry.
   * Dynamic models (status = "stable", not in STATIC_TABLE_NAMES) are generated
   * automatically; static models with relations are appended verbatim.
   */
  async generateFullSchema(): Promise<string> {
    const stableSchemas = await this.registryModel
      .find({ status: 'stable' })
      .lean()
      .exec();

    const dynamicParts: string[] = [];

    for (const schema of stableSchemas) {
      if (STATIC_TABLE_NAMES.has(schema.tableName)) {
        this.logger.verbose(
          `[SchemaGen] Skipping static table: ${schema.tableName}`,
        );
        continue;
      }
      try {
        dynamicParts.push(this.generateModel(schema));
      } catch (err: any) {
        this.logger.warn(
          `[SchemaGen] Could not generate model for ${schema.tableName}: ${err.message}`,
        );
      }
    }

    return [
      SCHEMA_HEADER,
      ...dynamicParts,
      STATIC_RELATIONAL_MODELS,
      STATIC_SYSTEM_MODELS,
    ].join('\n');
  }

  /** Render a single Prisma model block from a SchemaRegistry document. */
  private generateModel(schema: any): string {
    const modelName = toModelName(schema.tableName);
    const lines: string[] = [];
    const emittedFieldNames = new Set<string>(['id']);

    lines.push(`/// Auto-generated from Schema Registry`);
    lines.push(`model ${modelName} {`);

    // Always use surrogate autoincrement id, same pattern as manually-written models.
    // The source PK field (e.g. "ma") becomes @unique instead of @id so existing
    // PostgreSQL tables are not broken by a PK type change.
    lines.push(`  id        Int      @id @default(autoincrement())`);

    const pkFields = new Set<string>(
      Array.isArray(schema.primaryKey) ? schema.primaryKey : [],
    );

    for (const detail of schema.details ?? []) {
      const rawType: string = (detail.type ?? 'varchar').toLowerCase();
      const prismaType = TYPE_MAP[rawType] ?? 'String';
      const camel = toCamel(detail.name);

      if (emittedFieldNames.has(camel)) {
        this.logger.warn(
          `[SchemaGen] Skipping duplicate field "${detail.name}" in ${schema.tableName}`,
        );
        continue;
      }

      emittedFieldNames.add(camel);

      const dbHint = getDbHint(rawType, detail.length ?? null, detail.precision ?? null, detail.scale ?? null);
      const hintStr = dbHint ? ` ${dbHint}` : '';

      const isSourcePk = pkFields.has(detail.name);
      // Source PK → @unique NOT NULL; all others → nullable
      const uniqueAnnotation = isSourcePk ? ' @unique' : '';
      const nullMark = isSourcePk ? '' : '?';

      // active Boolean → preserve @default(true) to match hand-written models
      const defaultAnnotation =
        detail.name === 'active' && (rawType === 'bit' || rawType === 'boolean')
          ? ' @default(true)'
          : '';

      lines.push(
        `  ${camel.padEnd(20)} ${prismaType}${nullMark}${uniqueAnnotation}${defaultAnnotation}${hintStr}`,
      );
    }

    lines.push(`  createdAt DateTime  @default(now()) @db.Timestamp(6)`);
    lines.push(`  updatedAt DateTime  @updatedAt @db.Timestamp(6)`);
    lines.push(``);

    if (pkFields.size > 0) {
      const indexField = [...pkFields]
        .map((field) => toCamel(field))
        .find((field) => emittedFieldNames.has(field));

      if (indexField) {
        lines.push(`  @@index([${indexField}])`);
      }
    }
    lines.push(`  @@map("${schema.tableName}")`);
    lines.push(`}`);

    return lines.join('\n');
  }

  async generatePreviewSchema(targetTableName: string, newDetails: any[]): Promise<string> {
    const stableSchemas = await this.registryModel.find({ status: 'stable' }).lean().exec();
    const dynamicParts: string[] = [];

    // Simulate the schema as if the target table was approved
    let found = false;
    for (const schema of stableSchemas) {
      if (STATIC_TABLE_NAMES.has(schema.tableName)) continue;
      
      if (schema.tableName === targetTableName) {
        schema.details = newDetails;
        found = true;
      }
      dynamicParts.push(this.generateModel(schema));
    }

    // If it's a completely new table
    if (!found) {
      dynamicParts.push(this.generateModel({ tableName: targetTableName, details: newDetails, primaryKey: ['id'] }));
    }

    return [SCHEMA_HEADER, ...dynamicParts, STATIC_RELATIONAL_MODELS, STATIC_SYSTEM_MODELS].join('\n');
  }
}
