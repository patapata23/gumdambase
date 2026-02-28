(function() {
  console.log('========================================');
  console.log('🔧 スクリプト実行開始');
  console.log('📍 URL:', location.href);
  console.log('⏰ 時刻:', new Date().toLocaleTimeString());
  console.log('========================================');

  // デフォルト設定
  const DEFAULT_SETTINGS = {
    targetTimes: ['12:00～12:30'],
    retryInterval: 1,
    maxDuration: 3
  };

  // 設定を読み込んで実行
  chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
    console.log('📋 読み込まれた設定:', settings);

    const TARGET_TIMES = settings.targetTimes;
    const RETRY_INTERVAL = settings.retryInterval * 1000; // 秒→ミリ秒
    const MAX_DURATION = settings.maxDuration * 60 * 1000; // 分→ミリ秒

    const currentUrl = location.href;
    const isEntryPage = currentUrl.includes('/entry');
    const isConfirmPage = currentUrl.includes('/confirm');

    console.log('📄 ページ判定:', { isEntryPage, isConfirmPage });
    console.log('🎯 優先時間帯:', TARGET_TIMES);

    // /confirm ページの処理
    if (isConfirmPage) {
      console.log('!!! ✅ 確認ページ（/confirm）を検出 !!!');

      let attempts = 0;
      const maxAttempts = 5;

      const confirmInterval = setInterval(() => {
        attempts++;
        console.log(`🔄 申し込みボタン検索: ${attempts}/${maxAttempts}回目`);

        const allButtons = Array.from(document.querySelectorAll('button'));
        console.log(`🔍 ボタン数: ${allButtons.length}`);

        if (attempts === 1 && allButtons.length > 0) {
          allButtons.forEach((btn, i) => {
            console.log(`  [${i}] "${btn.textContent.trim().substring(0, 30)}" | disabled: ${btn.disabled}`);
          });
        }

        const target = allButtons.find(btn =>
          (btn.textContent.includes('申し込み') || btn.classList.contains('bg-primary')) && !btn.disabled
        );

        if (target) {
          clearInterval(confirmInterval);
          console.log('🎉 ボタン発見:', target.textContent.trim());
          target.click();
          console.log('✅ クリック完了');
          return;
        }

        if (attempts >= maxAttempts) {
          clearInterval(confirmInterval);
          console.log('⚠️ 最大リトライ到達');
        }
      }, 200);

      return;
    }

    // /entry ページの処理
    if (isEntryPage) {
      console.log('>>> ✅ エントリーページ（/entry）を検出 <<<');

      let retryCount = 0;

      // URLの変化を監視
      let lastUrl = location.href;
      const urlCheckInterval = setInterval(() => {
        if (location.href !== lastUrl) {
          console.log('🔄 URL変化を検知:', location.href);
          lastUrl = location.href;

          if (location.href.includes('/confirm')) {
            console.log('>>> /confirm へ遷移しました！');
            clearInterval(urlCheckInterval);
            clearInterval(retryInterval);

            setTimeout(() => {
              console.log('🔍 申し込みボタンを探します...');

              let confirmAttempts = 0;
              const confirmInterval = setInterval(() => {
                confirmAttempts++;
                console.log(`🔄 申し込みボタン検索: ${confirmAttempts}/5回目`);

                const allButtons = Array.from(document.querySelectorAll('button'));
                console.log(`🔍 ボタン数: ${allButtons.length}`);

                if (confirmAttempts === 1 && allButtons.length > 0) {
                  allButtons.forEach((btn, i) => {
                    console.log(`  [${i}] "${btn.textContent.trim()}" | disabled: ${btn.disabled}`);
                  });
                }

                const target = allButtons.find(btn =>
                  (btn.textContent.includes('申し込み') || btn.classList.contains('bg-primary')) && !btn.disabled
                );

                if (target) {
                  clearInterval(confirmInterval);
                  console.log('🎉 ボタン発見:', target.textContent.trim());
                  target.click();
                  console.log('✅ クリック完了！');
                  return;
                }

                if (confirmAttempts >= 5) {
                  clearInterval(confirmInterval);
                  console.log('⚠️ 最大リトライ到達');
                }
              }, 200);
            }, 500);
          }
        }
      }, 100);

      const retryInterval = setInterval(() => {
        retryCount++;
        console.log(`リトライ実行: ${retryCount}回目`);

        const reloadButton = document.querySelector('button svg.lucide-refresh-ccw');
        if (reloadButton && reloadButton.parentElement) {
          reloadButton.parentElement.click();
        }

        setTimeout(() => {
          // 優先順位順に時間帯を探す
          let targetButton = null;
          let foundTime = null;

          for (const time of TARGET_TIMES) {
            targetButton = Array.from(document.querySelectorAll('button'))
              .find(btn => btn.textContent.includes(time));
            if (targetButton) {
              foundTime = time;
              console.log(`🎯 優先時間帯を発見: ${time}`);
              break;
            }
          }

          if (!targetButton) {
            console.log('時間帯ボタンが見つかりません');
            return;
          }

          const isClickable = (btn) => {
            if (!btn || btn.disabled) return false;
            const style = window.getComputedStyle(btn);
            return style.display !== 'none' &&
                   style.visibility !== 'hidden' &&
                   style.pointerEvents !== 'none';
          };

          const tryClick = (btn) => {
            if (!isClickable(btn)) return false;
            if (btn.textContent.trim().startsWith('×')) return false;
            btn.click();
            return true;
          };

          let clicked = false;

          if (tryClick(targetButton)) {
            clicked = true;
            console.log(`✓ ${foundTime} をクリック`);
          } else {
            const parentElement = targetButton.parentElement;
            if (parentElement) {
              const allButtons = Array.from(parentElement.querySelectorAll('button'));
              const startIndex = allButtons.indexOf(targetButton);

              for (let i = startIndex + 1; i < allButtons.length; i++) {
                if (tryClick(allButtons[i])) {
                  clicked = true;
                  console.log(`✓ 代替時間帯をクリック: ${allButtons[i].textContent.trim()}`);
                  break;
                }
              }
            }
          }

          if (clicked) {
            setTimeout(() => {
              const confirmButton = Array.from(document.querySelectorAll('button'))
                .find(btn => btn.textContent.includes('確認する'));

              if (confirmButton) {
                console.log('✓ 確認ボタンをクリック');
                confirmButton.click();
                console.log('===== 予約処理完了 - /confirm へ遷移します =====');
              }
            }, 380);
          } else {
            console.log('クリック可能な時間帯がありません');
          }
        }, 200);

      }, RETRY_INTERVAL);

      setTimeout(() => {
        clearInterval(retryInterval);
        clearInterval(urlCheckInterval);
        console.log('最大実行時間に達しました');
      }, MAX_DURATION);
    }
  });

})();