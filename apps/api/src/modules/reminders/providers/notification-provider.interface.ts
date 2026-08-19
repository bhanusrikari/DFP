export interface NotificationProvider {
  send(options: { toPhone: string | null; toEmail?: string | null; message: string }): Promise<{ success: boolean; providerMessageId?: string }>;
}
