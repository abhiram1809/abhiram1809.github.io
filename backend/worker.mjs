import { connect } from 'cloudflare:sockets';

const site = 'https://abhiramsharma.com';
const origins = new Set([site, 'https://www.abhiramsharma.com', 'http://abhiramsharma.com', 'http://www.abhiramsharma.com']);
const maximumBodyBytes = 24_000;
const emailPattern = /^[a-z\d.!#$%&'*+/=?^_`{|}~-]+@(?:[a-z\d](?:[a-z\d-]*[a-z\d])?\.)+[a-z\d](?:[a-z\d-]*[a-z\d])?$/i;
const encoder = new TextEncoder();

async function readMessage(request) {
  if (!request.headers.get('Content-Type')?.startsWith('application/json') || !request.body) return null;
  const reader = request.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let text = '';
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > maximumBodyBytes) return null;
      text += decoder.decode(value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } catch {
    return null;
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

async function verifyTurnstile(token, secret, origin) {
  if (typeof token !== 'string' || !token || token.length > 2048) return false;
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({ secret, response: token }),
    signal: AbortSignal.timeout(5000)
  });
  if (!response.ok) return false;
  const result = await response.json();
  return result.success === true && result.hostname === new URL(origin).hostname && result.action === 'portfolio-contact';
}

function base64(text) {
  return btoa(String.fromCharCode(...encoder.encode(text)));
}

async function submitMail(env, { name, email, message }) {
  const from = env.SMTP_USERNAME;
  const to = env.MAIL_TO;
  const socket = connect({ hostname: 'smtp.gmail.com', port: 465 }, { secureTransport: 'on' });
  const reader = socket.readable.getReader();
  const writer = socket.writable.getWriter();
  const decoder = new TextDecoder();
  let buffer = '';

  const readLine = async () => {
    while (!buffer.includes('\r\n')) {
      const { value, done } = await reader.read();
      if (done) throw new Error('SMTP connection closed');
      buffer += decoder.decode(value, { stream: true });
      if (buffer.length > 8192) throw new Error('SMTP response exceeded limit');
    }
    const end = buffer.indexOf('\r\n');
    const line = buffer.slice(0, end);
    buffer = buffer.slice(end + 2);
    return line;
  };

  const expect = async (code) => {
    for (let line = 0; line < 30; line++) {
      const reply = await readLine();
      if (!reply.startsWith(String(code))) throw new Error('SMTP rejected request');
      if (reply[3] !== '-') return;
    }
    throw new Error('Unterminated SMTP response');
  };

  const command = async (line, code) => {
    await writer.write(encoder.encode(line + '\r\n'));
    await expect(code);
  };

  const send = async () => {
    await socket.opened;
    await expect(220);
    await command('EHLO abhiramsharma.com', 250);
    await command('AUTH PLAIN ' + base64('\0' + from + '\0' + env.SMTP_PASSWORD), 235);
    await command('MAIL FROM:<' + from + '>', 250);
    await command('RCPT TO:<' + to + '>', 250);
    await command('DATA', 354);
    const payload = base64('Name: ' + name + '\nEmail: ' + email + '\n\n' + message);
    await command([
      'From: ' + from,
      'To: ' + to,
      'Reply-To: ' + email,
      'Date: ' + new Date().toUTCString(),
      'Message-ID: <' + crypto.randomUUID() + '@abhiramsharma.com>',
      'Subject: New portfolio contact message',
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      payload.match(/.{1,76}/g).join('\r\n'),
      '.'
    ].join('\r\n'), 250);
  };

  let timer;
  try {
    await Promise.race([send(), new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('SMTP timed out')), 9000);
    })]);
  } finally {
    clearTimeout(timer);
    writer.releaseLock();
    reader.releaseLock();
    await socket.close().catch(() => {});
  }
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    const origin = request.headers.get('Origin');
    const allowed = origins.has(origin);
    const headers = new Headers({ 'Cache-Control': 'no-store', 'Vary': 'Origin' });
    if (allowed) headers.set('Access-Control-Allow-Origin', origin);
    const json = (body, status = 200) => Response.json(body, { status, headers });
    const isContact = path === '/contact';

    if (!isContact && path !== '/visits') return json({ error: 'not_found' }, 404);
    if (origin && !allowed) return json({ error: 'origin' }, 403);
    if (request.method === 'OPTIONS' && allowed) {
      headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      headers.set('Access-Control-Allow-Headers', 'Content-Type');
      headers.set('Access-Control-Max-Age', '600');
      return new Response(null, { status: 204, headers });
    }

    try {
      if (!isContact) {
        if (request.method === 'POST' && allowed) {
          const { total } = await env.DB.prepare('UPDATE portfolio_visits SET total = total + 1 WHERE id = 1 RETURNING total').first();
          return json({ total });
        }
        if (request.method === 'GET') {
          const { total } = await env.DB.prepare('SELECT total FROM portfolio_visits WHERE id = 1').first();
          return json({ total });
        }
        return json({ error: 'method' }, 405);
      }

      const configured = Boolean(env.SMTP_PASSWORD && env.TURNSTILE_SECRET &&
        emailPattern.test(env.SMTP_USERNAME || '') && emailPattern.test(env.MAIL_TO || ''));
      if (request.method === 'GET') return json({ available: configured });
      if (request.method !== 'POST') return json({ error: 'method' }, 405);
      if (!allowed || !origin.startsWith('https://')) return json({ error: 'origin' }, 403);
      if (!configured) return json({ error: 'unavailable' }, 503);

      const fields = await readMessage(request);
      if (!fields || typeof fields.name !== 'string' || typeof fields.email !== 'string' ||
        typeof fields.message !== 'string' || typeof fields.company !== 'string') {
        return json({ error: 'invalid' }, 400);
      }
      if (fields.company.trim()) return json({ error: 'invalid' }, 400);
      const name = fields.name.trim();
      const email = fields.email.trim();
      const message = fields.message.trim();
      if (!name || name.length > 100 || email.length > 254 || !emailPattern.test(email) ||
        !message || message.length > 4000) {
        return json({ error: 'invalid' }, 400);
      }

      if (!await verifyTurnstile(fields.token, env.TURNSTILE_SECRET, origin)) {
        return json({ error: 'verification' }, 400);
      }
      // A single guarded update enforces the same budget across all Worker locations.
      const hour = Math.floor(Date.now() / 3_600_000);
      const permit = await env.DB.prepare(
        'UPDATE contact_budget SET requests = CASE WHEN hour = ?1 THEN requests + 1 ELSE 1 END, hour = ?1 ' +
        'WHERE id = 1 AND (hour <> ?1 OR requests < 30) RETURNING requests'
      ).bind(hour).first();
      if (!permit) return json({ error: 'rate_limit' }, 429);
      await submitMail(env, { name, email, message });
      return json({ sent: true });
    } catch {
      return json({ error: 'unavailable' }, 503);
    }
  }
};
