import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { PrismaService } from 'src/prisma/prisma.service';

type SyncedTable = { table: string; totalRecordsSynced: number };

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASSWORD');

    if (!user || !pass) {
      this.logger.warn('[NOTIFICATION] SMTP_USER hoặc SMTP_PASSWORD chưa cấu hình — email alert bị tắt.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('SMTP_HOST') ?? 'smtp.gmail.com',
      port: Number(this.config.get<string>('SMTP_PORT') ?? 587),
      secure: false,
      auth: { user, pass },
    });
  }

  async sendJobFailureAlert(jobName: string, error: Error, durationMs?: number): Promise<void> {
    if (!this.transporter) return;

    const to = this.config.get<string>('ALERT_EMAIL_TO');
    if (!to) return;

    const now = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    const duration = durationMs != null ? `${(durationMs / 1000).toFixed(1)}s` : 'N/A';

    const html = `
      <div style="max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
        <div style="background:#dc2626;padding:16px 24px">
          <h2 style="color:#fff;margin:0">Canh bao: Scheduled Job that bai</h2>
        </div>
        <div style="padding:24px;background:#fff">
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 0;color:#6b7280;width:140px">Job Name</td><td style="padding:8px 0;font-weight:600">${jobName}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280">Thoi gian</td><td style="padding:8px 0">${now}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280">Thoi luong</td><td style="padding:8px 0">${duration}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280;vertical-align:top">Loi</td>
              <td style="padding:8px 0">
                <code style="background:#fef2f2;color:#dc2626;padding:8px 12px;border-radius:4px;display:block;white-space:pre-wrap">${error.message}</code>
              </td>
            </tr>
          </table>
        </div>
        <div style="padding:12px 24px;background:#f9fafb;color:#9ca3af;font-size:12px">
          Data Integration Hub — canh bao tu dong
        </div>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: `"Data Integration Hub" <${this.config.get('SMTP_USER')}>`,
        to,
        subject: `[CẢNH BÁO] Job "${jobName}" thất bại lúc ${now}`,
        html,
      });
      this.logger.log(`[NOTIFICATION] Đã gửi email cảnh báo job "${jobName}" tới ${to}`);
    } catch (err) {
      this.logger.error(`[NOTIFICATION] Gửi email thất bại: ${err.message}`);
    }
  }

  async sendJobSuccessSummary(jobName: string, summary: string, durationMs?: number): Promise<void> {
    if (!this.transporter) return;

    const to = this.config.get<string>('ALERT_EMAIL_TO');
    if (!to) return;

    const now = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    const duration = durationMs != null ? `${(durationMs / 1000).toFixed(1)}s` : 'N/A';

    const html = `
      <div style="max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
        <div style="background:#16a34a;padding:16px 24px">
          <h2 style="color:#fff;margin:0">Scheduled Job hoan thanh</h2>
        </div>
        <div style="padding:24px;background:#fff">
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 0;color:#6b7280;width:140px">Job Name</td><td style="padding:8px 0;font-weight:600">${jobName}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280">Thoi gian</td><td style="padding:8px 0">${now}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280">Thoi luong</td><td style="padding:8px 0">${duration}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280;vertical-align:top">Ket qua</td>
              <td style="padding:8px 0">
                <code style="background:#f0fdf4;color:#16a34a;padding:8px 12px;border-radius:4px;display:block;white-space:pre-wrap">${summary}</code>
              </td>
            </tr>
          </table>
        </div>
        <div style="padding:12px 24px;background:#f9fafb;color:#9ca3af;font-size:12px">
          Data Integration Hub — thong bao tu dong
        </div>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: `"Data Integration Hub" <${this.config.get('SMTP_USER')}>`,
        to,
        subject: `[THÀNH CÔNG] Job "${jobName}" hoàn thành lúc ${now}`,
        html,
      });
    } catch (err) {
      this.logger.error(`[NOTIFICATION] Gửi email thất bại: ${err.message}`);
    }
  }

  /**
   * Gửi email thông báo đến từng user có quyền đọc bảng vừa được sync.
   * Scope matching dùng RegExp — nhất quán với master-data access control.
   */
  async notifyAffectedUsers(syncedTables: SyncedTable[]): Promise<void> {
    if (!this.transporter || syncedTables.length === 0) return;

    const users = await this.prisma.user.findMany({
      where: { isActive: true, role: { not: 'admin' } },
      select: { id: true, username: true, email: true, roleSettings: true },
    });

    const now = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

    for (const user of users) {
      const settings = user.roleSettings as { readScopes?: string[] } | null;
      const readScopes = settings?.readScopes ?? [];
      if (readScopes.length === 0) continue;

      const accessibleTables = syncedTables.filter(({ table }) =>
        readScopes.some((pattern) => {
          try { return new RegExp(pattern).test(table); } catch { return false; }
        }),
      );

      if (accessibleTables.length === 0) continue;

      const tableRows = accessibleTables
        .map(({ table, totalRecordsSynced }) => `
          <tr>
            <td style="padding:8px 16px;border-bottom:1px solid #f1f5f9;font-family:monospace;font-size:13px;color:#0f172a">${table}</td>
            <td style="padding:8px 16px;border-bottom:1px solid #f1f5f9;text-align:right;color:#16a34a;font-weight:700">+${totalRecordsSynced.toLocaleString()}</td>
          </tr>`)
        .join('');

      const html = `
        <div style="max-width:600px;margin:auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden">
          <div style="background:linear-gradient(135deg,#1e40af,#2563eb);padding:20px 28px">
            <h2 style="color:#fff;margin:0;font-size:18px;font-weight:700">🔄 Dữ liệu đã được cập nhật</h2>
            <p style="color:#bfdbfe;margin:4px 0 0;font-size:13px">University Data Integration Hub</p>
          </div>

          <div style="padding:24px 28px;background:#fff">
            <p style="color:#374151;margin-top:0">Xin chào <b>${user.username}</b>,</p>
            <p style="color:#6b7280;margin-bottom:20px">
              Hệ thống vừa hoàn tất đồng bộ dữ liệu lúc <b style="color:#1e40af">${now}</b>.
              Các bảng bạn có quyền truy cập đã được cập nhật:
            </p>

            <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
              <thead>
                <tr style="background:#f8fafc">
                  <th style="padding:10px 16px;text-align:left;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:.05em;font-weight:600">Tên Bảng</th>
                  <th style="padding:10px 16px;text-align:right;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:.05em;font-weight:600">Records mới</th>
                </tr>
              </thead>
              <tbody>${tableRows}</tbody>
            </table>

            <div style="margin-top:24px;padding:14px 16px;background:#eff6ff;border-radius:8px;border-left:4px solid #3b82f6">
              <p style="margin:0;color:#1e40af;font-size:13px">
                💡 Đăng nhập vào <b>Data Explorer</b> để xem và xuất dữ liệu mới nhất.
              </p>
            </div>
          </div>

          <div style="padding:14px 28px;background:#f8fafc;color:#94a3b8;font-size:12px;border-top:1px solid #e2e8f0">
            Email này được gửi tự động từ Data Integration Hub. Vui lòng không trả lời.
          </div>
        </div>
      `;

      try {
        await this.transporter.sendMail({
          from: `"Data Integration Hub" <${this.config.get('SMTP_USER')}>`,
          to: user.email,
          subject: `[CẬP NHẬT] ${accessibleTables.length} bảng dữ liệu vừa được đồng bộ — ${now}`,
          html,
        });
        this.logger.log(`[NOTIFICATION] ✓ Gửi email tới ${user.email} (${accessibleTables.length} bảng)`);
      } catch (err) {
        this.logger.error(`[NOTIFICATION] Gửi email tới ${user.email} thất bại: ${err.message}`);
      }
    }
  }
}
