# TÀI LIỆU ĐẶC TẢ KIẾN TRÚC & GIAO TIẾP HỆ THỐNG
**Dự án:** Trục Tích hợp Dữ liệu Đại học (University Data Integration Hub)
**Phiên bản:** 1.0.3

---

## 1. Tổng quan Hệ thống
Trục tích hợp dữ liệu (Integration Hub) đóng vai trò là "Trái tim" trong kiến trúc hệ thống thông tin của trường Đại học. Nó có nhiệm vụ thu thập, chuẩn hóa và lưu trữ tập trung dữ liệu từ các hệ thống phân tán (Silos) như hệ thống Quản lý Đào tạo (myBK/myHCMUT), hệ thống Nhân sự, v.v.

Hệ thống sử dụng 2 cơ sở dữ liệu: 
*   **MongoDB:** Đóng vai trò là *Schema Registry* (Lưu trữ siêu dữ liệu/Metadata) và *System Logs* (Nhật ký đồng bộ). Chịu trách nhiệm quản trị cấu trúc tĩnh và động.
*   **PostgreSQL:** Đóng vai trò là *Master Data Management (MDM)*. Lưu trữ dữ liệu lõi (Golden Records) đã qua chuẩn hóa (Sinh viên, Cán bộ, Danh mục) đảm bảo tính toàn vẹn (ACID).

---

## 2. Tiêu chuẩn Giao tiếp Dữ liệu (Strict API Contract)
Nhằm đảm bảo tính nhất quán và tính sẵn sàng của Trục tích hợp, kiến trúc hệ thống áp dụng một số quy tắc đối với các hệ thống nguồn. 

Các hệ thống vệ tinh (Nguồn cấp dữ liệu) bắt buộc phải tuân thủ Đặc tả API dưới đây khi Trục tích hợp gọi đến. Nếu sai định dạng, Trục sẽ từ chối nhận dữ liệu và ghi log cảnh báo.

### 2.1. Cấu trúc Request
Trục tích hợp sẽ gọi HTTP `GET` đến các hệ thống nguồn, bắt buộc đính kèm tham số phân trang:
*   `page`: Trang hiện tại cần lấy.
*   `limit`: Số lượng bản ghi tối đa trên mỗi trang (Mặc định Hệ thống thiết lập là `5000` để tối ưu RAM).

**Ví dụ:** `GET https://api.mybk.edu.vn/v1/nh_dao_tao?page=1&limit=5000`

### 2.2. Cấu trúc Response (JSON)
Hệ thống nguồn bắt buộc trả về HTTP Status `200 OK` với định dạng JSON chuẩn như sau:

```json
{
  "success": true,
  "timestamp": "2025-10-17T10:00:00Z",
  "metadata": {
    "tableName": "nh_dao_tao",
    "totalRecords": 68743,
    "totalPages": 14,
    "currentPage": 1,
    "limit": 5000
  },
  "payload": [
    {
      "id": 1,
      "maNguoiHoc": "SV001",
      "cccdSo": "079200001234",
      "trinhDoDaoTao": "Đại học",
      "emailTruong": "sv001@hcmut.edu.vn"
    },
    {
      "id": 2,
      "maNguoiHoc": "SV002",
      "cccdSo": "079200001235",
      "trinhDoDaoTao": "Đại học",
      "emailTruong": "sv002@hcmut.edu.vn"
    }
  ]
}
```

**Ràng buộc Dữ liệu:**
- `success`: Bắt buộc là `true`.
- `metadata.totalPages`: Bắt buộc có để Trục tích hợp tính toán vòng lặp.
- `payload`: Bắt buộc là một Mảng (`Array`) chứa các đối tượng dữ liệu.

---

## 3. Chiến lược Xử lý Dữ liệu lớn
Đối mặt với các bảng có số lượng dữ liệu rất lớn (ví dụ: Bảng `nh_dao_tao` chứa hơn 68,000 sinh viên), hệ thống không thực hiện kéo toàn bộ dữ liệu trong một lần gọi API nhằm tránh hiện tượng tràn bộ nhớ và quá trình timeout. 

**Giải pháp phân lô (Batching Loop):**
1. Engine tích hợp (NestJS) đọc tổng số trang (`totalPages`) từ lần gọi API đầu tiên.
2. Khởi tạo vòng lặp `do-while`, cuốn chiếu từng trang (Mỗi trang giới hạn 5,000 records).
3. Đẩy 5,000 bản ghi này vào cơ sở dữ liệu PostgreSQL thông qua cơ chế `UPSERT` (Update if exists, Insert if not).
4. Giải phóng RAM và tiếp tục lấy trang tiếp theo cho đến khi hoàn tất.

---

## 4. Quản trị Dữ liệu (Data Governance & Schema Detection)
Kiến trúc hệ thống bao gồm một **Cơ chế phát hiện thay đổi cấu trúc tự động (Schema Change Detector)**, xử lý theo luồng *Human-in-the-loop* (Có sự xác nhận của con người).

*   **Bước 1 (Auto-Detect):** Trước khi đồng bộ dữ liệu, hệ thống lấy mã `hashValue` của bảng từ hệ thống nguồn để so sánh với mã Hash lưu trong MongoDB.
*   **Bước 2 (Alerting):** Nếu phát hiện sự sai lệch (Hệ thống nguồn vừa thêm, sửa, xóa cột), Trục tích hợp sẽ **đóng băng** tiến trình đồng bộ của riêng bảng đó, chuyển trạng thái sang `changed` và gửi cảnh báo lên Dashboard.
*   **Bước 3 (Human Review):** Quản trị viên đối chiếu cấu trúc mới và cũ trên giao diện UI, tiến hành cập nhật Data Model (`schema.prisma`) và Apply vào cơ sở dữ liệu vật lý.
*   **Bước 4 (Resolve):** Quản trị viên đánh dấu trạng thái bảng trở về `stable`. Tiến trình tự động đồng bộ (ETL) được phép tiếp tục hoạt động an toàn.

> **Lợi ích:** Cơ chế này triệt tiêu hoàn toàn rủi ro Hệ thống nguồn thay đổi cấu trúc đột ngột gây ra lỗi *Type Mismatch* hoặc *Data Loss* làm gián đoạn toàn bộ Trục tích hợp.

---

## 5. Động cơ Đồng bộ (Sync Engine Upsert Mechanism)
Hệ thống loại bỏ việc viết các hàm CRUD thủ công cho từng bảng. Thay vào đó, áp dụng cơ chế **Dynamic Model Delegation** của ORM Prisma.

```typescript
// Cơ chế Tự động định tuyến Model & Upsert dữ liệu
await this.prisma[modelName].upsert({
  where: { [primaryKeyColumn]: pkValue }, 
  update: recordData,                     
  create: recordData,                     
});
```
*   Dữ liệu tồn tại $\rightarrow$ Cập nhật thông tin mới nhất.
*   Dữ liệu chưa tồn tại $\rightarrow$ Tạo bản ghi mới.
*   Lỗi 1 bản ghi (Dị thường dữ liệu) $\rightarrow$ Ghi log lỗi độc lập, không làm gián đoạn tiến trình của các bản ghi khác trong cùng lô.

---

## 6. Nhật ký & Giám sát (Observability & Event Logging)
Mọi hành động của Trục tích hợp đều được định lượng và lưu trữ lại trong Collection `eventlogs` (MongoDB). Quản trị viên có thể theo dõi qua giao diện Frontend.

**Các thông số được lưu vết:**
- `Type`: Loại tiến trình (VD: `data_sync`, `schema_init`).
- `Duration`: Thời lượng thực thi (tính bằng milliseconds).
- `Metrics`: Thống kê số lượng bản ghi thành công/thất bại.
- `Error Details`: Lưu chi tiết Khóa chính (`Primary Key`) và thông báo lỗi của database khi có bản ghi vi phạm ràng buộc dữ liệu, giúp Dev/Admin dễ dàng truy vết (Traceability).