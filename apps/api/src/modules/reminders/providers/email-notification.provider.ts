import nodemailer from "nodemailer";
import { NotificationProvider } from "./notification-provider.interface.js";
import { env } from "../../../config/env.js";
import { randomUUID } from "node:crypto";

export class ResendNotificationProvider implements NotificationProvider {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass,
      },
    });
  }

  async send({ toPhone, toEmail, message }: { toPhone: string | null; toEmail?: string | null; message: string }) {
    if (!toEmail) return { success: false };

    try {
      const info = await this.transporter.sendMail({
        from: `"Discharge Updates" <${env.smtpUser}>`,
        to: toEmail,
        subject: "Discharge & Care Plan Update",
        text: message,
      });

      console.log(`[reminder:nodemailer] Email sent to ${toEmail}`);

      return {
        success: true,
        providerMessageId: info.messageId || randomUUID(),
      };
    } catch (error) {
      console.error("[reminder:nodemailer] Failed to send email", error);
      return { success: false };
    }
  }
}
