# Migration Guide: Mongoose to Prisma ORM

## Overview

This project has been converted from MongoDB (Mongoose) to PostgreSQL (Prisma ORM).

## Key Changes

### 1. Database

- **Old**: MongoDB (NoSQL)
- **New**: PostgreSQL (SQL)

### 2. ORM

- **Old**: Mongoose
- **New**: Prisma ORM

### 3. Schema Location

- **Old**: `src/master-data/schemas/` (Mongoose decorators)
- **New**: `prisma/schema.prisma` (Prisma schema language)

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database

### Installation Steps

1. **Install Prisma dependencies**

   ```bash
   npm install @prisma/client
   npm install -D prisma
   npm uninstall mongoose @nestjs/mongoose
   ```

2. **Configure Database Connection**
   - Create `.env` file in the backend directory
   - Set `DATABASE_URL` to your PostgreSQL connection string

   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/integration_hub
   ```

3. **Run Prisma Migrations**

   ```bash
   npx prisma migrate dev --name initial
   ```

4. **Generate Prisma Client**

   ```bash
   npx prisma generate
   ```

5. **Start the Application**
   ```bash
   npm run start:dev
   ```

## File Structure

```
backend/
├── prisma/
│   └── schema.prisma          # Database schema definition
├── src/
│   ├── prisma/
│   │   ├── prisma.service.ts  # Prisma service wrapper
│   │   └── prisma.module.ts   # Prisma module
│   ├── master-data/
│   │   ├── dto/
│   │   │   └── master-data.dto.ts  # Data Transfer Objects
│   │   ├── master-data.service.ts
│   │   ├── master-data.controller.ts
│   │   └── master-data.module.ts
│   ├── ly-lich/
│   │   ├── dto/
│   │   │   └── ly-lich.dto.ts
│   │   ├── ly-lich.service.ts
│   │   ├── ly-lich.controller.ts
│   │   └── ly-lich.module.ts
│   └── app.module.ts
└── .env.example               # Environment variables template
```

## Database Models

### Master Data Tables

- `DmDtVanBangLLCT` - Văn bằng/Lý lịch công tác
- `DmHinhThucKyLuat` - Hình thức kỷ luật
- `DmLoaiCanBo` - Loại cán bộ
- `DmLoaiChucVu` - Loại chức vụ
- `DmLoaiPhuCap` - Loại phụ cấp
- `DmNgachCDNN` - Ngạch CDNN
- `DmNganHang` - Ngân hàng
- `DmNhomMau` - Nhóm máu
- `DmNoiCapCCCD` - Nơi cấp CCCD
- `DmQuanHam` - Quân hàm
- `DmQuanHeGiaDinh` - Quan hệ gia đình
- `DmQuocGia` - Quốc gia
- `DmThanhPhanXuatThan` - Thành phần xuất thân
- `DmTonGiao` - Tôn giáo
- `DmTrinhDoChuyenMon` - Trình độ chuyên môn
- `DmTrinhDoPhoThong` - Trình độ phổ thông
- `DmXepLoaiChuyenMon` - Xếp loại chuyên môn
- `DmNhomLuong` - Nhóm lương
- `DmViTriViecLam` - Vị trí việc làm

### Employee Data Table

- `TcnsLyLich` - Lý lịch cán bộ

## API Changes

All API endpoints remain the same, but the data structure is now SQL-based.

### Example: Get All Master Data

```http
GET /master-data/dm-dt-van-bang-llct
```

### Example: Create New Master Data

```http
POST /master-data/dm-dt-van-bang-llct
Content-Type: application/json

{
  "ma": "01",
  "ten": "Bằng cấp 1"
}
```

## Useful Prisma Commands

```bash
# View database schema in GUI
npx prisma studio

# Create a new migration
npx prisma migrate dev --name migration_name

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Check pending migrations
npx prisma migrate status
```

## Troubleshooting

### Issue: Connection refused

- Ensure PostgreSQL is running
- Check DATABASE_URL in .env file
- Verify database user credentials

### Issue: Migration failed

- Check if Prisma schema syntax is correct
- Ensure PostgreSQL driver is installed
- Run `npx prisma migrate reset` to clear and retry

### Issue: Type errors in TypeScript

- Run `npx prisma generate` to regenerate Prisma Client types

## Data Migration from MongoDB to PostgreSQL

If you have existing data in MongoDB:

1. Export data from MongoDB as JSON
2. Transform JSON to match PostgreSQL schema
3. Use a migration script to insert data into PostgreSQL

Example script:

```typescript
// migration.ts
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";

const prisma = new PrismaClient();

async function main() {
  const data = JSON.parse(fs.readFileSync("data.json", "utf-8"));

  for (const record of data.dmDtVanBangLLCT) {
    await prisma.dmDtVanBangLLCT.create({ data: record });
  }
}

main().then(() => prisma.$disconnect());
```

## Performance Considerations

1. **Indexes**: All reference codes are indexed for faster lookups
2. **Timestamps**: `createdAt` and `updatedAt` are automatically managed
3. **Unique Constraints**: Code fields are marked as unique
4. **Query Optimization**: Use Prisma select/include for optimal queries

## Next Steps

1. Complete implementation of all API endpoints
2. Add authentication and authorization
3. Implement advanced filtering and pagination
4. Add request validation with class-validator
5. Set up automated testing
