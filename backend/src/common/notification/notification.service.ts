import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly config: ConfigService) {
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
}
