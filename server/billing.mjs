/**
 * AzurTant PRO — Backend de cobros
 * Stripe + MercadoPago en un solo servidor
 *
 * Uso:
 *   1) Copia .env.example a .env y rellena las keys
 *   2) npm install stripe mercadopago
 *   3) node server/billing.mjs
 *
 * Endpoints:
 *   GET  /                       → landing
 *   GET  /success                → página post-pago OK
 *   GET  /cancel                 → página pago cancelado
 *   POST /api/checkout/stripe    → crea sesión Stripe Checkout
 *   POST /api/checkout/mercadopago → crea preferencia MP
 *   POST /api/webhook/stripe     → webhook Stripe
 *   POST /api/webhook/mercadopago → webhook MP
 *   GET  /api/plans              → lista los planes
 *   GET  /api/subscription/:id   → estado de la suscripción
 */

import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, join } from 'node:path';
import { URL } from 'node:url';
import crypto from 'node:crypto';

const PORT = process.env.PORT || 5194;
const ROOT = resolve('public');
const PUBLIC_URL = process.env.PUBLIC_URL || `http://localhost:${PORT}`;

// ─── Stripe (lazy) ────────────────────────────────────────────
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
    const StripeMod = await import('stripe').catch(() => null);
    if (StripeMod) {
        stripe = new StripeMod.default(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' });
    }
}

// ─── MercadoPago (lazy) ───────────────────────────────────────
let mp = null;
if (process.env.MP_ACCESS_TOKEN) {
    const MP = await import('mercadopago').catch(() => null);
    if (MP) {
        // MP v2 uses default export; v1 named. Try both.
        const MercadoPago = MP.default || MP.MercadoPago || MP;
        if (typeof MercadoPago === 'function') {
            mp = new MercadoPago({ accessToken: process.env.MP_ACCESS_TOKEN });
        } else if (MercadoPago.configurations) {
            mp = MercadoPago;
            mp.configure({ access_token: process.env.MP_ACCESS_TOKEN });
        }
    }
}

// ─── Planes ───────────────────────────────────────────────────
const PLANS = {
    starter: {
        id: 'starter',
        name: 'Starter',
        price_mxn: 4999,
        price_usd: 250,
        features: ['5 departamentos', '1K msgs/mes', 'CFDI 4.0', 'Soporte email'],
        stripe_price_id: process.env.STRIPE_PRICE_STARTER || 'price_starter_test',
        mp_plan_id: process.env.MP_PLAN_STARTER || null,
    },
    pro: {
        id: 'pro',
        name: 'Pro',
        price_mxn: 14999,
        price_usd: 750,
        features: ['13 deptos', '10K msgs/mes', 'Voz STT+TTS', '4 SOPs', 'GraphRAG+Mem0'],
        stripe_price_id: process.env.STRIPE_PRICE_PRO || 'price_pro_test',
        mp_plan_id: process.env.MP_PLAN_PRO || null,
        popular: true,
    },
    enterprise: {
        id: 'enterprise',
        name: 'Enterprise',
        price_mxn: 39999,
        price_usd: 2000,
        features: ['Multi-sucursal', 'API REST', 'SLA 99.9%', '24/7', 'On-site'],
        stripe_price_id: process.env.STRIPE_PRICE_ENTERPRISE || 'price_enterprise_test',
        mp_plan_id: process.env.MP_PLAN_ENTERPRISE || null,
    },
};

// ─── In-memory subscription store (reemplazar con DB) ─────────
const subscriptions = new Map();

// ─── Helpers ──────────────────────────────────────────────────
const send = (res, status, body, headers = {}) => {
    res.writeHead(status, { 'Content-Type': 'application/json', ...headers });
    res.end(typeof body === 'string' ? body : JSON.stringify(body));
};

const sendFile = async (res, path) => {
    try {
        const data = await readFile(path);
        const ext = extname(path);
        const mime = { '.html': 'text/html; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.css': 'text/css' }[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': mime });
        res.end(data);
    } catch (e) {
        res.writeHead(404); res.end('not found');
    }
};

const readJson = (req) => new Promise((resolve, reject) => {
    let data = '';
    req.on('data', c => data += c);
    req.on('end', () => {
        try { resolve(data ? JSON.parse(data) : {}); } catch (e) { reject(e); }
    });
    req.on('error', reject);
});

// ─── Handlers ─────────────────────────────────────────────────
const routes = {
    'GET /api/plans': (_req, res) => send(res, 200, { plans: Object.values(PLANS) }),

    'GET /api/subscription/:id': (req, res, id) => {
        const sub = subscriptions.get(id);
        if (!sub) return send(res, 404, { error: 'not found' });
        send(res, 200, sub);
    },

    // ── Stripe Checkout ──
    'POST /api/checkout/stripe': async (req, res) => {
        if (!stripe) return send(res, 503, { error: 'Stripe no configurado. Set STRIPE_SECRET_KEY.' });
        const { plan_id, customer_email, success_url, cancel_url } = await readJson(req);
        const plan = PLANS[plan_id];
        if (!plan) return send(res, 400, { error: 'plan_id inválido' });
        try {
            const session = await stripe.checkout.sessions.create({
                mode: 'subscription',
                line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
                customer_email,
                success_url: success_url || `${PUBLIC_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: cancel_url || `${PUBLIC_URL}/cancel`,
                metadata: { plan_id, customer_email },
                subscription_data: { trial_period_days: 14 },
            });
            subscriptions.set(session.id, { id: session.id, plan_id, status: 'pending', email: customer_email, provider: 'stripe', created_at: new Date().toISOString() });
            send(res, 200, { url: session.url, session_id: session.id });
        } catch (e) { send(res, 500, { error: e.message }); }
    },

    'POST /api/webhook/stripe': async (req, res) => {
        if (!stripe) return send(res, 503, { error: 'not configured' });
        const sig = req.headers['stripe-signature'];
        const raw = await new Promise((resolve) => { let d=''; req.on('data', c=>d+=c); req.on('end', ()=>resolve(d)); });
        let event;
        try {
            event = stripe.webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET);
        } catch (e) { return send(res, 400, { error: `Webhook Error: ${e.message}` }); }

        if (event.type === 'checkout.session.completed') {
            const s = event.data.object;
            const sub = subscriptions.get(s.id) || { id: s.id, created_at: new Date().toISOString() };
            sub.status = 'active';
            sub.subscription_id = s.subscription;
            sub.email = s.customer_email || s.metadata?.customer_email;
            sub.plan_id = s.metadata?.plan_id;
            subscriptions.set(s.id, sub);
            console.log(`[stripe] subscription activated: ${s.id} → ${sub.plan_id}`);
        } else if (event.type === 'customer.subscription.deleted') {
            const s = event.data.object;
            for (const [k, v] of subscriptions) {
                if (v.subscription_id === s.id) { v.status = 'cancelled'; subscriptions.set(k, v); }
            }
        }
        send(res, 200, { received: true });
    },

    // ── MercadoPago Checkout ──
    'POST /api/checkout/mercadopago': async (req, res) => {
        if (!mp) return send(res, 503, { error: 'MercadoPago no configurado. Set MP_ACCESS_TOKEN.' });
        const { plan_id, customer_email } = await readJson(req);
        const plan = PLANS[plan_id];
        if (!plan) return send(res, 400, { error: 'plan_id inválido' });
        try {
            const pref = new mp.Preference({
                items: [{
                    title: `AzurTant PRO · ${plan.name}`,
                    quantity: 1,
                    currency_id: 'MXN',
                    unit_price: plan.price_mxn,
                }],
                payer: { email: customer_email },
                back_urls: {
                    success: `${PUBLIC_URL}/success`,
                    failure: `${PUBLIC_URL}/cancel`,
                    pending: `${PUBLIC_URL}/cancel`,
                },
                auto_return: 'approved',
                external_reference: plan_id,
            });
            const saved = await pref.save();
            subscriptions.set(saved.body.id, { id: saved.body.id, plan_id, status: 'pending', email: customer_email, provider: 'mercadopago', created_at: new Date().toISOString() });
            send(res, 200, { url: saved.body.init_point, id: saved.body.id });
        } catch (e) { send(res, 500, { error: e.message }); }
    },

    'POST /api/webhook/mercadopago': async (req, res) => {
        if (!mp) return send(res, 503, { error: 'not configured' });
        const body = await readJson(req).catch(() => ({}));
        if (body.type === 'payment' && body.data?.id) {
            try {
                const payment = await mp.payment.findById(body.data.id);
                const prefId = payment.body.external_reference || payment.body.preference_id;
                if (prefId && subscriptions.has(prefId)) {
                    const sub = subscriptions.get(prefId);
                    sub.status = payment.body.status === 'approved' ? 'active' : payment.body.status;
                    subscriptions.set(prefId, sub);
                    console.log(`[mp] payment ${body.data.id} → ${sub.status}`);
                }
            } catch (e) { console.error('mp webhook error', e); }
        }
        send(res, 200, { received: true });
    },
};

// ─── Server ───────────────────────────────────────────────────
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml' };

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    console.log(`${req.method} ${pathname}`);

    // Static files
    if (req.method === 'GET' && !pathname.startsWith('/api/')) {
        let p = pathname === '/' ? '/landing.html' : pathname;
        if (p === '/success' || p === '/cancel') p = `${p}.html`;
        return sendFile(res, join(ROOT, p));
    }

    // Routes
    for (const pattern of Object.keys(routes)) {
        const [method, path] = pattern.split(' ');
        if (method !== req.method) continue;
        const params = path.split('/').map(s => s.startsWith(':') ? url.pathname.split('/')[path.split('/').findIndex(p => p.startsWith(':'))] : s);
        const regex = new RegExp('^' + path.replace(/:[a-z_]+/g, '([^/]+)') + '$');
        const match = url.pathname.match(regex);
        if (match) return routes[pattern](req, res, ...match.slice(1));
    }
    send(res, 404, { error: 'ruta no encontrada', method: req.method, path: pathname });
});

server.listen(PORT, '127.0.0.1', () => {
    console.log(`\n🟢 AzurTant Billing Server`);
    console.log(`   http://127.0.0.1:${PORT}`);
    console.log(`   Stripe: ${stripe ? '✓' : '✗ (set STRIPE_SECRET_KEY)'}`);
    console.log(`   MercadoPago: ${mp ? '✓' : '✗ (set MP_ACCESS_TOKEN)'}`);
    console.log(`   Planes: ${Object.keys(PLANS).join(', ')}\n`);
});
