// src/server/proxy.js
const express = require('express');
const fetch = require('node-fetch'); // Node18なら globalThis.fetch でもOK

// ---- util ----
function normalizeBaseDomain(domainRaw) {
  if (!domainRaw) return null;
  if (domainRaw.startsWith('http')) return domainRaw.replace(/\/$/, '');
  return `https://${domainRaw.includes('.') ? domainRaw : `${domainRaw}.cybozu.com`}`;
}
function apiPath(guest, p) { return guest ? `/k/guest/${guest}${p}` : p; }
function qstr(s) { return String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"'); }

/* =================== 1) レコード作成プロキシ =================== */
// POST /kintone/record
async function proxyHandler(req, res) {
  try {
    const { app, record, records } = req.body;

    const base  = normalizeBaseDomain(process.env.KINTONE_DOMAIN);
    const token = process.env.KINTONE_API_TOKEN;
    const appId = Number(app || process.env.KINTONE_APP_ID);

    if (!base || !token || !appId) {
      return res.status(400).json({
        error: 'KINTONE_DOMAIN / KINTONE_API_TOKEN / KINTONE_APP_ID の設定を確認してください。'
      });
    }

    const isBatch  = Array.isArray(records);
    const endpoint = isBatch ? '/k/v1/records.json' : '/k/v1/record.json';
    const payload  = isBatch ? { app: appId, records } : { app: appId, record };

    const r = await fetch(`${base}${endpoint}`, {
      method: 'POST',
      headers: { 'X-Cybozu-API-Token': token, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const json = await r.json();
    return res.status(r.status).json(json);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

/* =================== 2) JAN→商品名 ルックアップ =================== */
// GET /kintone/lookup?jan=xxxx
const router = express.Router();

const DOMAIN = normalizeBaseDomain(process.env.KINTONE_DOMAIN);
const GUEST  = process.env.KINTONE_GUEST_SPACE_ID || '';

const MASTER_APP_ID  = process.env.KINTONE_MASTER_APP_ID;
const MASTER_TOKEN   = process.env.KINTONE_MASTER_API_TOKEN;

// マスタ側 フィールドコード（必要に応じ .env で上書き）
const MASTER_JAN_CODE  = process.env.KINTONE_MASTER_JAN_CODE  || 'JAN';
const MASTER_NAME_CODE = process.env.KINTONE_MASTER_NAME_CODE || '商品名';

router.get('/lookup', async (req, res) => {
  try {
    const jan = String(req.query.jan || '').trim();
    if (!jan) return res.status(400).json({ ok:false, error:'jan required' });
    if (!DOMAIN || !MASTER_APP_ID || !MASTER_TOKEN) {
      return res.status(500).json({ ok:false, error:'master env not set' });
    }

    const url = new URL(`${DOMAIN}${apiPath(GUEST, '/k/v1/records.json')}`);
    url.searchParams.set('app', MASTER_APP_ID);
    url.searchParams.set('query', `${MASTER_JAN_CODE} = "${qstr(jan)}" limit 1`);
    url.searchParams.append('fields[0]', MASTER_NAME_CODE);
    url.searchParams.append('fields[1]', MASTER_JAN_CODE);

    const r = await fetch(url.toString(), { headers: { 'X-Cybozu-API-Token': MASTER_TOKEN } });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ ok:false, error: data?.message || data });

    const rec  = (data.records || [])[0];
    const name = rec?.[MASTER_NAME_CODE]?.value || '';
    return res.json({ ok:true, name, record: rec || null });
  } catch (e) {
    return res.status(500).json({ ok:false, error:String(e?.message || e) });
  }
});

module.exports = { proxyHandler, kintoneRouter: router };
