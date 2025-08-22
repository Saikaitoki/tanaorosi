/* 簡易送信とテーブル追加の例 */
document.getElementById('form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const jan = document.getElementById('jan').value.trim();
  const qty = Number(document.getElementById('qty').value);


  if (!jan || qty <= 0) return alert('JAN と数量を正しく入力してください。');

  const tbody = document.querySelector('#table tbody');
  const tr = document.createElement('tr');
  tr.innerHTML = `<td>${jan}</td><td>${qty}</td><td><button onclick ="del(this)">削除</button></td>`;
  tbody.appendChild(tr);
  document.getElementById('jan').value ='';
  document.getElementById('qty').value = '';

  document.getElementById('jan').focus();

});

async function send() {
  try {
    const res = await fetch('/kintone/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ record: { JAN: { value: jan }, 数量: { value: qty } } })
    });
    if (!res.ok) throw new Error(await res.text());
    alert('送信成功');
  } catch (err) {
    console.error(err);
    alert('送信失敗: ' + err.message);
  }
}

function del(button) {
  const row = button.closest('tr');
  row.parentNode.removeChild(row);
}

 function add() {
tr.innerHTML = `<td>${jan}</td><td>${qty}</td><td><button onclick="del(this)">削除</button></td>`;
  document.getElementById('jan').value = '';   
document.getElementById("qty").value = '';
}