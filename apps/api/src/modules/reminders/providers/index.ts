import { env } from "../../../config/env.js";
import type { NotificationProvider } from "./notification-provider.interface.js";
import { ConsoleNotificationProvider } from "./console-notification.provider.js";
import { TwilioNotificationProvider } from "./twilio-notification.provider.js";
import { ResendNotificationProvider } from "./email-notification.provider.js";

let cached: NotificationProvider | undefined;

export function getNotificationProvider(): NotificationProvider {
  if (!cached) {
    if (env.reminderProvider === "twilio") {
      cached = new TwilioNotificationProvider();
    } else if (env.reminderProvider === "resend") {
      cached = new ResendNotificationProvider();
    } else {
      cached = new ConsoleNotificationProvider();
    }
  }
  return cached;
}
