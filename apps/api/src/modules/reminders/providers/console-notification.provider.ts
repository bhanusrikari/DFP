import { randomUUID } from "node:crypto";
import type { NotificationProvider, SendReminderInput, SendReminderResult } from "./notification-provider.interface.js";

// Default provider: logs what would be sent instead of calling a real
// WhatsApp API. Runs the entire reminder pipeline today with zero external
// credentials — flip REMINDER_PROVIDER=twilio once Twilio is configured.
export class ConsoleNotificationProvider implements NotificationProvider {
  async send(input: SendReminderInput): Promise<SendReminderResult> {
    // eslint-disable-next-line no-console
    console.log(`[reminder:console] would WhatsApp ${input.toPhone ?? "(no phone on file)"}: "${input.message}"`);
    return { success: true, providerMessageId: `console-${randomUUID()}` };
  }
}
