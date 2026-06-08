'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Lang = 'vi' | 'en';

const translations = {
  // ── SIDEBAR ──────────────────────────────────────────────────────────────
  'nav.dashboard':      { vi: 'Dashboard',           en: 'Dashboard' },
  'nav.scheduler':      { vi: 'Job Scheduler',        en: 'Job Scheduler' },
  'nav.access':         { vi: 'Access Control',       en: 'Access Control' },
  'nav.schema':         { vi: 'Schema Registry',      en: 'Schema Registry' },
  'nav.syncHistory':    { vi: 'Sync History',         en: 'Sync History' },
  'nav.backup':         { vi: 'Backup',               en: 'Backup' },
  'nav.dataMgmt':       { vi: 'Data Management',      en: 'Data Management' },
  'nav.accessLogs':     { vi: 'Access Logs',          en: 'Access Logs' },
  'nav.gateway':        { vi: 'API Gateway (Kong)',   en: 'API Gateway (Kong)' },
  'nav.logout':         { vi: 'Đăng xuất',            en: 'Log out' },
  'nav.sourceConfig':   { vi: 'Source Config',        en: 'Source Config' },
  'nav.views':          { vi: 'View Manager',          en: 'View Manager' },

  // ── VIEW MANAGER ──────────────────────────────────────────────────────────
  'view.title':         { vi: 'Quản lý View',          en: 'View Manager' },
  'view.subtitle':      { vi: 'Tạo view PostgreSQL để gộp bảng hoặc ẩn cột/hàng không cần thiết.', en: 'Create PostgreSQL views to join tables or hide unnecessary columns/rows.' },
  'view.createBtn':     { vi: 'Tạo View Mới',          en: 'Create New View' },
  'view.name':          { vi: 'Tên View',              en: 'View Name' },
  'view.namePlaceholder': { vi: 'vd: sinhvien_gon', en: 'e.g. sinhvien_gon' },
  'view.desc':          { vi: 'Mô tả',                 en: 'Description' },
  'view.descPlaceholder': { vi: 'Mô tả ngắn về view này...', en: 'Short description...' },
  'view.sql':           { vi: 'SQL Query',              en: 'SQL Query' },
  'view.sqlPlaceholder': { vi: 'SELECT shcc, ho, ten FROM tcns_can_bo WHERE active = true', en: 'SELECT col1, col2 FROM table WHERE ...' },
  'view.preview':       { vi: 'Xem trước',             en: 'Preview' },
  'view.previewTitle':  { vi: 'Kết quả xem trước (tối đa 20 dòng)', en: 'Preview Result (max 20 rows)' },
  'view.save':          { vi: 'Lưu View',              en: 'Save View' },
  'view.cancel':        { vi: 'Hủy',                   en: 'Cancel' },
  'view.edit':          { vi: 'Chỉnh sửa',             en: 'Edit' },
  'view.drop':          { vi: 'Xóa View',              en: 'Drop View' },
  'view.confirmDrop':   { vi: 'Bạn có chắc muốn xóa view này? Thao tác không thể hoàn tác.', en: 'Are you sure you want to drop this view? This cannot be undone.' },
  'view.noViews':       { vi: 'Chưa có view nào. Nhấn "Tạo View Mới" để bắt đầu.', en: 'No views yet. Click "Create New View" to get started.' },
  'view.colName':       { vi: 'Tên View',              en: 'View Name' },
  'view.colDesc':       { vi: 'Mô tả',                 en: 'Description' },
  'view.colUpdated':    { vi: 'Cập nhật',              en: 'Updated' },
  'view.colActions':    { vi: 'Hành động',             en: 'Actions' },
  'view.errName':       { vi: 'Tên view không được để trống.', en: 'View name is required.' },
  'view.errSql':        { vi: 'SQL không được để trống.', en: 'SQL query is required.' },
  'view.successCreate': { vi: 'Tạo view thành công!', en: 'View created successfully!' },
  'view.successUpdate': { vi: 'Cập nhật view thành công!', en: 'View updated successfully!' },
  'view.successDrop':   { vi: 'Đã xóa view.',          en: 'View dropped.' },
  'view.queryLabel':    { vi: 'SQL đã lưu',            en: 'Saved SQL' },

  // ── LOGIN ─────────────────────────────────────────────────────────────────
  'login.subtitle':     { vi: 'Đăng nhập hệ thống quản trị ETL', en: 'Sign in to ETL Admin System' },
  'login.expired':      { vi: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', en: 'Session expired. Please sign in again.' },
  'login.submit':       { vi: 'Đăng nhập',            en: 'Sign in' },
  'login.noAccount':    { vi: 'Chưa có tài khoản Admin?', en: "Don't have an Admin account?" },
  'login.createNew':    { vi: 'Tạo mới',              en: 'Create new' },
  'login.errServer':    { vi: 'Lỗi kết nối đến máy chủ', en: 'Server connection error' },

  // ── DASHBOARD ─────────────────────────────────────────────────────────────
  'dash.manualTrigger':   { vi: 'Kích hoạt thủ công',     en: 'Manual Trigger' },
  'dash.runFull':         { vi: 'CHẠY FULL SYNC NGAY',    en: 'RUN FULL SYNC NOW' },
  'dash.syncing':         { vi: 'ĐANG ĐỒNG BỘ...',        en: 'SYNCING...' },
  'dash.runCustom':       { vi: 'CHẠY CUSTOM SYNC',       en: 'RUN CUSTOM SYNC' },
  'dash.createJob':       { vi: 'Tạo Scheduled Job',      en: 'Create Scheduled Job' },
  'dash.jobName':         { vi: 'Tên job',                en: 'Job name' },
  'dash.cronPlaceholder': { vi: 'Biểu thức Cron (VD: 0 * * * *)', en: 'Cron expression (e.g. 0 * * * *)' },
  'dash.description':     { vi: 'Mô tả',                 en: 'Description' },
  'dash.addJob':          { vi: 'Thêm Job',              en: 'Add Job' },
  'dash.scheduledJobs':   { vi: 'Scheduled Jobs',        en: 'Scheduled Jobs' },
  'dash.noJobs':          { vi: 'Chưa có job nào được cấu hình.', en: 'No scheduled jobs configured.' },
  'dash.saveInterval':    { vi: 'Lưu lịch',              en: 'Save Interval' },
  'dash.next':            { vi: 'tiếp:',                 en: 'next:' },
  'dash.last':            { vi: 'lần cuối:',             en: 'last:' },
  'dash.metrics':         { vi: 'Hiệu suất (7 lần gần nhất)', en: 'Execution Metrics (Last 7 runs)' },
  'dash.metricsDesc':     { vi: 'Records đồng bộ thành công vs thất bại.', en: 'Records synchronized successfully vs failed.' },
  'dash.noHistorical':    { vi: 'Chưa có dữ liệu lịch sử', en: 'No historical data available' },
  'dash.success':         { vi: 'Thành công',            en: 'Success' },
  'dash.failed':          { vi: 'Thất bại',              en: 'Failed' },
  'dash.recentJobs':      { vi: 'Lần chạy gần đây',     en: 'Recently Run Jobs' },
  'dash.recentDesc':      { vi: 'Các lần thực thi và kết quả gần nhất.', en: 'Latest executions and their outcomes.' },
  'dash.noHistory':       { vi: 'Chưa có lịch sử chạy.', en: 'No run history available.' },

  // ── SCHEDULER PAGE ────────────────────────────────────────────────────────
  'sched.title':      { vi: 'Automation Scheduler',   en: 'Automation Scheduler' },
  'sched.subtitle':   { vi: 'Quản lý các tiến trình đồng bộ dữ liệu tự động (Cron Jobs).', en: 'Manage automated data synchronization processes (Cron Jobs).' },
  'sched.addBtn':     { vi: 'Thêm Job Mới',           en: 'Add New Job' },
  'sched.listTitle':  { vi: 'Danh sách Cron Jobs',    en: 'Cron Jobs List' },
  'sched.colName':    { vi: 'Tên Tiến trình',         en: 'Process Name' },
  'sched.colCron':    { vi: 'Biểu thức Cron',         en: 'Cron Expression' },
  'sched.colStatus':  { vi: 'Trạng thái',             en: 'Status' },
  'sched.colLast':    { vi: 'Lần chạy cuối',          en: 'Last Run' },
  'sched.colAction':  { vi: 'Hành động',              en: 'Actions' },
  'sched.active':     { vi: 'Hoạt động',              en: 'Active' },
  'sched.paused':     { vi: 'Tạm dừng',               en: 'Paused' },
  'sched.runNow':     { vi: 'Chạy ngay',              en: 'Run Now' },
  'sched.neverRun':   { vi: 'Chưa từng chạy',         en: 'Never run' },
  'sched.noJobs':     { vi: 'Chưa có Job nào được cấu hình.', en: 'No jobs configured.' },
  'sched.alertRun':   { vi: 'Đã gửi lệnh chạy Job đến Server. Hãy mở Dashboard để xem Terminal log!', en: 'Job triggered on server. Open Dashboard to see terminal logs!' },
  'sched.alertErr':   { vi: 'Lỗi khi chạy job',      en: 'Error running job' },

  // ── SCHEMA REGISTRY ───────────────────────────────────────────────────────
  'schema.title':         { vi: 'Quản trị Dữ liệu: Schema Review', en: 'Data Governance: Schema Review' },
  'schema.subtitle':      { vi: 'Phát hiện và đối soát sự thay đổi cấu trúc dữ liệu từ nguồn.', en: 'Detect and review data structure changes from source.' },
  'schema.colTable':      { vi: 'Tên Bảng (Entity)',  en: 'Table Name (Entity)' },
  'schema.colSource':     { vi: 'Nguồn',              en: 'Source' },
  'schema.colFields':     { vi: 'Số Trường',          en: 'Fields' },
  'schema.colStatus':     { vi: 'Trạng thái',         en: 'Status' },
  'schema.reviewDiff':    { vi: 'Xem Diff',           en: 'Review Diff' },
  'schema.synced':        { vi: 'Đã đồng bộ',         en: 'Synced' },
  'schema.diffTitle':     { vi: 'Schema Diff:',       en: 'Schema Diff:' },
  'schema.diffDesc':      { vi: 'Đối chiếu thay đổi giữa API nguồn và Prisma Schema hiện tại.', en: 'Compare changes between source API and current Prisma Schema.' },
  'schema.newInit':       { vi: 'Khởi tạo mới',      en: 'New Initialization' },
  'schema.breakWarn':     { vi: 'Cảnh báo Breaking Change!', en: 'Breaking Change Warning!' },
  'schema.breakDesc':     { vi: 'Có trường dữ liệu bị xóa hoặc thay đổi kiểu type. Việc đồng bộ có thể làm mất dữ liệu cũ trong PostgreSQL. Hãy kiểm tra kỹ Prisma migration.', en: 'Fields removed or type changed. Syncing may lose existing PostgreSQL data. Please review Prisma migration carefully.' },
  'schema.newStruct':     { vi: 'Cấu trúc mới (API)', en: 'New Structure (API)' },
  'schema.oldStruct':     { vi: 'Cấu trúc cũ (DB)',  en: 'Old Structure (DB)' },
  'schema.removed':       { vi: '-- đã xóa --',       en: '-- removed --' },
  'schema.notExisted':    { vi: '-- chưa có --',       en: '-- not existed --' },
  'schema.confirmLabel':  { vi: 'Tôi xác nhận đã cập nhật file', en: 'I confirm I have updated' },
  'schema.confirmLabel2': { vi: 'và code đã được Deploy lên Server thành công.', en: 'and the code has been successfully deployed to the server.' },
  'schema.reject':        { vi: 'Từ chối thay đổi (Revert)', en: 'Reject Change (Revert)' },
  'schema.resolve':       { vi: 'Đồng ý thay đổi (Resolve)', en: 'Accept Change (Resolve)' },
  'schema.copiedModel':   { vi: 'Đã sao chép!',       en: 'Copied Model!' },
  'schema.copyPrisma':    { vi: 'Sao chép Prisma Code', en: 'Copy Prisma Code' },
  'schema.confirmReject': { vi: 'Từ chối thay đổi?',  en: 'Reject change?' },
  'schema.confirmRejectDesc': { vi: 'Hệ thống sẽ khôi phục cấu trúc cũ và bỏ qua sự thay đổi này của API trong tương lai.', en: 'The system will restore the old structure and ignore this API change in the future.' },
  'schema.rejectBtn':     { vi: 'Từ chối',            en: 'Reject' },
  'schema.cancelBtn':     { vi: 'Hủy',                en: 'Cancel' },

  // ── BACKUP ────────────────────────────────────────────────────────────────
  'backup.title':         { vi: 'Quản lý Backup',     en: 'Backup Management' },
  'backup.deleteExpired': { vi: 'Xóa bảng quá hạn',  en: 'Delete expired' },
  'backup.deleting':      { vi: 'Đang xóa...',        en: 'Deleting...' },
  'backup.syncAll':       { vi: 'Đồng bộ tất cả',    en: 'Sync all to S3' },
  'backup.syncing':       { vi: 'Đang sync...',       en: 'Syncing...' },
  'backup.addBackup':     { vi: 'Thêm backup',        en: 'Add backup' },
  'backup.colTable':      { vi: 'Tên bảng (Table Name)', en: 'Table Name' },
  'backup.colAction':     { vi: 'Hành động',          en: 'Actions' },
  'backup.loading':       { vi: 'Đang tải...',        en: 'Loading...' },
  'backup.noData':        { vi: 'Không có dữ liệu',   en: 'No data' },
  'backup.viewHistory':   { vi: 'Xem lịch sử',        en: 'View history' },
  'backup.back':          { vi: 'Quay lại',           en: 'Back' },
  'backup.historyTitle':  { vi: 'Lịch sử backup:',   en: 'Backup history:' },
  'backup.colFile':       { vi: 'Tên File Backup',    en: 'Backup File Name' },
  'backup.colUpdated':    { vi: 'Lần cập nhật cuối', en: 'Last Updated' },
  'backup.colS3Updated':  { vi: 'Lần S3 cập nhật cuối', en: 'Last S3 Update' },
  'backup.colS3Status':   { vi: 'Trạng thái S3',     en: 'S3 Status' },
  'backup.colExpiry':     { vi: 'Thời gian hết hạn', en: 'Expiry' },
  'backup.restoreTitle':  { vi: 'Khôi phục bản sao lưu?', en: 'Restore backup?' },
  'backup.restoreDesc':   { vi: 'Bạn có chắc chắn muốn khôi phục bản sao lưu này? Dữ liệu hiện tại sẽ bị ghi đè.', en: 'Are you sure you want to restore this backup? Current data will be overwritten.' },
  'backup.restoreBtn':    { vi: 'Khôi phục',          en: 'Restore' },
  'backup.cancelBtn':     { vi: 'Hủy',                en: 'Cancel' },
  'backup.selectTitle':   { vi: 'Chọn bảng để backup', en: 'Select tables to backup' },
  'backup.selectSubtitle':{ vi: 'Chỉ hiển thị các bảng stable để tạo manual backup', en: 'Only stable tables are shown for manual backup' },
  'backup.searchPlaceholder': { vi: 'Tìm bảng cần backup...', en: 'Search tables to backup...' },
  'backup.startBtn':      { vi: 'Bắt đầu Backup',    en: 'Start Backup' },
  'backup.toastStarted':  { vi: 'Đã bắt đầu backup',   en: 'Backup started for' },
  'backup.toastTables':   { vi: 'bảng!',               en: 'table(s)!' },
  'backup.toastErrCreate':{ vi: 'Lỗi khi tạo backup.', en: 'Error creating backup.' },
  'backup.toastDownload': { vi: 'Đang mở link tải backup...', en: 'Opening backup download link...' },
  'backup.toastErrLink':  { vi: 'Lỗi khi lấy link tải.', en: 'Error getting download link.' },
  'backup.toastRestore':  { vi: 'Khôi phục dữ liệu thành công!', en: 'Data restored successfully!' },
  'backup.toastErrRestore':{ vi: 'Lỗi khi khôi phục dữ liệu.', en: 'Error restoring data.' },
  'backup.toastErrCleanup':{ vi: 'Lỗi khi cleanup backup quá hạn', en: 'Error cleaning up expired backups.' },
  'backup.toastS3Done':   { vi: 'Đã sync file lên S3', en: 'File synced to S3' },
  'backup.toastErrS3':    { vi: 'Lỗi khi sync file lên S3', en: 'Error syncing file to S3.' },
  'backup.toastS3AllDone':{ vi: 'Đã bắt đầu sync toàn bộ lên S3', en: 'Started syncing all files to S3' },
  'backup.toastErrS3All': { vi: 'Lỗi khi sync toàn bộ lên S3', en: 'Error syncing all files to S3.' },
  'backup.tooltipRestore':{ vi: 'Khôi phục',           en: 'Restore' },
  'backup.tooltipUpload': { vi: 'Upload lên S3',        en: 'Upload to S3' },
  'backup.tooltipDownload':{ vi: 'Tải xuống',           en: 'Download' },

  // ── SYNC LOGS ─────────────────────────────────────────────────────────────
  'logs.title':       { vi: 'Lịch sử Đồng bộ (Sync Logs)', en: 'Sync History (Sync Logs)' },
  'logs.subtitle':    { vi: 'Quản lý lịch sử các tiến trình ETL và chi tiết từng bảng dữ liệu.', en: 'Manage ETL process history and per-table details.' },
  'logs.refresh':     { vi: 'Làm mới dữ liệu',       en: 'Refresh' },
  'logs.listTitle':   { vi: 'Danh sách Tiến trình Cron Job', en: 'Cron Job Process List' },
  'logs.colJob':      { vi: 'Tên Tiến trình (Job)',  en: 'Process Name (Job)' },
  'logs.colStart':    { vi: 'Bắt đầu lúc',           en: 'Started At' },
  'logs.colDuration': { vi: 'Thời lượng',            en: 'Duration' },
  'logs.colStatus':   { vi: 'Trạng thái',            en: 'Status' },
  'logs.colRecords':  { vi: 'Tổng Record',           en: 'Total Records' },
  'logs.colAction':   { vi: 'Hành động',             en: 'Actions' },
  'logs.rawLog':      { vi: 'Log Thô',               en: 'Raw Log' },
  'logs.tableDetail': { vi: 'Chi tiết đồng bộ theo Bảng (Tables)', en: 'Sync Detail by Tables' },
  'logs.noTableData': { vi: 'Tiến trình không có dữ liệu bảng nào (Có thể bị Skip do schema chưa an toàn hoặc không có data mới).', en: 'No table data for this process (possibly skipped due to unstable schema or no new data).' },
  'logs.colTName':    { vi: 'Tên Bảng',              en: 'Table Name' },
  'logs.colTStatus':  { vi: 'Trạng thái',            en: 'Status' },
  'logs.colTRecords': { vi: 'Record đã lưu',         en: 'Records Saved' },
  'logs.colTError':   { vi: 'Ghi chú (Lỗi)',         en: 'Notes (Errors)' },
  'logs.noHistory':   { vi: 'Chưa có lịch sử đồng bộ nào.', en: 'No sync history available.' },
  'logs.statusDone':  { vi: 'Thành công',            en: 'Success' },
  'logs.statusRun':   { vi: 'Đang chạy',             en: 'Running' },
  'logs.statusPartial':{ vi: 'Lỗi một phần',         en: 'Partial success' },
  'logs.statusFailed':       { vi: 'Thất bại',              en: 'Failed' },
  'logs.statusWarning':      { vi: 'Cảnh báo Orphan',       en: 'Orphan Warning' },
  'logs.statusDoneWarnings': { vi: 'Thành công (Có Orphan)', en: 'Done (Has Orphans)' },
  'logs.warnLabel':          { vi: 'Cảnh báo',              en: 'Warn' },
  'logs.orphanNote':         { vi: 'orphan records',        en: 'orphan records' },
  'logs.rawTag':      { vi: 'Tag:',                  en: 'Tag:' },
  'logs.rawStatus':   { vi: 'Trạng thái:',           en: 'Status:' },
  'logs.rawStart':    { vi: 'Bắt đầu:',              en: 'Started:' },
  'logs.rawEnd':      { vi: 'Kết thúc:',             en: 'Ended:' },
  'logs.sysErrors':   { vi: 'Lỗi Hệ thống (System Errors)', en: 'System Errors' },
  'logs.errLabel':    { vi: 'Lỗi',                         en: 'Err' },

  // ── ACCESS CONTROL ────────────────────────────────────────────────────────
  'ac.colUser':       { vi: 'Người dùng',            en: 'User' },
  'ac.colRole':       { vi: 'Vai trò',               en: 'Role' },
  'ac.colRead':       { vi: 'Đọc',                   en: 'Read' },
  'ac.colWrite':      { vi: 'Ghi',                   en: 'Write' },
  'ac.editTitle':     { vi: 'Chỉnh sửa:',            en: 'Edit:' },
  'ac.labelRole':     { vi: 'Vai trò',               en: 'Role' },
  'ac.labelRead':     { vi: 'Read Scopes (mỗi dòng 1 scope)', en: 'Read Scopes (1 per line)' },
  'ac.labelWrite':    { vi: 'Write Scopes (mỗi dòng 1 scope)', en: 'Write Scopes (1 per line)' },
  'ac.save':          { vi: 'Lưu',                   en: 'Save' },
  'ac.saving':        { vi: 'Đang lưu...',            en: 'Saving...' },
  'ac.cancel':        { vi: 'Hủy',                   en: 'Cancel' },
  'ac.edit':          { vi: 'Chỉnh sửa',             en: 'Edit' },
  'ac.addUser':       { vi: 'Thêm người dùng',       en: 'Add User' },
  'ac.addTitle':      { vi: 'Tạo tài khoản mới',     en: 'Create New Account' },
  'ac.labelUsername': { vi: 'Tên đăng nhập',         en: 'Username' },
  'ac.labelEmail':    { vi: 'Email',                  en: 'Email' },
  'ac.labelPassword': { vi: 'Mật khẩu (tối thiểu 6 ký tự)', en: 'Password (min 6 chars)' },
  'ac.labelFullName': { vi: 'Họ và tên (tuỳ chọn)',  en: 'Full name (optional)' },
  'ac.creating':      { vi: 'Đang tạo...',           en: 'Creating...' },
  'ac.create':        { vi: 'Tạo tài khoản',         en: 'Create Account' },

  // ── DATA EXPLORER (USER) ──────────────────────────────────────────────────
  'explorer.accessTitle':  { vi: 'Quyền truy cập',   en: 'Access' },
  'explorer.noTables':     { vi: 'Tài khoản chưa được cấp quyền xem bảng nào.', en: 'No tables have been granted to this account.' },
  'explorer.logout':       { vi: 'Đăng xuất',        en: 'Log out' },
  'explorer.sourceLabel':  { vi: 'Nguồn dữ liệu: Master Hub', en: 'Data source: Master Hub' },
  'explorer.search':       { vi: 'Tìm kiếm dữ liệu...', en: 'Search data...' },
  'explorer.exportCSV':    { vi: 'Xuất CSV',          en: 'Export CSV' },
  'explorer.exporting':    { vi: 'Đang xuất...',      en: 'Exporting...' },
  'explorer.noData':       { vi: 'Không tìm thấy dữ liệu khớp với', en: 'No data found matching' },
  'explorer.page':         { vi: 'Trang',             en: 'Page' },
  'explorer.prev':         { vi: 'Trước',             en: 'Prev' },
  'explorer.next':         { vi: 'Tiếp',              en: 'Next' },
  'explorer.selectTable':  { vi: 'Chọn một bảng bên trái để xem dữ liệu', en: 'Select a table on the left to view data' },
  'explorer.dataCol':      { vi: 'Dữ liệu',               en: 'Data' },
  'explorer.callApi':      { vi: 'Gọi API',               en: 'Call API' },
  'explorer.apiModal.title':     { vi: 'API Endpoint',    en: 'API Endpoint' },
  'explorer.apiModal.desc':      { vi: 'Sử dụng access token hiện tại của bạn để gọi API trực tiếp.', en: 'Use your current access token to call the API directly.' },
  'explorer.apiModal.endpoint':  { vi: 'Endpoint',        en: 'Endpoint' },
  'explorer.apiModal.token':     { vi: 'Access Token',    en: 'Access Token' },
  'explorer.apiModal.curl':      { vi: 'cURL',            en: 'cURL' },
  'explorer.apiModal.copy':      { vi: 'Sao chép',        en: 'Copy' },
  'explorer.apiModal.copied':    { vi: 'Đã sao chép!',   en: 'Copied!' },
  'explorer.apiModal.test':      { vi: 'Thử ngay',        en: 'Try it' },
  'explorer.apiModal.testing':   { vi: 'Đang gọi...',    en: 'Calling...' },
  'explorer.apiModal.response':  { vi: 'Kết quả',        en: 'Response' },
  'explorer.apiModal.showToken': { vi: 'Hiện token',     en: 'Show token' },
  'explorer.apiModal.hideToken': { vi: 'Ẩn token',       en: 'Hide token' },

  // ── MODAL: TABLE SELECT / BACKUP SELECT ───────────────────────────────────
  'modal.selectSync':      { vi: 'Chọn bảng để Sync', en: 'Select Tables to Sync' },
  'modal.onlyStable':      { vi: 'Chỉ hiển thị các bảng đã chuẩn hóa (stable)', en: 'Only stable tables are shown' },
  'modal.searchTable':     { vi: 'Tìm kiếm tên bảng...', en: 'Search table name...' },
  'modal.deselectAll':     { vi: 'Bỏ chọn tất cả',   en: 'Deselect All' },
  'modal.selectAll':       { vi: 'Chọn tất cả',       en: 'Select All' },
  'modal.noTable':         { vi: 'Không tìm thấy bảng nào phù hợp.', en: 'No matching tables found.' },
  'modal.cancel':          { vi: 'Huỷ',               en: 'Cancel' },
  'modal.startSync':       { vi: 'Bắt đầu Sync',      en: 'Start Sync' },

  // ── DATA MANAGEMENT (ADMIN) ───────────────────────────────────────────────
  'dm.title':           { vi: 'Quản lý Dữ liệu',     en: 'Data Management' },
  'dm.subtitle':        { vi: 'Duyệt dữ liệu đã đồng bộ và quản lý orphan records theo từng bảng.', en: 'Browse synced data and manage orphan records per table.' },
  'dm.allTables':       { vi: 'Tất cả bảng dữ liệu', en: 'All Data Tables' },
  'dm.stableOnly':      { vi: 'Chỉ hiển thị bảng stable', en: 'Stable tables only' },
  'dm.selectTable':     { vi: 'Chọn một bảng bên trái để xem dữ liệu và quản lý orphan', en: 'Select a table on the left to view data and manage orphans' },
  'dm.source':          { vi: 'Nguồn:',               en: 'Source:' },
  'dm.search':          { vi: 'Tìm kiếm...',           en: 'Search...' },
  'dm.exportCSV':       { vi: 'Xuất CSV',              en: 'Export CSV' },
  'dm.exporting':       { vi: 'Đang xuất...',          en: 'Exporting...' },
  'dm.scanOrphans':     { vi: 'Scan Orphans',          en: 'Scan Orphans' },
  'dm.scanning':        { vi: 'Đang scan...',          en: 'Scanning...' },
  'dm.page':            { vi: 'Trang',                 en: 'Page' },
  'dm.prev':            { vi: 'Trước',                 en: 'Prev' },
  'dm.next':            { vi: 'Tiếp',                  en: 'Next' },
  'dm.noData':          { vi: 'Không tìm thấy dữ liệu', en: 'No data found' },
  'dm.orphanTitle':     { vi: 'Orphan Scan',           en: 'Orphan Scan' },
  'dm.orphanFor':       { vi: 'Kết quả cho bảng:',    en: 'Results for table:' },
  'dm.noOrphans':       { vi: 'Không tìm thấy orphan record nào. Dữ liệu đồng bộ hoàn hảo!', en: 'No orphan records found. Data is perfectly in sync!' },
  'dm.orphansFound':    { vi: 'orphan records được phát hiện', en: 'orphan records detected' },
  'dm.orphanDesc':      { vi: 'Đây là các records tồn tại trong PostgreSQL nhưng không còn trong nguồn API.', en: 'These records exist in PostgreSQL but are no longer in the source API.' },
  'dm.colOrphanId':     { vi: 'Orphan ID (Primary Key)', en: 'Orphan ID (Primary Key)' },
  'dm.purgeOrphans':    { vi: 'Xóa tất cả Orphans',   en: 'Purge All Orphans' },
  'dm.purging':         { vi: 'Đang xóa...',           en: 'Purging...' },
  'dm.purgeSuccess':    { vi: 'Đã xóa thành công',    en: 'Purged successfully' },
  'dm.purgeRecords':    { vi: 'records.',               en: 'records.' },
  'dm.confirmPurge':    { vi: 'Xóa vĩnh viễn orphan records?', en: 'Permanently purge orphan records?' },
  'dm.confirmPurgeDesc':{ vi: 'Thao tác này sẽ xóa vĩnh viễn {count} records không còn tồn tại trong nguồn API. Không thể hoàn tác!', en: 'This will permanently delete {count} records that no longer exist in the source API. This cannot be undone!' },
  'dm.confirmPurgeBtn': { vi: 'Xóa vĩnh viễn',        en: 'Purge permanently' },
  'dm.cancelBtn':       { vi: 'Hủy',                   en: 'Cancel' },
  'dm.closePanel':      { vi: 'Đóng panel',            en: 'Close panel' },
  'dm.errorScan':       { vi: 'Scan thất bại. Vui lòng thử lại.', en: 'Scan failed. Please try again.' },
  'dm.errorPurge':      { vi: 'Purge thất bại. Vui lòng thử lại.', en: 'Purge failed. Please try again.' },
  'dm.records':         { vi: 'records',               en: 'records' },

  // ── GATEWAY PAGE ──────────────────────────────────────────────────────────
  'gateway.subtitle':      { vi: 'Giám sát lưu lượng truy cập, độ trễ và tỷ lệ lỗi của Trục tích hợp (Powered by Kong & Grafana).', en: 'Monitor traffic, latency and error rates of the Integration Hub (Powered by Kong & Grafana).' },
  'gateway.connecting':    { vi: 'Đang kết nối đến Prometheus & Grafana...', en: 'Connecting to Prometheus & Grafana...' },

  // ── REGISTER PAGE ─────────────────────────────────────────────────────────
  'reg.title':             { vi: 'Tạo tài khoản',     en: 'Create Account' },
  'reg.subtitle':          { vi: 'Đăng ký quyền Admin quản trị Trục tích hợp', en: 'Register Admin access to the Integration Hub' },
  'reg.errMismatch':       { vi: 'Mật khẩu xác nhận không khớp!', en: 'Passwords do not match!' },
  'reg.errLength':         { vi: 'Mật khẩu phải có ít nhất 6 ký tự.', en: 'Password must be at least 6 characters.' },
  'reg.success':           { vi: 'Đăng ký thành công! Đang chuyển hướng đến trang Đăng nhập...', en: 'Registration successful! Redirecting to Login...' },
  'reg.errServer':         { vi: 'Có lỗi xảy ra, vui lòng thử lại sau.', en: 'An error occurred, please try again later.' },
  'reg.namePlaceholder':   { vi: 'Họ và tên (VD: Nguyễn Văn A)', en: 'Full name (e.g. John Smith)' },
  'reg.emailPlaceholder':  { vi: 'Email trường (VD: admin@hcmut.edu.vn)', en: 'University email (e.g. admin@hcmut.edu.vn)' },
  'reg.passwordPlaceholder':{ vi: 'Mật khẩu',          en: 'Password' },
  'reg.confirmPlaceholder':{ vi: 'Xác nhận mật khẩu', en: 'Confirm password' },
  'reg.submit':            { vi: 'Đăng ký',            en: 'Register' },
  'reg.hasAccount':        { vi: 'Đã có tài khoản?',   en: 'Already have an account?' },
  'reg.loginLink':         { vi: 'Đăng nhập ngay',     en: 'Sign in' },
} as const;

type TranslationKey = keyof typeof translations;

// ── Context ───────────────────────────────────────────────────────────────────

type LanguageContextValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'vi',
  setLang: () => {},
  t: (key) => translations[key]?.vi ?? key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('vi');

  useEffect(() => {
    const saved = localStorage.getItem('lang') as Lang | null;
    if (saved === 'vi' || saved === 'en') setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem('lang', l);
  };

  const t = (key: TranslationKey): string =>
    translations[key]?.[lang] ?? (translations[key]?.vi ?? key);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
