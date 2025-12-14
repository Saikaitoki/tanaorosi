// src/server/index.js
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const express = require('express');
const { proxyHandler, kintoneRouter } = require('./proxy');



const app = express();
app.use(express.json());

// 静的配信（/ → src/public）
const staticPath = path.join(__dirname, '..', 'client', 'dist');
console.log('Static Path:', staticPath);
try {
  const fs = require('fs');
  if (fs.existsSync(staticPath)) {
    console.log('Files in static path:', fs.readdirSync(staticPath));
  } else {
    console.log('Static path DOES NOT EXIST!');
  }
} catch (e) {
  console.error('Error checking static path:', e);
}
app.use('/', express.static(staticPath));

// ルックアップAPIを /kintone にマウント
app.use('/kintone', kintoneRouter);

// レコード作成プロキシ
app.post('/kintone/record', proxyHandler);

// ヘルスチェック
app.get('/healthz', (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`listening on http://localhost:${PORT}`));

// src/server/index.js
app.get('/debug/env', (_req, res) => {
  res.json({
    KINTONE_DOMAIN: process.env.KINTONE_DOMAIN,
    KINTONE_MASTER_APP_ID: process.env.KINTONE_MASTER_APP_ID,
    HAS_MASTER_TOKEN: Boolean(process.env.KINTONE_MASTER_API_TOKEN)
  });
});
