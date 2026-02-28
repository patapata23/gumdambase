(function() {
  const TARGET_TIME = '12:00～12:30';
  const RETRY_INTERVAL = 1000; // 1秒
  const MAX_DURATION = 600000; // 10分
  
  // 遷移先ページの自動処理
  if (localStorage.getItem('autoClickNext') === 'true') {
    localStorage.removeItem('autoClickNext');
    console.log('遷移先ページ: 自動クリック開始');
    
    // ページが完全に読み込まれるまで待機
    const waitAndClick = (attempts = 0) => {
      if (attempts > 10) {
        console.log('遷移先: ボタンが見つかりませんでした（タイムアウト）');
        return;
      }
      
      setTimeout(() => {
        // 「申し込みをする」ボタンを探す（複数の方法で検索）
        let targetButton = null;
        
        // 方法1: テキストで直接検索
        targetButton = Array.from(document.querySelectorAll('button')).find(btn => 
          btn.textContent.trim() === '申し込みをする' && !btn.disabled
        );
        
        // 方法2: 部分一致で検索
        if (!targetButton) {
          targetButton = Array.from(document.querySelectorAll('button')).find(btn => 
            btn.textContent.includes('申し込み') && !btn.disabled
          );
        }
        
        // 方法3: クラス名で検索（bg-primaryを持つボタン）
        if (!targetButton) {
          targetButton = Array.from(document.querySelectorAll('button.bg-primary')).find(btn => 
            !btn.disabled
          );
        }
        
        // 方法4: type="submit"のボタン
        if (!targetButton) {
          targetButton = document.querySelector('button[type="submit"]:not([disabled])');
        }
        
        if (targetButton) {
          console.log('遷移先ボタンクリック:', targetButton.textContent.trim());
          targetButton.click();
        } else {
          console.log(`遷移先: ボタン検索中... (${attempts + 1}/10)`);
          // 見つからなかった場合、もう一度試す
          waitAndClick(attempts + 1);
        }
      }, 800);
    };
    
    waitAndClick();
    return; // 遷移先では以降の処理を実行しない
  }
  
  // 最初のページ: リトライ処理
  console.log('予約自動化: 開始');
  
  let retryCount = 0;
  const retryInterval = setInterval(() => {
    retryCount++;
    console.log(`リトライ実行: ${retryCount}回目`);
    
    // リロードボタンをクリック
    const reloadButton = document.querySelector('button svg.lucide-refresh-ccw');
    if (reloadButton && reloadButton.parentElement) {
      reloadButton.parentElement.click();
    }
    
    setTimeout(() => {
      // 目標時間帯のボタンを探す
      const targetButton = Array.from(document.querySelectorAll('button'))
        .find(btn => btn.textContent.includes(TARGET_TIME));
      
      if (!targetButton) {
        console.log('時間帯ボタンが見つかりません');
        return;
      }
      
      // クリック可能かチェック
      const isClickable = (btn) => {
        if (!btn || btn.disabled) return false;
        const style = window.getComputedStyle(btn);
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               style.pointerEvents !== 'none';
      };
      
      // ×マークがついていないかチェックしてクリック
      const tryClick = (btn) => {
        if (!isClickable(btn)) return false;
        if (btn.textContent.trim().startsWith('×')) return false;
        btn.click();
        return true;
      };
      
      let clicked = false;
      
      // 目標時間帯をクリック試行
      if (tryClick(targetButton)) {
        clicked = true;
        console.log(`${TARGET_TIME} をクリック`);
      } else {
        // 次の時間帯を探す
        const parentElement = targetButton.parentElement;
        if (parentElement) {
          const allButtons = Array.from(parentElement.querySelectorAll('button'));
          const startIndex = allButtons.indexOf(targetButton);
          
          for (let i = startIndex + 1; i < allButtons.length; i++) {
            if (tryClick(allButtons[i])) {
              clicked = true;
              console.log(`代替時間帯をクリック: ${allButtons[i].textContent.trim()}`);
              break;
            }
          }
        }
      }
      
      // クリックできたら確認ボタンを押す
      if (clicked) {
        setTimeout(() => {
          const confirmButton = Array.from(document.querySelectorAll('button'))
            .find(btn => btn.textContent.includes('確認する'));
          
          if (confirmButton) {
            console.log('確認ボタンをクリック');
            // 遷移先での自動クリックフラグを設定
            localStorage.setItem('autoClickNext', 'true');
            confirmButton.click();
            clearInterval(retryInterval);
            console.log('予約処理完了 - 遷移先で自動実行します');
          }
        }, 380);
      } else {
        console.log('クリック可能な時間帯がありません');
      }
    }, 200);
    
  }, RETRY_INTERVAL);
  
  // 最大実行時間で停止
  setTimeout(() => {
    clearInterval(retryInterval);
    console.log('最大実行時間に達しました。リトライを停止します。');
  }, MAX_DURATION);
  
})();