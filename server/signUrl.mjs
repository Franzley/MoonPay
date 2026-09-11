// Signing Server for MoonPay Widget Integration
//
// Two endpoints:
// 1. /sign-url    — HMAC-SHA256 signs a widget URL's query string with your secret key.
// 2. /get-ip-hash — Captures the customer's real public IP on THIS request, canonicalizes it
//                   per MoonPay's rules, and HMAC-SHA256 hashes it. The frontend embeds this
//                   hash into the widget URL as `allowedIpAddress` BEFORE calling /sign-url,
//                   so the signature covers it automatically.
//
// USAGE:
//   cp .env.example .env   # Fill in your MOONPAY_SECRET_KEY
//   npm install
//   npm start

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';

const app = express();
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'];
app.use(cors({ origin: allowedOrigins }));

const secretKey = process.env.MOONPAY_SECRET_KEY;
if (!secretKey) {
  console.error('MOONPAY_SECRET_KEY is not set. Copy .env.example to .env and fill in your key.');
  process.exit(1);
}

// ---- URL signing ----

const generateSignature = (url) => {
  return crypto
    .createHmac('sha256', secretKey)
    .update(new URL(url).search)
    .digest('base64');
};

app.get('/sign-url', (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  try {
    const signature = generateSignature(url);
    res.json({ signature });
  } catch (error) {
    console.error('Error generating signature:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---- IP hashing ----
// Follows MoonPay's canonicalization rules:
// - Prefer True-Client-IP header over other proxy headers or raw socket address.
// - Strip brackets/port from IPv6.
// - Unmap IPv4-mapped IPv6 (::ffff:a.b.c.d -> a.b.c.d).
// - Lowercase IPv6.

function canonicalizeIp(rawIp) {
  if (!rawIp) return null;
  let ip = rawIp.trim().toLowerCase();

  const bracketMatch = ip.match(/^\[(.+)\]:\d+$/);
  if (bracketMatch) {
    ip = bracketMatch[1];
  }

  const mappedMatch = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mappedMatch) {
    ip = mappedMatch[1];
  }

  return ip;
}

function getClientIp(req) {
  const trueClientIp = req.headers['true-client-ip'];
  const raw = trueClientIp || req.socket.remoteAddress;
  return canonicalizeIp(raw);
}

app.get('/get-ip-hash', (req, res) => {
  const ip = getClientIp(req);
  if (!ip) {
    return res.status(400).json({ error: 'Could not determine client IP' });
  }
  try {
    const ipHash = crypto.createHmac('sha256', secretKey).update(ip).digest('base64');
    res.json({ ipHash, observedIp: ip }); // observedIp is for debugging only — remove before production
  } catch (error) {
    console.error('Error generating IP hash:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Signing server running on port ${PORT}`);
});