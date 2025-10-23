// src/public/app.js

// ==== kintone フィールドコード ====
const TABLE_CODE = 'subtable'; // サブテーブルのフィールドコード
const JAN_CODE   = 'jan';      // サブテーブル内: 文字列(1行)
const QTY_CODE   = 'qty';      // サブテーブル内: 数値
// ==================================

const form    = document.getElementById('form');
const tbody   = document.querySelector('#table tbody');
const janEl   = document.getElementById('jan');
const qtyEl   = document.getElementById('qty');
const sendBtn = document.getElementById('sendBtn');

// ===== 共通ユーティリティ =====
function toHalfWidth(s = ''){
  return s
    .replace(/[！-～]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
    .replace(/\u3000/g, ' ')
    .trim();
}

// 入力：数字のみ＆長さ自由（桁数制限なし）
function normalizeJanInput(){
  const raw = toHalfWidth(janEl.value);
  const digits = raw.replace(/\D/g, '');
  if (digits !== janEl.value) janEl.value = digits;
}
janEl?.addEventListener('input', normalizeJanInput);

// ===== 行追加（Enter/追加ボタン） =====
form.addEventListener('submit', (e) => {
  e.preventDefault();

  const jan = toHalfWidth(janEl.value).replace(/\D/g, ''); // 数字のみ
  const qty = Number(qtyEl.value);

  const janOk = /^\d+$/.test(jan);                  // 長さは不問（1桁以上）
  const qtyOk = Number.isInteger(qty) && qty > 0;   // 1以上の整数

  if (!janOk || !qtyOk) {
    alert('JANは数字のみ（桁数自由）、数量は1以上の整数で入力してください。');
    return;
  }

  const tr = document.createElement('tr');

  const tdJan = document.createElement('td');
  tdJan.textContent = jan;

  const tdQty = document.createElement('td');
  tdQty.textContent = String(qty);

  const tdDel = document.createElement('td');
  const btnDel = document.createElement('button');
  btnDel.type = 'button';
  btnDel.className = 'delete';
  btnDel.textContent = '削除';
  tdDel.appendChild(btnDel);

  tr.append(tdJan, tdQty, tdDel);
  tbody.prepend(tr);

  janEl.value = '';
  qtyEl.value = '';
  janEl.focus();
});

// ===== 行削除（イベント委譲） =====
tbody.addEventListener('click', (e) => {
  if (e.target.matches('button.delete')) {
    e.target.closest('tr')?.remove();
  }
});

// ===== 担当者（ローカル保存 & バナー表示/編集） =====
const OP_KEY = 'tanaoroshi.operatorName';
const loginSec     = document.getElementById('login');
const startBtn     = document.getElementById('startBtn');
const userNameEl   = document.getElementById('userName');
const operatorBanner = document.getElementById('operatorBanner');

function getOperator(){ return (localStorage.getItem(OP_KEY) || '').trim(); }
function setOperator(name){ localStorage.setItem(OP_KEY, String(name).trim()); }

function renderOperatorBanner() {
  const name = getOperator();
  operatorBanner.textContent = name ? `現在の担当者：${name}` : '現在の担当者：（未設定）';
  operatorBanner.hidden = false; // 常時表示
}

function startOperatorEdit() {
  if (!operatorBanner || operatorBanner.dataset.editing === 'true') return;

  const current = getOperator();
  operatorBanner.dataset.editing = 'true';

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'operator-edit';
  input.placeholder = '担当者名を入力';
  input.value = current;

  operatorBanner.innerHTML = '';
  operatorBanner.appendChild(input);
  requestAnimationFrame(() => { input.focus(); input.select(); });

  const finish = (commit) => {
    operatorBanner.dataset.editing = 'false';
    if (commit) {
      const v = (input.value || '').trim();
      if (!v) {
        alert('名前を入力してください。');
        operatorBanner.dataset.editing = 'true';
        input.focus();
        return;
      }
      setOperator(v);
    }
    renderOperatorBanner();
  };

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); finish(true); }
    else if (e.key === 'Escape') { e.preventDefault(); finish(false); }
  });
  input.addEventListener('blur', () => finish(true));
}

operatorBanner?.addEventListener('click', startOperatorEdit);

function showMainUI(){
  // ログインを隠し、メインUIを表示
  if (loginSec) loginSec.hidden = true;
  document.getElementById('form').style.visibility = 'visible';
  document.getElementById('table').style.visibility = 'visible';
  const bar = document.querySelector('.action-bar');
  if (bar) bar.style.visibility = 'visible';
  renderOperatorBanner();
}

// 初期表示：担当者未設定ならログインを出す
window.addEventListener('DOMContentLoaded', () => {
  const op = getOperator();
  if (!op && loginSec) {
    document.getElementById('form').style.visibility = 'hidden';
    document.getElementById('table').style.visibility = 'hidden';
    const bar = document.querySelector('.action-bar');
    if (bar) bar.style.visibility = 'hidden';
    loginSec.hidden = false;
    userNameEl?.focus();
  } else {
    showMainUI();
  }
});

// 開始（担当者保存→メイン表示）
startBtn?.addEventListener('click', () => {
  const name = (userNameEl?.value || '').trim();
  if (!name){
    alert('名前を入力してください。');
    userNameEl?.focus();
    return;
  }
  setOperator(name);
  showMainUI();
});

// ===== 送信：サブテーブル + 担当者 =====
sendBtn.addEventListener('click', async () => {
  const rows = Array.from(tbody.querySelectorAll('tr'));
  if (rows.length === 0) {
    alert('送信する行がありません。');
    return;
  }

  const tableRows = rows.map((tr) => {
    const [janCell, qtyCell] = tr.querySelectorAll('td');
    const jan = (janCell?.textContent || '').trim();
    const qty = Number((qtyCell?.textContent || '').trim());
    return {
      value: {
        [JAN_CODE]: { value: String(jan) },
        [QTY_CODE]: { value: String(qty) }
      }
    };
  });

  const op = getOperator(); // ★ 未定義対策：ここで取得
  const payload = {
    // app はサーバ(proxy)で .env の KINTONE_APP_ID を補完想定
    record: {
      [TABLE_CODE]: { value: tableRows },
      '担当者': { value: op || '' } // フィールドコード「担当者」（文字列1行想定）
    }
  };

  sendBtn.disabled = true; // 二重送信防止
  try {
    console.log('payload', JSON.stringify(payload, null, 2));
    const res = await fetch('/kintone/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      const msg = data?.message || data?.code || JSON.stringify(data);
      throw new Error(msg);
    }

    alert('送信成功');
    tbody.innerHTML = '';
    janEl.focus();
  } catch (err) {
    console.error(err);
    alert('送信失敗: ' + err.message);
  } finally {
    sendBtn.disabled = false;
  }
});

// ===== ページ内テンキー（数量 #qty 用） =====
(() => {
  const numpad = document.getElementById('numpad');
  const sheet  = numpad?.querySelector('.numpad__sheet');
  const qty    = document.getElementById('qty');
  if (!numpad || !qty) return;

  let activeInput = null;

  function openPad(input){
    activeInput = input;
    numpad.classList.add('is-open');
    numpad.setAttribute('aria-hidden','false');
  }
  function closePad(){
    numpad.classList.remove('is-open');
    numpad.setAttribute('aria-hidden','true');
    activeInput = null;
  }
  function insertText(t){
    if (!activeInput) return;
    const el = activeInput;
    const v = el.value;
    const start = el.selectionStart ?? v.length;
    const end   = el.selectionEnd ?? v.length;
    el.value = v.slice(0, start) + t + v.slice(end);
    const pos = start + t.length;
    el.setSelectionRange(pos, pos);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }
  function backspace(){
    if (!activeInput) return;
    const el = activeInput;
    const v = el.value;
    const start = el.selectionStart ?? v.length;
    const end   = el.selectionEnd ?? v.length;
    if (start === end && start > 0){
      el.value = v.slice(0, start - 1) + v.slice(end);
      const pos = start - 1;
      el.setSelectionRange(pos, pos);
    } else {
      el.value = v.slice(0, start) + v.slice(end);
      el.setSelectionRange(start, start);
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }

  qty.addEventListener('focus', () => openPad(qty));
  qty.addEventListener('click', () => openPad(qty));

  numpad.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    const key = btn.dataset.key;
    const act = btn.dataset.action;
    if (key) insertText(key);
    else if (act === 'backspace') backspace();
    else if (act === 'clear') {
      if (activeInput) {
        activeInput.value = '';
        activeInput.dispatchEvent(new Event('input',{bubbles:true}));
      }
    }
    else if (act === 'done') closePad();
  });

  document.addEventListener('click', (e) => {
    if (!numpad.classList.contains('is-open')) return;
    if (sheet.contains(e.target) || e.target === qty) return;
    closePad();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && numpad.classList.contains('is-open')) closePad();
  });
})();

// ===== 送信バー高さの反映 =====
function syncActionBarSpace() {
  const bar = document.querySelector('.action-bar');
  const h = bar ? bar.offsetHeight : 0;
  document.documentElement.style.setProperty('--action-bar-space', `${h}px`);
}
window.addEventListener('load', syncActionBarSpace);
window.addEventListener('resize', syncActionBarSpace);
