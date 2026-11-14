// Editor authentication: "Sign in with Manage".
//
//   /api/auth/login     -> Manage app-login (signs in there if needed) -> back here with a code
//   /api/auth/callback  -> this server redeems the code with Manage using MANAGE_API_TOKEN,
//                          then sets its own session cookie
//   /api/auth/session   -> { authenticated }
//   /api/auth/logout
//
// Sessions are stateless, HMAC-signed cookies (MINIS_SESSION_SECRET), so they survive the
// restart Argus does after each content backup push. No key is shared between subdomains.
//
// Server-to-server (minis-private promote/demote over loopback): header
// x-minis-internal-key must equal MINIS_INTERNAL_KEY. Never accepted from the network.

const express = require('express');
const crypto = require('crypto');

const APP = 'minis';
const COOKIE = 'minis_sid';
const SESSION_MS = 12 * 60 * 60 * 1000;
const MANAGE_PUBLIC_URL = process.env.MANAGE_PUBLIC_URL || 'https://manage.beyondmebtw.com';
const PUBLIC_URL = process.env.PUBLIC_URL || 'https://minis.beyondmebtw.com';

const b64 = (buf) => Buffer.from(buf).toString('base64url');
const secret = () => process.env.MINIS_SESSION_SECRET || '';

function safeEqual(a, b) {
    const x = Buffer.from(String(a));
    const y = Buffer.from(String(b));
    return x.length === y.length && crypto.timingSafeEqual(x, y);
}

function sign(payload) {
    const body = b64(JSON.stringify(payload));
    const mac = b64(crypto.createHmac('sha256', secret()).update(body).digest());
    return `${body}.${mac}`;
}

function verify(token) {
    if (!secret() || typeof token !== 'string' || !token.includes('.')) return null;
    const [body, mac] = token.split('.');
    const expected = b64(crypto.createHmac('sha256', secret()).update(body).digest());
    if (!safeEqual(mac, expected)) return null;
    try {
        const p = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
        return p && p.app === APP && p.exp > Date.now() ? p : null;
    } catch {
        return null;
    }
}

function cookies(req) {
    const out = {};
    for (const part of String(req.headers.cookie || '').split(';')) {
        const i = part.indexOf('=');
        if (i > 0) out[part.slice(0, i).trim()] = part.slice(i + 1).trim();
    }
    return out;
}

const sessionOf = (req) => verify(cookies(req)[COOKIE]);

function isInternal(req) {
    const key = process.env.MINIS_INTERNAL_KEY || '';
    const given = req.get('x-minis-internal-key');
    const ip = req.socket.remoteAddress || '';
    const loopback = ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
    // nginx always adds X-Forwarded-For: a forwarded request is from the network.
    return Boolean(key && given && loopback && !req.get('x-forwarded-for') && safeEqual(given, key));
}

/** Allow only same-site relative paths as post-login destinations. */
function safeNext(next) {
    const n = String(next || '');
    return n.startsWith('/') && !n.startsWith('//') && !n.includes('\\') ? n : '/editor/';
}

function requireEditor(req, res, next) {
    if (sessionOf(req) || isInternal(req)) return next();
    return res.status(401).json({ error: 'Sign in required', login: '/api/auth/login?next=/editor/' });
}

const router = express.Router();

router.get('/login', (req, res) => {
    const back = `${PUBLIC_URL}/api/auth/callback?next=${encodeURIComponent(safeNext(req.query.next))}`;
    res.redirect(302, `${MANAGE_PUBLIC_URL}/api/v1/auth/app-login?app=${APP}&return=${encodeURIComponent(back)}`);
});

router.get('/callback', async (req, res) => {
    const code = String(req.query.code || '');
    if (!code || !process.env.MANAGE_API_URL || !process.env.MANAGE_API_TOKEN || !secret()) {
        return res.status(503).send('Sign-in is not configured on this server.');
    }
    try {
        const r = await fetch(`${process.env.MANAGE_API_URL}/auth/app-login/exchange`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${process.env.MANAGE_API_TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
            signal: AbortSignal.timeout(10000)
        });
        const body = await r.json().catch(() => ({}));
        if (!r.ok || !body.ok || body.application !== APP) return res.status(401).send('Sign-in failed. Try again.');
    } catch (err) {
        console.error('Sign-in exchange failed:', err.message);
        return res.status(502).send('Manage is unavailable. Try again shortly.');
    }
    const token = sign({ app: APP, sub: 'admin', exp: Date.now() + SESSION_MS, n: b64(crypto.randomBytes(8)) });
    res.set('Set-Cookie', `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_MS / 1000}`);
    res.redirect(302, safeNext(req.query.next));
});

router.get('/session', (req, res) => {
    res.json({ authenticated: Boolean(sessionOf(req)) });
});

router.post('/logout', (req, res) => {
    res.set('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
    res.json({ ok: true });
});

module.exports = { authRouter: router, requireEditor, sessionOf, isInternal };
