import twilio from "twilio";
import { env } from "../../../config/env.js";
import type { NotificationProvider, SendReminderInput, SendReminderResult } from "./notification-provider.interface.js";

// Real WhatsApp delivery via Twilio (PRD section 6: "WhatsApp can be used as
// the reminder channel"). Server-side only — credentials never reach the client.
export class TwilioNotificationProvider implements NotificationProvider {
  private client: ReturnType<typeof twilio>;

  constructor() {
    this.client = twilio(env.twilioAccountSid, env.twilioAuthToken);
  }

  async send(input: SendReminderInput): Promise<SendReminderResult> {
    if (!input.toPhone) {
      return { success: false, error: "No phone number on file for this patient" };
    }
    try {
      const message = await this.client.messages.create({
        from: `whatsapp:${env.twilioWhatsappFrom}`,
        to: `whatsapp:${input.toPhone}`,
        body: input.message,
      });
      return { success: true, providerMessageId: message.sid };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }
}
