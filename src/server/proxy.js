const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

app.post('/kintone/record', async (req, res) => {
    const { app, record } = req.body;

    const KINTONE_DOMAIN = process.env.KINTONE_DOMAIN; // 例: yoursubdomain.cybozu.com の "yoursubdomain" だけでも、完全ドメインでも可
    const KINTONE_API_TOKEN = process.env.KINTONE_API_TOKEN;
    const KINTONE_APP_ID = process.env.KINTONE_APP_ID; // 必要なら

    if (!KINTONE_DOMAIN || !KINTONE_API_TOKEN || !app) {
        return res.status(500).json({ error: 'KINTONE_DOMAIN, KINTONE_API_TOKEN, KINTONE_APP_ID の設定を確認してください。' });
    }

    try {
        const url = `https://${KINTONE_DOMAIN}.kintone.com/k/v1/record.json`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'X-Cybozu-API-Token': KINTONE_API_TOKEN,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ app, record })
        });
        const data = await response.json();
        return res.status(response.status).json(data);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Proxy server is running on http://localhost:${PORT}`);
});