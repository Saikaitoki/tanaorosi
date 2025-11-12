// src/public/app.js

// ==== kintone フィールドコード ====
// サブテーブル
const TABLE_CODE = 'subtable';
const JAN_CODE   = 'JAN';        // 文字列(1行)
const QTY_CODE   = 'qty';        // 数値
const NAME_CODE  = '商品名';     // ★ サブテーブルの「商品名」（文字列1行）に送る
// ==================================

const form    = document.getElementById('form');
const tbody   = document.querySelector('#table tbody');
const janEl   = document.getElementById('jan');
const qtyEl   = document.getElementById('qty');
const sendBtn = document.getElementById('sendBtn');

// ===== 共通: 全角→半角 =====
function toHalfWidth(s = ''){
  return s.replace(/[！-～]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
          .replace(/\u3000/g, ' ')
          .trim();
}

// ===== ルックアップ（JAN→商品名） =====
const lookupCache = new Map(); // jan -> { name, at }
const LOOKUP_TTL_MS = 5 * 60 * 1000;

let janHintEl = null;
function ensureJanHint(){
  if (janHintEl) return janHintEl;
  janHintEl = document.createElement('div');
  janHintEl.className = 'field-msg';
  janEl.insertAdjacentElement('afterend', janHintEl);
  return janHintEl;
}

async function lookupByJan(jan){
  const now = Date.now();
  const hit = lookupCache.get(jan);
  if (hit && (now - hit.at) < LOOKUP_TTL_MS) return hit;

  const r = await fetch(`/kintone/lookup?jan=${encodeURIComponent(jan)}`);
  const data = await r.json();
  if (!r.ok || !data.ok) {
    const val = { name: '', at: now, error: data?.error || 'lookup failed' };
    lookupCache.set(jan, val);
    return val;
  }
  const val = { name: data.name || '', at: now };
  lookupCache.set(jan, val);
  return val;
}

async function updateJanPreview(){
  const jan = toHalfWidth(janEl.value).replace(/\D/g, '');
  ensureJanHint();
  if (!jan) { janHintEl.textContent = ''; return; }
  janHintEl.textContent = '検索中…';
  try {
    const { name, error } = await lookupByJan(jan);
    if (error) janHintEl.textContent = '該当商品なし';
    else janHintEl.textContent = name ? `商品名：${name}` : '該当商品なし';
  } catch {
    janHintEl.textContent = 'エラー';
  }
}

// ===== 入力正規化（桁数自由・数字のみ） =====
function normalizeJanInput(){
  const raw = toHalfWidth(janEl.value);
  const digits = raw.replace(/\D/g, '');
  if (digits !== janEl.value) janEl.value = digits;
}
janEl?.addEventListener('input', () => { normalizeJanInput(); updateJanPreview(); });
janEl?.addEventListener('blur', updateJanPreview);

// ===== 行追加（ルックアップ込み、失敗しても続行） =====
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const jan = toHalfWidth(janEl.value).replace(/\D/g, '');
  const qty = Number(qtyEl.value);

  const janOk = /^\d+$/.test(jan);
  const qtyOk = Number.isInteger(qty) && qty > 0;
  if (!janOk || !qtyOk) {
    alert('JANは数字のみ（桁数自由）、数量は1以上の整数で入力してください。');
    return;
  }

  // 商品名は取得できなくても追加を続行
  let name = '';
  try {
    const res = await lookupByJan(jan);
    name = res?.name || '';
  } catch (_) {
    name = '';
  }

  const tr = document.createElement('tr');

  // --- JANセル：上段にJAN、下段に「商品名」入力欄（編集可能） ---
  const tdJan = document.createElement('td');

  const janMain = document.createElement('div');
  janMain.textContent = jan;

  const nameInput = document.createElement('input'); // ★ 編集可能
  nameInput.type = 'text';
  nameInput.className = 'name-input';
  nameInput.placeholder = '商品名…';
  nameInput.value = name || '';
  nameInput.autocomplete = 'off';

  tdJan.append(janMain, nameInput);

  // --- 数量 ---
  const tdQty = document.createElement('td');
  tdQty.textContent = String(qty);

  // --- 削除 ---
  const tdDel = document.createElement('td');
  const btnDel = document.createElement('button');
  btnDel.type = 'button';
  btnDel.className = 'delete';
  btnDel.textContent = '削除';
  tdDel.appendChild(btnDel);

  // 送信時に拾いやすいようJANだけ持たせる（商品名は入力から拾う）
  tr.dataset.jan = jan;

  tr.append(tdJan, tdQty, tdDel);
  tbody.prepend(tr);

  // 入力欄クリア
  janEl.value = '';
  qtyEl.value = '';
  if (janHintEl) janHintEl.textContent = '';
  janEl.focus();
});

// ===== 行削除 =====
tbody.addEventListener('click', (e) => {
  if (e.target.matches('button.delete')) {
    e.target.closest('tr')?.remove();
  }
});

// ===== 担当者（ローカル保存 & バナー） =====
const OP_KEY = 'tanaoroshi.operatorName';
const loginSec       = document.getElementById('login');
const startBtn       = document.getElementById('startBtn');
const userNameEl     = document.getElementById('userName');
const operatorBanner = document.getElementById('operatorBanner');

function getOperator(){ return (localStorage.getItem(OP_KEY) || '').trim(); }
function setOperator(name){ localStorage.setItem(OP_KEY, String(name).trim()); }

function renderOperatorBanner() {
  const name = getOperator();
  operatorBanner.textContent = name ? `現在の担当者：${name}` : '現在の担当者：（未設定）';
  operatorBanner.hidden = false;
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
      if (!v) { alert('名前を入力してください。'); operatorBanner.dataset.editing = 'true'; input.focus(); return; }
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
  if (loginSec) loginSec.hidden = true;
  document.getElementById('form').style.visibility = 'visible';
  document.getElementById('table').style.visibility = 'visible';
  const bar = document.querySelector('.action-bar');
  if (bar) bar.style.visibility = 'visible';
  renderOperatorBanner();
}

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

startBtn?.addEventListener('click', () => {
  const name = (userNameEl?.value || '').trim();
  if (!name){ alert('名前を入力してください。'); userNameEl?.focus(); return; }
  setOperator(name);
  showMainUI();
});

// ===== 送信（サブテーブル + 担当者 + 商品名） =====
sendBtn.addEventListener('click', async () => {
  const rows = Array.from(tbody.querySelectorAll('tr'));
  if (rows.length === 0) { alert('送信する行がありません。'); return; }

  const tableRows = rows.map((tr) => {
    const jan = tr.dataset.jan || (tr.querySelector('td:nth-child(1) div')?.textContent || '').trim();
    const qty = Number((tr.querySelectorAll('td')[1]?.textContent || '').trim());
    const name = (tr.querySelector('.name-input')?.value || '').trim(); // ★ 編集された商品名を取得

    const obj = {
      value: {
        [JAN_CODE]:  { value: String(jan) },
        [QTY_CODE]:  { value: String(qty) },
        [NAME_CODE]: { value: name }              // ★ サブテーブル「商品名」に送る
      }
    };
    return obj;
  });

  const op = getOperator();
  const payload = {
    record: {
      [TABLE_CODE]: { value: tableRows },
      '担当者': { value: op || '' }
    }
  };

  sendBtn.disabled = true;
  try {
    console.log('payload', JSON.stringify(payload, null, 2));
    const res = await fetch('/kintone/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || data?.code || JSON.stringify(data));
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

// ===== 送信バー高さの反映 =====
function syncActionBarSpace() {
  const bar = document.querySelector('.action-bar');
  const h = bar ? bar.offsetHeight : 0;
  document.documentElement.style.setProperty('--action-bar-space', `${h}px`);
}
window.addEventListener('load', syncActionBarSpace);
window.addEventListener('resize', syncActionBarSpace);

// ===== テンキー（数量 #qty 用） =====
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

  // number型でも動くようにフォールバック
  function insertText(t){
    if (!activeInput) return;
    const el = activeInput;
    const v = el.value ?? '';

    if (el.type === 'number' || typeof el.setSelectionRange !== 'function') {
      el.value = v + t; // number は末尾追記
    } else {
      const start = el.selectionStart ?? v.length;
      const end   = el.selectionEnd ?? v.length;
      el.value = v.slice(0, start) + t + v.slice(end);
      const pos = start + t.length;
      try { el.setSelectionRange(pos, pos); } catch {}
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function backspace(){
    if (!activeInput) return;
    const el = activeInput;
    const v = el.value ?? '';

    if (el.type === 'number' || typeof el.setSelectionRange !== 'function') {
      el.value = v.slice(0, -1); // number は末尾1文字削除
    } else {
      const start = el.selectionStart ?? v.length;
      const end   = el.selectionEnd ?? v.length;
      if (start === end && start > 0){
        el.value = v.slice(0, start - 1) + v.slice(end);
        const pos = start - 1;
        try { el.setSelectionRange(pos, pos); } catch {}
      } else {
        el.value = v.slice(0, start) + v.slice(end);
        try { el.setSelectionRange(start, start); } catch {}
      }
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
    else if (act === 'clear') { if (activeInput) { activeInput.value = ''; activeInput.dispatchEvent(new Event('input',{bubbles:true})); } }
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
