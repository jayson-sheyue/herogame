(() => {
  'use strict';
  const i18n = window.HeroI18n;
  const t = i18n.t;
  let loadingCopy = null;
  const $ = (id) => document.getElementById(id);
  let game,
    pausedScene,
    retryAction,
    muted = false,
    mode = 'select';
  const help = $('helpDialog'),
    pause = $('pauseDialog');
  const getScene = (key) => game?.scene.getScene(key);
  const active = (key) => (game?.scene.isActive(key) ? getScene(key) : null);
  function releaseKeys() {
    for (const key of ['select', 'fight']) {
      const scene = getScene(key);
      scene?.input?.keyboard?.resetKeys();
      if (scene?.keys) Object.values(scene.keys).forEach((k) => k.reset());
      if (key === 'fight' && scene) {
        for (const field of ['_edgeUp', '_edgeDown', '_edgeJ', '_edgeK', '_edgeL', '_edgeShift'])
          scene[field] = false;
        for (const field of [
          'pendingJumpAt',
          'pendingJAt',
          'pendingKAt',
          'pendingLAt',
          'lastUpAt',
          'lastDownAt',
        ])
          scene[field] = 0;
      }
    }
  }
  function suspend() {
    releaseKeys();
    const fight = active('fight');
    if (!fight) return false;
    pausedScene = fight;
    fight.scene.pause();
    game.sound.pauseAll();
    return true;
  }
  function resume() {
    releaseKeys();
    if (pausedScene) {
      pausedScene.scene.resume();
      pausedScene = null;
      game.sound.resumeAll();
    }
    if (pause.open) pause.close();
    game?.canvas?.focus({ preventScroll: true });
  }
  function openHelp() {
    if (help.open || pause.open) return;
    suspend();
    $('helpContext').textContent = t(pausedScene ? '对战已暂停，关闭后继续。' : '推荐横屏与实体键盘');
    const select = active('select');
    if (select) {
      releaseKeys();
      select.input.keyboard.enabled = false;
    }
    help.showModal();
  }
  help.addEventListener('close', () => {
    const select = active('select');
    if (select) select.input.keyboard.enabled = true;
    resume();
  });
  $('helpButton').onclick = openHelp;
  $('closeHelp').onclick = () => help.close();
  $('pauseButton').onclick = () => {
    if (suspend()) pause.showModal();
  };
  $('resumeButton').onclick = resume;
  pause.addEventListener('cancel', (event) => {
    event.preventDefault();
    resume();
  });
  window.addEventListener(
    'keydown',
    (event) => {
      if (event.code === 'F1') {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (help.open) help.close();
        else openHelp();
      }
      if (help.open || pause.open) {
        // Keep J/Enter/Esc inside the dialog, never pass them to the battle.
        if (event.code === 'Escape') {
          event.preventDefault();
          if (help.open) help.close();
          else resume();
        }
        event.stopImmediatePropagation();
      } else if (event.target?.closest?.('button, input, textarea, select')) {
        // Native controls keep Enter, Space and Tab; their keys must not attack
        // or change the selection in the canvas behind them.
        releaseKeys();
        event.stopImmediatePropagation();
      }
    },
    true,
  );
  $('muteButton').onclick = () => {
    if (!game) return;
    muted = !muted;
    game.sound.mute = muted;
    $('muteButton').textContent = t(muted ? '声音：关' : '声音：开');
    $('muteButton').setAttribute('aria-pressed', String(muted));
    try {
      localStorage.setItem('herogame-muted', String(muted));
    } catch {
      /* optional preference */
    }
    $('muteButton').blur();
  };
  $('fullscreenButton').onclick = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      $('quickHint').textContent = t('浏览器未允许全屏，可使用浏览器的全屏菜单。');
    }
    $('fullscreenButton').blur();
  };
  document.addEventListener('fullscreenchange', () => {
    $('fullscreenButton').textContent = t(document.fullscreenElement ? '退出全屏' : '全屏');
  });
  $('startButton').onclick = () => {
    const select = active('select');
    if (select) select.confirm();
    $('startButton').blur();
  };
  $('rematchButton').onclick = () => {
    const fight = active('fight');
    if (fight?.resultShown) fight.scene.start('loader', fight.pack);
    $('rematchButton').blur();
  };
  $('backButton').onclick = () => {
    active('fight')?.onFightEsc();
    $('backButton').blur();
  };
  $('retryButton').onclick = () => {
    if (retryAction) retryAction();
    else location.reload();
  };
  window.addEventListener('blur', () => {
    releaseKeys();
    if (!help.open && !pause.open && suspend()) pause.showModal();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      releaseKeys();
      if (!help.open && !pause.open && suspend()) pause.showModal();
    }
  });
  function refreshLocale() {
    $('phaseLabel').textContent = mode === 'pve' ? '1P VS CPU' : t('SELECT');
    $('muteButton').textContent = t(muted ? '声音：关' : '声音：开');
    $('fullscreenButton').textContent = t(document.fullscreenElement ? '退出全屏' : '全屏');
    $('helpContext').textContent = t(pausedScene ? '对战已暂停，关闭后继续。' : '推荐横屏与实体键盘');
    $('retryButton').textContent = t(retryAction ? '返回英灵选择' : '重新加载');
    game?.canvas?.setAttribute('aria-label', t('游戏画面。操作方法见出招表。'));
    if (loadingCopy) {
      $('loadingTitle').textContent = t(loadingCopy.title);
      $('loadingDetail').textContent = t(loadingCopy.detail);
    }
    for (const key of ['select', 'fight']) {
      const scene = getScene(key);
      if (scene && (active(key) || scene === pausedScene)) scene.localize?.();
    }
  }
  $('languageSelect').addEventListener('focus', releaseKeys);
  $('languageSelect').onchange = () => {
    releaseKeys();
    i18n.setLanguage($('languageSelect').value);
    $('languageSelect').blur();
    if (!help.open && !pause.open) game?.canvas?.focus({ preventScroll: true });
  };
  i18n.onChange(refreshLocale);
  refreshLocale();
  window.HeroShell = {
    bind(instance) {
      game = instance;
      game.events.once('ready', () => {
        game.canvas.tabIndex = -1;
        game.canvas.setAttribute('aria-label', t('游戏画面。操作方法见出招表。'));
        try {
          muted = localStorage.getItem('herogame-muted') === 'true';
        } catch {
          /* defaults */
        }
        game.sound.mute = muted;
        $('muteButton').textContent = t(muted ? '声音：关' : '声音：开');
        $('muteButton').setAttribute('aria-pressed', String(muted));
      });
    },
    mode(next) {
      mode = next;
      const fight = next === 'pve';
      $('backButton').hidden = $('pauseButton').hidden = !fight;
      $('startButton').hidden = fight;
      $('rematchButton').hidden = true;
      $('phaseLabel').textContent = fight ? '1P VS CPU' : t('SELECT');
      $('quickHint').textContent = t(
        fight ? 'A D 移动 · W 跳跃 · S 防守 · J 普攻 · K 技能 · L 奥义' : '选择英灵与对手',
      );
    },
    selection(scene) {
      if (mode !== 'select') return;
      $('quickHint').textContent =
        `${scene.heroName(scene.p1Index)} VS ${scene.heroName(scene.p2Index)} · ${scene.stageNameAt(scene.stageIndex)}`;
      $('startButton').hidden = false;
      $('startButton').disabled = scene.locked || !scene.playable.length || !scene.stageIds.length;
    },
    result() {
      $('rematchButton').hidden = false;
      $('pauseButton').hidden = true;
    },
    loading(title, detail) {
      $('loading').hidden = false;
      loadingCopy = { title, detail: detail || '正在读取资源，请稍候…' };
      $('loadingTitle').textContent = t(loadingCopy.title);
      $('loadingDetail').textContent = t(loadingCopy.detail);
      $('loadProgress').hidden = false;
      $('loadProgress').removeAttribute('value');
      $('retryButton').hidden = true;
      retryAction = null;
      $('startButton').hidden = $('rematchButton').hidden = true;
    },
    progress(value) {
      $('loadProgress').max = 1;
      $('loadProgress').value = value;
    },
    ready() {
      loadingCopy = null;
      $('loading').hidden = true;
    },
    fail(title, detail, onReturn) {
      this.loading(title, detail);
      $('loadProgress').hidden = true;
      retryAction = onReturn || null;
      $('retryButton').textContent = t(onReturn ? '返回英灵选择' : '重新加载');
      $('retryButton').hidden = false;
    },
    hint(text) {
      if (text) $('quickHint').textContent = t(text);
    },
  };
})();
