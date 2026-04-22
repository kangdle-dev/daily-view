export async function sendTelegramMessage(message) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHANNEL_ID;

  if (!token || !chatId) {
    console.warn("[telegram] 토큰 또는 채팀ID 미설정, 메시지 발송 안 함");
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
      console.log("[telegram] 발송 성공");
      return true;
    } else {
      console.error("[telegram] 오류:", data.description);
      return false;
    }
  } catch (err) {
    console.error("[telegram] 요청 실패:", err.message);
    return false;
  }
}
