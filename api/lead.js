// Vercel Serverless Function: /api/lead
// Handles incoming leads and optionally notifies manager via Telegram bot

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      body = {};
    }
  }

  const { name, phone, city, note, source } = body || {};

  // Optional: Send instant Telegram notification to manager if environment variables are set
  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const tgChatId = process.env.TELEGRAM_CHAT_ID;

  if (tgToken && tgChatId) {
    try {
      const now = new Date().toLocaleString('kk-KZ', { timeZone: 'Asia/Almaty' });
      const text =
        `🕋 *Farab Tour — Жаңа Өтінім!*\n\n` +
        `📅 *Уақыты:* ${now}\n` +
        `👤 *Аты-жөні:* ${name || 'Көрсетілмеген'}\n` +
        `📞 *Телефон:* ${phone || 'Көрсетілмеген'}\n` +
        `📍 *Қаласы:* ${city || 'Көрсетілмеген'}\n` +
        `📋 *Сұрағы / Тур:* ${note || 'Көрсетілмеген'}\n` +
        `🌐 *Дереккөз:* ${source || 'Сайт'}`;

      await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: tgChatId,
          text: text,
          parse_mode: 'Markdown'
        })
      });
    } catch (tgErr) {
      console.warn('Telegram notification failed:', tgErr);
    }
  }

  return res.status(200).json({
    status: 'success',
    message: 'Өтінім сәтті қабылданды',
    data: { name, phone, city, note, source }
  });
}
