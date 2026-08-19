import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:5173",
  jwtSecret: required("JWT_SECRET", "dev-only-change-me"),

  aiProvider: (process.env.AI_PROVIDER ?? "mock") as "mock" | "claude",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",

  reminderProvider: (process.env.REMINDER_PROVIDER ?? "console") as "console" | "twilio",
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID ?? "",
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN ?? "",
  twilioWhatsappFrom: process.env.TWILIO_WHATSAPP_FROM ?? "",

  demoTimeAcceleration: Number(process.env.DEMO_TIME_ACCELERATION ?? 1),
};
