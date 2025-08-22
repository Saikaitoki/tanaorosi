const express = require('express');
const path = require('path');
const proxyHandler = require('./proxy');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(require('cors')());

// 静的ファイルを src/public から配信
app.use('/', express.static(path.join(__dirname, '../public')));

// kintone へ転送するエンドポイント
app.post('/kintone/record', proxyHandler);

app.listen(PORT, () => {
    console.log(`サーバー起動: http://localhost:${PORT}`);
});