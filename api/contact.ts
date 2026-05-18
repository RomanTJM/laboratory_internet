import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';
import { GoogleGenAI } from '@google/genai';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[\+]?[\d\s\(\)\-]{7,20}$/;

interface ContactPayload {
  name: string;
  phone: string;
  email: string;
  comment?: string;
}

function validate(body: Partial<ContactPayload>): string | null {
  const { name, phone, email } = body;
  if (!name?.trim())  return 'Поле "Имя" обязательно';
  if (!phone?.trim()) return 'Поле "Телефон" обязательно';
  if (!email?.trim()) return 'Поле "Email" обязательно';
  if (!EMAIL_RE.test(email)) return 'Некорректный email';
  if (!PHONE_RE.test(phone)) return 'Некорректный номер телефона';
  return null;
}

const FALLBACK_REPLY = () =>
  'Ваше сообщение получено. Роман рассмотрит ваш запрос и свяжется с вами в течение 24 часов.';

async function generateAiReply(name: string, comment: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return FALLBACK_REPLY();

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Ты — ассистент frontend-разработчика Романа Рябченко.
Человек по имени ${name} оставил сообщение: "${comment || 'без комментария'}".
Напиши тёплое, профессиональное подтверждение получения (2–3 предложения).
Упомяни, что Роман свяжется в течение 24 часов.
Отвечай на том же языке, что и сообщение.
Только текст, без форматирования.`;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
    });
    return response.text ?? FALLBACK_REPLY();
  } catch (err) {
    console.warn('[AI] fallback:', (err as Error).message);
    return FALLBACK_REPLY();
  }
}

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: (process.env.SMTP_PORT ?? '465') === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function ownerHtml(p: ContactPayload): string {
  return `<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"><style>
  body{font-family:Inter,sans-serif;background:#07070e;color:#eeeeff;padding:32px}
  h2{color:#7b6ff0;margin-bottom:24px}
  table{border-collapse:collapse;width:100%}
  td{padding:10px 12px;border:1px solid rgba(255,255,255,0.08);font-size:15px}
  td:first-child{color:#9898bb;width:130px}
</style></head>
<body>
  <h2>Новое сообщение с портфолио</h2>
  <table>
    <tr><td>Имя</td><td>${escapeHtml(p.name)}</td></tr>
    <tr><td>Телефон</td><td>${escapeHtml(p.phone)}</td></tr>
    <tr><td>Email</td><td>${escapeHtml(p.email)}</td></tr>
    <tr><td>Комментарий</td><td>${escapeHtml(p.comment ?? '—')}</td></tr>
  </table>
</body>
</html>`;
}

function userHtml(name: string, aiReply: string): string {
  return `<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"><style>
  body{font-family:Inter,sans-serif;background:#07070e;color:#eeeeff;padding:32px;max-width:560px}
  p{line-height:1.7;color:#9898bb}
  .sig{margin-top:32px;border-top:1px solid rgba(255,255,255,0.08);padding-top:20px}
  .sig strong{color:#eeeeff}
  .sig span{color:#7b6ff0;font-size:13px}
</style></head>
<body>
  <p>Здравствуйте, ${escapeHtml(name)}!</p>
  <p>${escapeHtml(aiReply)}</p>
  <div class="sig">
    <strong>Роман Рябченко</strong><br>
    <span>Frontend Developer · roman.sk8@bk.ru</span>
  </div>
</body>
</html>`;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const payload = req.body as Partial<ContactPayload>;
  const validationError = validate(payload);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }

  const { name, phone, email, comment = '' } = payload as ContactPayload;

  try {
    const aiReply = await generateAiReply(name, comment);

    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      const transporter = createTransport();
      const from = `"Роман Рябченко | Portfolio" <${process.env.SMTP_USER}>`;
      const ownerEmail = process.env.TO_EMAIL ?? 'roman.sk8@bk.ru';

      await Promise.all([
        transporter.sendMail({
          from,
          to: ownerEmail,
          subject: `Новое сообщение от ${name}`,
          html: ownerHtml({ name, phone, email, comment }),
        }),
        transporter.sendMail({
          from,
          to: email,
          subject: 'Ваше сообщение получено',
          html: userHtml(name, aiReply),
        }),
      ]);
    }

    res.status(200).json({ success: true, aiReply });
  } catch (err) {
    console.error('[contact]', err);
    res.status(500).json({ error: 'Не удалось отправить сообщение. Попробуйте позже.' });
  }
}
