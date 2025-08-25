### 環境変数（例）
KINTONE_DOMAIN=example           # 例: example / example.kintone.com / https://example.kintone.com
KINTONE_API_TOKEN=xxx
KINTONE_APP_ID=123

### 起動
npm install
npm run dev   # or npm start

### 送信仕様
フロントの「送信」ボタンはテーブル全行をまとめて POST します。
- エンドポイント: POST /kintone/records
- ボディ: { records: [ { JAN: { value }, 数量: { value } }, ... ] }
- サーバ側で .env の KINTONE_APP_ID を自動補完して kintone へ転送します。
