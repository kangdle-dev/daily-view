#!/usr/bin/env node
import "dotenv/config";

async function sendTelegramMessage(message) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHANNEL_ID;

  if (!token || !chatId) {
    console.error("❌ TELEGRAM_BOT_TOKEN 또는 TELEGRAM_CHANNEL_ID가 설정되지 않았습니다");
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML"
      })
    });

    const data = await response.json();

    if (data.ok) {
      console.log("✅ Telegram 메시지 발송 성공!");
      return true;
    } else {
      console.error("❌ Telegram 오류:", data.description);
      return false;
    }
  } catch (err) {
    console.error("❌ 요청 실패:", err.message);
    return false;
  }
}

// 테스트 메시지 발송
const testMessage = `🚀 <b>테스트 메시지</b>
⏰ ${new Date().toLocaleString("ko-KR")}
✨ Telegram 연동이 작동합니다!`;

await sendTelegramMessage(testMessage);
