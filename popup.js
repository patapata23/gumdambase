// 時間帯リスト
const TIME_SLOTS = [
  '10:00～10:30', '10:30～11:00', '11:00～11:30', '11:30～12:00',
  '12:00～12:30', '12:30～13:00', '13:00～13:30', '13:30～14:00',
  '14:00～14:30', '14:30～15:00', '15:00～15:30', '15:30～16:00',
  '16:00～16:30', '16:30～17:00', '17:00～17:30', '17:30～18:00',
  '18:00～18:30', '18:30～19:00', '19:00～19:30', '19:30～20:00',
  '20:00～20:30'
];

// デフォルト設定
const DEFAULT_SETTINGS = {
  targetTimes: ['12:00～12:30'],
  retryInterval: 1,
  maxDuration: 3
};

// 設定を読み込み
function loadSettings() {
  chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
    // 時間帯チェックボックスを生成
    const timeSlotsContainer = document.getElementById('timeSlots');
    timeSlotsContainer.innerHTML = '';

    TIME_SLOTS.forEach((slot, index) => {
      const div = document.createElement('div');
      div.className = 'time-slot';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `slot-${index}`;
      checkbox.value = slot;
      checkbox.checked = settings.targetTimes.includes(slot);

      const label = document.createElement('label');
      label.htmlFor = `slot-${index}`;
      label.textContent = slot;

      div.appendChild(checkbox);
      div.appendChild(label);
      div.onclick = (e) => {
        if (e.target !== checkbox) {
          checkbox.checked = !checkbox.checked;
        }
      };

      timeSlotsContainer.appendChild(div);
    });

    // その他の設定
    document.getElementById('retryInterval').value = settings.retryInterval;
    document.getElementById('maxDuration').value = settings.maxDuration;
  });
}

// 設定を保存
function saveSettings() {
  const selectedTimes = Array.from(document.querySelectorAll('#timeSlots input[type="checkbox"]:checked'))
    .map(cb => cb.value);

  if (selectedTimes.length === 0) {
    showStatus('少なくとも1つの時間帯を選択してください', false);
    return;
  }

  const settings = {
    targetTimes: selectedTimes,
    retryInterval: parseFloat(document.getElementById('retryInterval').value),
    maxDuration: parseInt(document.getElementById('maxDuration').value)
  };

  chrome.storage.sync.set(settings, () => {
    showStatus('設定を保存しました ✓', true);
  });
}

// リセット
function resetSettings() {
  if (confirm('設定をデフォルトに戻しますか？')) {
    chrome.storage.sync.set(DEFAULT_SETTINGS, () => {
      loadSettings();
      showStatus('設定をリセットしました', true);
    });
  }
}

// ステータス表示
function showStatus(message, isSuccess) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = isSuccess ? 'status success' : 'status';

  setTimeout(() => {
    status.style.display = 'none';
  }, 3000);
}

// 手動実行
function runNow() {
  const runBtn = document.getElementById('runNowBtn');
  runBtn.disabled = true;
  runBtn.textContent = '実行中...';

  // アクティブなタブを取得
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (tabs[0]) {
      const url = tabs[0].url;

      // 予約ページかチェック
      if (!url.includes('gundam-base-entry.net')) {
        showStatus('⚠️ 予約ページで実行してください', false);
        runBtn.disabled = false;
        runBtn.textContent = '▶️ 今すぐ実行';
        return;
      }

      // content scriptにメッセージ送信
      chrome.tabs.sendMessage(tabs[0].id, {action: 'runNow'}, (response) => {
        if (chrome.runtime.lastError) {
          showStatus('⚠️ ページをリロードしてください', false);
        } else {
          showStatus('✅ 実行を開始しました！', true);
        }

        runBtn.disabled = false;
        runBtn.textContent = '▶️ 今すぐ実行';
      });
    }
  });
}

// イベントリスナー
document.getElementById('saveBtn').addEventListener('click', saveSettings);
document.getElementById('resetBtn').addEventListener('click', resetSettings);

document.getElementById('runNowBtn').addEventListener('click', runNow);

// 初期化
loadSettings();