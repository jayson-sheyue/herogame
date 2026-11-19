(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  let game, pausedScene, retryAction, muted = false, mode = 'select';
  const help = $('helpDialog'), pause = $('pauseDialog');
  const getScene = key => game?.scene.getScene(key);
  const active = key => game?.scene.isActive(key) ? getScene(key) : null;
  function releaseKeys() {
    for (const key of ['select', 'fight']) {
      const scene = getScene(key);
      scene?.input?.keyboard?.resetKeys();
      if (scene?.keys) Object.values(scene.keys).forEach(k => k.reset());
      if (key === 'fight' && scene) {
        for (const field of ['_edgeUp','_edgeDown','_edgeJ','_edgeK','_edgeL','_edgeShift']) scene[field] = false;
        for (const field of ['pendingJumpAt','pendingJAt','pendingKAt','pendingLAt','lastUpAt','lastDownAt']) scene[field] = 0;
        if (scene.hostBuf) Object.keys(scene.hostBuf).forEach(k => { scene.hostBuf[k] = 0; });
        if (scene.pvp && !scene.isHost) scene.net?.send({type:'input'});
      }
    }
  }
  function suspend() {
    releaseKeys();
    const fight = active('fight');
    if (!fight || fight.pvp) return false;
    pausedScene = fight;
    fight.scene.pause();
    game.sound.pauseAll();
    return true;
  }
  function resume() {
    releaseKeys();
    if (pausedScene) { pausedScene.scene.resume(); pausedScene = null; game.sound.resumeAll(); }
    if (pause.open) pause.close();
    game?.canvas?.focus({preventScroll:true});
  }
  function openHelp() {
    if (help.open || pause.open) return;
    suspend();
    const scene = active('fight');
    $('helpContext').textContent = scene?.pvp
      ? '联机对战继续进行，操作手册不会暂停其他玩家。'
      : pausedScene ? '本局已暂停，关闭手册后继续。' : '键盘操作 · 推荐横屏与实体键盘';
    const select = active('select');
    if (select) { releaseKeys(); select.input.keyboard.enabled = false; }
    help.showModal();
  }
  help.addEventListener('close', () => { const select = active('select'); if (select) select.input.keyboard.enabled = true; resume(); });
  $('helpButton').onclick = openHelp;
  $('closeHelp').onclick = () => help.close();
  $('pauseButton').onclick = () => { if (suspend()) pause.showModal(); };
  $('resumeButton').onclick = resume;
  pause.addEventListener('cancel', event => { event.preventDefault(); resume(); });
  window.addEventListener('keydown', event => {
    if (event.code === 'F1') { event.preventDefault(); event.stopImmediatePropagation(); if (help.open) help.close(); else openHelp(); }
    if (help.open || pause.open) {
      // Keep J/Enter/Esc inside the dialog, never pass them to the battle.
      if (event.code === 'Escape') { event.preventDefault(); if (help.open) help.close(); else resume(); }
      event.stopImmediatePropagation();
    } else if (event.target?.closest?.('button, input, textarea, select')) {
      // Native controls keep Enter, Space and Tab; their keys must not attack
      // or switch modes in the canvas behind them.
      releaseKeys();
      event.stopImmediatePropagation();
    }
  }, true);
  $('muteButton').onclick = () => {
    if (!game) return;
    muted = !muted;
    game.sound.mute = muted;
    $('muteButton').textContent = muted ? '声音：关' : '声音：开';
    $('muteButton').setAttribute('aria-pressed', String(muted));
    try { localStorage.setItem('herogame-muted', String(muted)); } catch { /* optional preference */ }
    $('muteButton').blur();
  };
  $('fullscreenButton').onclick = async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
    catch { $('quickHint').textContent = '浏览器未允许全屏，可使用浏览器的全屏菜单。'; }
    $('fullscreenButton').blur();
  };
  document.addEventListener('fullscreenchange', () => { $('fullscreenButton').textContent = document.fullscreenElement ? '退出全屏' : '全屏'; });
  $('startButton').onclick = () => { const select = active('select'); if (select) select.confirm(); $('startButton').blur(); };
  $('mapButton').onclick = () => { active('select')?.confirmStage(); $('mapButton').blur(); };
  $('backButton').onclick = () => { active('fight')?.onFightEsc(); $('backButton').blur(); };
  $('retryButton').onclick = () => { if (retryAction) retryAction(); else location.reload(); };
  window.addEventListener('blur', () => {
    releaseKeys();
    if (!help.open && !pause.open && suspend()) pause.showModal();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { releaseKeys(); if (!help.open && !pause.open && suspend()) pause.showModal(); }
  });
  const labels = {dummy:'木桩练习',pve:'PVE 对战',cricket:'电子斗蛐蛐',raid:'合作闯关',pvp:'局域网 PVP'};
  window.HeroShell = {
    bind(instance) {
      game = instance;
      game.events.once('ready', () => {
        game.canvas.tabIndex = -1;
        game.canvas.setAttribute('aria-label', '游戏画面。操作方法见操作指南。');
        try { muted = localStorage.getItem('herogame-muted') === 'true'; } catch { /* defaults */ }
        game.sound.mute = muted;
        $('muteButton').textContent = muted ? '声音：关' : '声音：开';
        $('muteButton').setAttribute('aria-pressed', String(muted));
      });
    },
    mode(next) {
      mode = next;
      const fight = next !== 'select';
      $('backButton').hidden = !fight;
      $('pauseButton').hidden = !fight || !!getScene('fight')?.pvp;
      $('startButton').hidden = fight;
      $('mapButton').hidden = fight;
      if (fight) {
        $('phaseLabel').textContent = labels[next] || '对战中';
        $('quickHint').textContent = next === 'cricket' ? '双 AI 自动对战 · 尽情观战' : 'A / D 移动 · W 跳跃 · S 防守 · J 普攻 · K 技能 · L 奥义';
      }
    },
    selection(scene) {
      if (mode !== 'select') return;
      const online = !!scene.pvpSeat;
      const canMap = (scene.mode !== 'pvp' && !online) || scene.pvpSeat === 'host';
      const randomMap = ['pve','cricket'].includes(scene.mode) && !scene.stageConfirmed;
      $('phaseLabel').textContent = `${labels[scene.mode]} · ${online ? '房间 ' + scene.pvpRoom : scene.stageConfirmed ? '战场已锁定' : randomMap ? '随机战场' : '选择你的战场'}`;
      $('quickHint').textContent = online || scene.mode === 'pvp'
        ? scene.pvpStatus || '创建或加入房间，与同一局域网的朋友对战'
        : `${scene.heroName(scene.p1Index)} · ${randomMap ? '开战时抽签地图' : scene.stageNameAt(scene.stageIndex)} · A / D 换英灵`;
      $('mapButton').hidden = !canMap;
      $('mapButton').textContent = scene.stageConfirmed ? '✓ 战场已锁定' : '锁定战场 · E';
      $('mapButton').disabled = scene.stageConfirmed || scene.locked || scene.drawingMap;
      $('startButton').hidden = scene.mode === 'pvp' && !online;
      $('startButton').disabled = scene.locked || scene.drawingMap || !scene.playable.length;
      $('startButton').textContent = online ? (scene.ensureProfile(scene.pvpSeat).ready ? '取消准备 · J' : '准备出战 · J') : scene.mode === 'raid' ? '开始闯关 · J' : scene.mode === 'cricket' ? '开始观战 · J' : '进入战场 · J';
    },
    loading(title, detail) {
      $('loading').hidden = false;
      $('loadingTitle').textContent = title;
      $('loadingDetail').textContent = detail || '正在读取资源，请稍候…';
      $('loadProgress').hidden = false;
      $('loadProgress').removeAttribute('value');
      $('retryButton').hidden = true;
      retryAction = null;
      $('startButton').hidden = $('mapButton').hidden = true;
    },
    progress(value) { $('loadProgress').max = 1; $('loadProgress').value = value; },
    ready() { $('loading').hidden = true; },
    fail(title, detail, onReturn) {
      this.loading(title, detail);
      $('loadProgress').hidden = true;
      retryAction = onReturn || null;
      $('retryButton').textContent = onReturn ? '返回英灵选择' : '重新加载';
      $('retryButton').hidden = false;
    },
    hint(text) { if (text) $('quickHint').textContent = text; },
  };
})();
