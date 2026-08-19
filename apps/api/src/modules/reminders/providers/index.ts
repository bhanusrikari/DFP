import { env } from "../../../config/env.js";
import type { NotificationProvider } from "./notification-provider.interface.js";
import { ConsoleNotificationProvider } from "./console-notification.provider.js";
import { TwilioNotificationProvider } from "./twilio-notification.provider.js";

let cached: NotificationProvider | undefined;

export function getNotificationProvider(): NotificationProvider {
  if (!cached) {
    cached = env.reminderProvider === "twilio" ? new TwilioNotificationProvider() : new ConsoleNotificationProvider();
  }
  return cached;
}
