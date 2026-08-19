import { ResendNotificationProvider } from "./modules/reminders/providers/email-notification.provider.js";

async function main() {
  const provider = new ResendNotificationProvider();
  
  const result = await provider.send({
    toPhone: null,
    toEmail: "itsmykingdom8@gmail.com",
    message: "Hello Priya Sharma, your Discharge Summary and Care Plan is ready! Please review your schedule: Final Care Plan Summary"
  });

  console.log("Direct Email Result:", result);
}

main().catch(console.error);
