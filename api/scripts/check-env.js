#!/usr/bin/env node
/*
 * Pre-flight check run on Render before `prisma migrate deploy`.
 * Prints ONLY variable names and the problem found, never the values.
 * Locally it reads api/.env if dotenv is installed.
 */
try {
  require('dotenv').config({ quiet: true });
} catch {
  /* dotenv not installed: rely on the real environment */
}

const problems = [];
const warn = [];

function checkDbUrl(key, { pooled }) {
  const raw = process.env[key];
  if (!raw) return problems.push(`${key} is missing. Add it in Render > Environment.`);
  if (raw !== raw.trim()) problems.push(`${key} has a space or line break at the start or end. Remove it.`);
  if (/^["']|["']$/.test(raw.trim())) problems.push(`${key} is wrapped in quote marks. Remove the quotes.`);
  let url;
  try {
    url = new URL(raw.trim().replace(/^["']|["']$/g, ''));
  } catch {
    return problems.push(`${key} is not a valid URL. Copy it again from Neon > Connect.`);
  }
  if (!/^postgres(ql)?:$/.test(url.protocol)) problems.push(`${key} must start with postgresql://`);
  if (!url.password) problems.push(`${key} has no password in it. In Neon > Connect, click "Show password" before copying.`);
  if (url.searchParams.get('sslmode') !== 'require') problems.push(`${key} must contain ?sslmode=require`);
  const isPooler = url.hostname.includes('-pooler');
  if (pooled && !isPooler) warn.push(`${key} is not the pooled address (host has no "-pooler"). It works, but the pooled one is recommended.`);
  if (!pooled && isPooler) problems.push(`${key} must be the DIRECT address: turn OFF "Connection pooling" in Neon > Connect (host must NOT contain "-pooler").`);
  if (!url.searchParams.get('connect_timeout')) warn.push(`${key}: add &connect_timeout=15 at the end so a sleeping Neon database has time to wake.`);
}

checkDbUrl('DATABASE_URL', { pooled: true });
checkDbUrl('DIRECT_URL', { pooled: false });

if (!process.env.JWT_SECRET) problems.push('JWT_SECRET is missing.');
else if (process.env.JWT_SECRET.length < 32) warn.push('JWT_SECRET is short; use at least 32 random characters.');

for (const k of ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']) {
  if (!process.env[k]) warn.push(`${k} is missing: photo uploads on the Sell page will fail.`);
}
const wa = process.env.WHATSAPP_NUMBER;
if (!wa) warn.push('WHATSAPP_NUMBER is missing.');
else if (!/^234\d{10}$/.test(wa)) warn.push('WHATSAPP_NUMBER should be digits only like 2348012345678 (no +, spaces or quotes).');
if (!process.env.WEB_ORIGIN) warn.push('WEB_ORIGIN is missing: the website will be blocked by CORS. Set it to your Vercel address.');
else if (/\/$/.test(process.env.WEB_ORIGIN.trim())) warn.push('WEB_ORIGIN must not end with "/".');

for (const w of warn) console.warn(`[check-env] WARNING: ${w}`);
if (problems.length) {
  for (const p of problems) console.error(`[check-env] ERROR: ${p}`);
  console.error('[check-env] Fix the values above in Render > dammyrex-api > Environment, then Manual Deploy.');
  process.exit(1);
}
console.log('[check-env] Environment looks good.');
