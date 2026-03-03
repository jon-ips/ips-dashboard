// Supabase Edge Function — Telegram Webhook Handler for IPS Workspace Drafts
// Deploy: supabase functions deploy telegram-webhook
// Set webhook: curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=<FUNCTION_URL>"

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Map Telegram chat IDs to team members — fill in after each person messages the bot
const CHAT_ID_TO_AUTHOR: Record<number, string> = {
  // 123456789: "jon",
  // 987654321: "tristan",
};

async function sendTelegramReply(chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const update = await req.json();
    const message = update.message;

    if (!message?.text) {
      return new Response("OK", { status: 200 });
    }

    const chatId = message.chat.id;
    const text = message.text.trim();
    const firstName = message.from?.first_name || "Unknown";

    // Handle /start command
    if (text === "/start") {
      await sendTelegramReply(
        chatId,
        `👋 Hi ${firstName}! I'm the <b>IPS Tasks</b> bot.\n\n` +
          `Send me any message and it'll appear as a draft in the IPS Workspace for review.\n\n` +
          `Your chat ID is: <code>${chatId}</code>\n` +
          `Share this with your admin to link your account.`
      );
      return new Response("OK", { status: 200 });
    }

    // Determine author from chat ID mapping, fall back to first name
    const author = CHAT_ID_TO_AUTHOR[chatId] || firstName.toLowerCase();

    // Insert draft into Supabase
    const { error } = await supabase.from("task_drafts").insert({
      text,
      author,
      telegram_chat_id: chatId,
    });

    if (error) {
      console.error("Supabase insert error:", error);
      await sendTelegramReply(chatId, "❌ Failed to save draft. Please try again.");
      return new Response("OK", { status: 200 });
    }

    await sendTelegramReply(
      chatId,
      `✅ <b>Draft saved:</b> "${text}"\n\nIt will appear in the IPS Workspace inbox for review.`
    );

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response("Internal error", { status: 500 });
  }
});
