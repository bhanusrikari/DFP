export interface SendReminderInput {
  toPhone: string | null;
  message: string;
}

export interface SendReminderResult {
  success: boolean;
  providerMessageId?: string;
  error?: string;
}

// Same provider-seam pattern as AIProvider: swap ConsoleNotificationProvider
// for TwilioNotificationProvider via REMINDER_PROVIDER=twilio with no change
// to reminder-scheduler.ts or anything upstream of it.
export interface NotificationProvider {
  send(input: SendReminderInput): Promise<SendReminderResult>;
}
