(() => {
  const WALK = 280;
  const DASH = 880;
  const AIR = 460;
  const JUMP = -820;
  const DOUBLE_JUMP = -760;
  const MAX_JUMPS = 2;
  const GRAVITY = 1750;
  const CHAR_SCREEN = 0.4;
  /** 对战内全体再缩小（相对比例仍走 visualScale） */
  const CHAR_DISPLAY_SHRINK = 1 / 1.5;
  // 与作图工坊一致：visualScale = bodyGuideH / 560，夹在 0.5～1.5（无高矮角色特例）
  const VISUAL_SCALE_MIN = 0.5;
  const VISUAL_SCALE_MAX = 1.5;
  /** 选人页英灵卡池：单行一屏显示数量（多出来的用左右箭头翻页） */
  const HERO_RAIL_PAGE = 6;
  const PUSH_W = 82;
  const PUSH_H = 158;
  const PUSH_PRONE_W = 152;
  const PUSH_PRONE_H = 36;
  const GAME_NAME = "英灵大乱斗";
  const UI_FONT = "GameUI, PingFang SC, sans-serif";
  const BODY_FONT = "BodyUI, PingFang SC, Hiragino Sans GB, sans-serif";
  const BRUSH_FONT = "BrushUI, STKaiti, KaiTi, serif";
  const P1_DEFAULT = "id_1786892372";
  const DUMMY_ID = "id_1786874191";
  const JIANG_ID = "id_1786886794";
  const HITLER_ID = "id_1786892372";
  const ZHU_ID = "id_1786960452";
  const NEWTON_ID = "17";
  const IEYASU_ID = "id_1786895186";
  const YEAR_ZERO_ID = "year_zero";
  const HAWKING_ID = "id_1787634312";
  const LUBU_ID = "id_1787793997";
  const SUPER_TITLES = {
    [NEWTON_ID]: "万有引力",
    [HITLER_ID]: "铁十字之辉",
    [ZHU_ID]: "天威难测",
    [JIANG_ID]: "优势在我",
    [DUMMY_ID]: "逆风解意",
    [IEYASU_ID]: "三河魂",
    [YEAR_ZERO_ID]: "去城市化",
    [HAWKING_ID]: "奇点演说",
    [LUBU_ID]: "赤兔战争践踏",
  };
  const CPU_DIFFS = [
    { id: "kind", label: "仁慈的敌人" },
    { id: "fair", label: "认真的敌人" },
    { id: "cruel", label: "残忍的敌人" },
  ];

  function cpuDiffId(v) {
    return v === "kind" || v === "cruel" ? v : "fair";
  }

  function cpuDiffLabel(v) {
    const id = cpuDiffId(v);
    return CPU_DIFFS.find((d) => d.id === id)?.label || "认真的敌人";
  }

  function loadCpuDiff() {
    try {
      const q = queryParam("diff");
      if (q === "kind" || q === "fair" || q === "cruel") return q;
      const stored = localStorage.getItem("herogame-cpu-diff");
      if (stored === "kind" || stored === "fair" || stored === "cruel") return stored;
    } catch {
      /* ignore */
    }
    return "fair";
  }

  function saveCpuDiff(id) {
    const next = cpuDiffId(id);
    try {
      localStorage.setItem("herogame-cpu-diff", next);
    } catch {
      /* ignore */
    }
    return next;
  }
  const HIDDEN_HEROES = new Set(["nurhaci_13_armors", "id_1786855456", "id_1786858227"]);
  const REACH = {
    attack: 56,
    air_attack: 48,
    attack_up: 52,
    attack_down: 48,
    skill: 72,
    combo_up: 64,
    combo_down: 56,
    super: 88,
  };
  const DIR_WINDOW = 280;
  const JUMP_DELAY = 200;
  /** 出招硬直中按下的 J/K/L，可在恢复后短暂补发 */
  const ACTION_BUF_MS = 240;
  const GET_UP_MS = 720;
  /** 仅倒地起身瞬间的短暂无敌 */
  const GET_UP_INVULN_MS = 650;
  const DASH_IFRAMES_MS = 0;
  const DASH_ESCAPE_IFRAMES_MS = 320;
  const BREAKOUT_SP = 22;
  const BREAKOUT_CD = 4200;
  const DASH_ESCAPE_SP = 12;
  const HP_BARS = 3;
  const HP_PER_BAR = 100;
  const BASE_HP = HP_BARS * HP_PER_BAR;
  const BASE_MP = 100;
  const BASE_SP = 100;
  const GUARD_DAMAGE = 0.5;
  const GUARD_SP_REGEN = 18;
  /** 连击累计伤害达到后强制击飞落地（约 2～3 下普攻） */
  const COMBO_LAUNCH_DMG = 16;
  const COMBO_WINDOW_MS = 1400;
  const COST = {
    attack: { mp: 0, sp: 4 },
    // 技能只耗蓝；绿条管普攻/冲刺。两边都卡时会出现「明明有蓝却放不出」。
    skill: { mp: 32, sp: 0 },
    super: { mp: 55, sp: 0 },
  };
  /** 小技能 / 大招冷却（毫秒）。K 系约 5–7 秒，奥义约 11 秒，避免蓝够就连发。 */
  const MOVE_CD_MS = {
    skill: 5000,
    combo_up: 7000,
    combo_down: 6000,
    super: 11000,
  };
  const CD_SLOT_ORDER = [
    { move: "skill", label: "K", color: 0x4b8dff },
    { move: "combo_up", label: "↑K", color: 0xe8c36a },
    { move: "combo_down", label: "↓K", color: 0x6ec87a },
    { move: "super", label: "L", color: 0xe07050 },
  ];
  const LUNGE = {
    attack: 170,
    air_attack: 90,
    attack_up: 110,
    attack_down: 40,
    skill: 200,
    combo_up: 130,
    combo_down: 50,
    super: 240,
  };
  const HIT = {
    attack: { knock: 160, lift: -18, stun: 340, knockdown: false, stop: 24 },
    air_attack: { knock: 150, lift: -28, stun: 320, knockdown: false, stop: 24 },
    attack_up: { knock: 140, lift: -70, stun: 360, knockdown: false, stop: 28 },
    attack_down: { knock: 150, lift: -12, stun: 340, knockdown: false, stop: 28 },
    skill: { knock: 200, lift: -36, stun: 400, knockdown: false, stop: 36 },
    combo_up: { knock: 200, lift: -48, stun: 400, knockdown: false, stop: 36 },
    combo_down: { knock: 180, lift: -28, stun: 400, knockdown: false, stop: 36 },
    super: { knock: 480, lift: -740, stun: 0, knockdown: true, stop: 90 },
  };

  const LOOP = new Set(["idle", "walk", "dash", "guard"]);
  const FALL = new Set(["hurt", "air_hurt", "defeat_cg", "knockdown"]);
  const ATTACKS = new Set([
    "attack",
    "air_attack",
    "attack_up",
    "attack_down",
    "skill",
    "combo_up",
    "combo_down",
    "super",
  ]);
  const DAMAGE = {
    attack: 6,
    air_attack: 6,
    attack_up: 6,
    attack_down: 6,
    skill: 12,
    combo_up: 12,
    combo_down: 12,
    super: 40,
  };

  function moveDamage(move) {
    return DAMAGE[move] || 6;
  }

  function moveHit(move) {
    return { ...(HIT[move] || HIT.attack) };
  }

  function isSuperMove(move) {
    return move === "super";
  }

  function isLightAttack(move) {
    return move === "attack" || move === "air_attack" || move === "attack_up" || move === "attack_down";
  }

  function isSkillSfxMove(move) {
    return move === "skill" || move === "combo_up" || move === "combo_down" || move === "super";
  }

  function moveSpec(fighter, move) {
    const custom = fighter?.moves?.[move];
    const rawProj = custom?.projectile;
    const projectile =
      rawProj && typeof rawProj === "object" && rawProj.file ? rawProj : null;
    return {
      reach: REACH[move] || 56,
      damage: moveDamage(move),
      lunge: LUNGE[move] || 160,
      hit: moveHit(move),
      effect: isSuperMove(move) ? "launch" : "none",
      effectStrength: isSuperMove(move) ? 1 : 0,
      projectile,
      mechanic: mechanicSpec(custom),
      ailment: "none",
    };
  }

  function mechanicSpec(moveFull) {
    const m = moveFull?.mechanic && typeof moveFull.mechanic === "object" ? moveFull.mechanic : {};
    const proj = moveFull?.projectile;
    const fromMotion = { forward: "bolt", fall: "drop", field: "zone", up: "bolt", hover: "drop" };
    let type = String(m.type || "").toLowerCase();
    if (!type || type === "melee") type = proj ? fromMotion[proj.motion] || "bolt" : "melee";
    return {
      type,
      count: Number.isFinite(m.count) ? Math.max(1, Math.min(8, m.count)) : type === "barrage" ? 3 : 1,
      delay: Number.isFinite(m.delay) ? m.delay : type === "barrage" ? 140 : 0,
      spread: Number.isFinite(m.spread) ? m.spread : type === "barrage" ? 72 : 0,
      homing: Number.isFinite(m.homing) ? m.homing : type === "homing" ? 10 : 0,
      pierce: "pierce" in m ? Boolean(m.pierce) : type === "beam",
      ticks: Number.isFinite(m.ticks)
        ? Math.max(1, Math.min(16, m.ticks))
        : type === "zone" || type === "trap" || type === "beam"
          ? 8
          : 1,
    };
  }

  function projVisualDefaults(mec, motion) {
    const kind = mec.type;
    const m = motion || "forward";
    if (kind === "bolt" || ((kind === "homing" || kind === "barrage") && m === "forward")) {
      return { screen: 0.12, hitW: 44, hitH: 32, speed: 360, gravity: 0, fps: 7, maxScale: 0.72 };
    }
    if (kind === "beam") {
      return { screen: 0.14, hitW: 240, hitH: 44, speed: 40, gravity: 0, fps: 6, maxScale: 1.0 };
    }
    if (m === "hover") {
      return { screen: 0.32, hitW: 140, hitH: 160, speed: 0, gravity: 0, fps: 4, maxScale: 1.25 };
    }
    if (m === "fall" || kind === "drop") {
      return { screen: 0.34, hitW: 120, hitH: 100, speed: 240, gravity: 360, fps: 4, maxScale: 1.4 };
    }
    if (m === "field" || kind === "zone" || kind === "trap") {
      return { screen: 0.26, hitW: 280, hitH: 180, speed: 50, gravity: 0, fps: 4, maxScale: 1.55 };
    }
    if (m === "up") {
      return { screen: 0.13, hitW: 48, hitH: 36, speed: 380, gravity: 0, fps: 7, maxScale: 0.75 };
    }
    return { screen: 0.18, hitW: 64, hitH: 48, speed: 320, gravity: 0, fps: 5, maxScale: 1.0 };
  }

  function alignTravelSprite(spr, vx, vy) {
    if (!spr) return;
    const x = vx || 0;
    const y = vy || 0;
    if (x * x + y * y < 4) return;
    spr.setFlipX(false);
    spr.setFlipY(false);
    spr.setRotation(Math.atan2(y, x) - Math.PI / 4);
  }

  function mergeProjVisual(proj, mec, motion) {
    const def = projVisualDefaults(mec, motion);
    const explicitScreen = Number.isFinite(proj?.screen);
    const explicitBig = explicitScreen && proj.screen > 0.16;
    // 默认小弹道仍防模型写飞；显式加大的道具弹道（如波尔布特叉子）放行
    const isSmall = def.screen <= 0.14 && !explicitBig;
    const isProp = !isSmall;
    let screen = explicitScreen ? proj.screen : def.screen;
    if (isSmall && screen > 0.16) screen = def.screen;
    let hitW = Number.isFinite(proj.hitW) ? proj.hitW : def.hitW;
    let hitH = Number.isFinite(proj.hitH) ? proj.hitH : def.hitH;
    if (isSmall && hitW > 72) hitW = def.hitW;
    if (isSmall && hitH > 56) hitH = def.hitH;
    let speed = Number.isFinite(proj.speed) ? proj.speed : def.speed;
    if (isSmall && speed > 480) speed = def.speed;
    if (isProp && !explicitBig) speed = Math.min(speed, def.speed);
    let gravity = Number.isFinite(proj.gravity) ? proj.gravity : def.gravity;
    if ((isSmall || motion === "forward" || motion === "up") && mec.type === "bolt" && gravity > 0) gravity = 0;
    if (isSmall && gravity > 0) gravity = 0;
    if (isProp && (motion === "fall" || mec.type === "drop")) gravity = Math.min(gravity, def.gravity);
    let fps = Number.isFinite(proj.frameRate) ? proj.frameRate : def.fps;
    if (isProp && !explicitBig) fps = Math.min(fps, def.fps);
    const lifeSet = Number.isFinite(proj.life);
    let life = lifeSet ? proj.life : motion === "field" ? 2400 : motion === "fall" ? 2800 : 900;
    if (!lifeSet && isProp && motion === "fall") life = Math.max(life, 3000);
    if (!lifeSet && isProp && motion === "field") life = Math.max(life, 2400);
    let maxScale = Number.isFinite(proj.maxScale) ? proj.maxScale : def.maxScale;
    if (explicitBig) maxScale = Math.max(maxScale, Number(proj.maxScale) || 1.45);
    return { screen, hitW, hitH, speed, gravity, fps, maxScale, life };
  }

  function projInk(proj) {
    const pivots = proj?._pivots || [];
    return pivots.reduce(
      (best, p) => (!p ? best : p.h > best.h ? p : best),
      { w: 64, h: 64, originX: 0.5, originY: 0.5 }
    );
  }

  const VOICE_ON = {
    super: "super",
    hurt: "hurt",
    air_hurt: "hurt",
    win_cg: "win",
    defeat_cg: "defeat",
  };

  const VOICE_PRIORITY = { super: 5, win: 5, defeat: 5, intro: 4, hurt: 3, select: 3 };

  function queryParam(name) {
    return new URLSearchParams(location.search).get(name) || "";
  }

  function scanFrame(scene, key, index, minAlpha = 24, additive = false) {
    const fallback = {
      minX: 0,
      minY: 0,
      w: 1,
      h: 1,
      bodyH: 1,
      feetX: 0.5,
      feetY: 1,
      originX: 0.5,
      originY: 1,
    };
    try {
      const tex = scene.textures.get(key);
      const frame = tex?.get?.(index);
      const img = tex?.getSourceImage?.();
      if (!frame || !img || !frame.width || !frame.height) return fallback;
      const canvas = document.createElement("canvas");
      canvas.width = frame.width;
      canvas.height = frame.height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return fallback;
      ctx.drawImage(img, frame.cutX, frame.cutY, frame.width, frame.height, 0, 0, frame.width, frame.height);
      const data = ctx.getImageData(0, 0, frame.width, frame.height).data;
      let minX = frame.width;
      let minY = frame.height;
      let maxX = 0;
      let maxY = 0;
      const step = frame.width > 240 ? 2 : 1;
      const xLo = Math.floor(frame.width * 0.18);
      const xHi = Math.max(xLo + 1, Math.floor(frame.width * 0.82));
      const rowCount = new Array(frame.height).fill(0);
      for (let y = 0; y < frame.height; y += step) {
        let c = 0;
        for (let x = 0; x < frame.width; x += step) {
          const pix = (y * frame.width + x) * 4;
          const a = data[pix + 3];
          if (additive) {
            const glow = ((data[pix] + data[pix + 1] + data[pix + 2]) / 3) * (a / 255);
            if (a < 10 && glow < 14) continue;
            if (a < minAlpha && glow < Math.max(18, minAlpha * 0.7)) continue;
          } else if (a < minAlpha) {
            continue;
          }
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
          if (x >= xLo && x < xHi) c += 1;
        }
        // Approximate occupancy for skipped rows when step>1
        for (let yy = y; yy < Math.min(frame.height, y + step); yy++) rowCount[yy] = c;
      }
      if (maxY < minY) {
        return {
          minX: 0,
          minY: 0,
          w: frame.width,
          h: frame.height,
          bodyH: frame.height,
          feetX: frame.width * 0.5,
          feetY: frame.height,
          originX: 0.5,
          originY: 1,
        };
      }
      let feetLeft = frame.width;
      let feetRight = 0;
      const band = Math.max(0, maxY - 6);
      for (let y = band; y <= maxY; y += step) {
        for (let x = 0; x < frame.width; x += step) {
          if (data[(y * frame.width + x) * 4 + 3] < minAlpha) continue;
          if (x < feetLeft) feetLeft = x;
          if (x > feetRight) feetRight = x;
        }
      }
      const feetX = (feetLeft + feetRight) / 2;
      const feetY = maxY + 1;
      const inkH = maxY - minY + 1;
      // Core body height (工坊 measure_cell_body)：忽略翎羽/兵器尖刺等稀疏竖条
      let bodyH = inkH;
      const peak = Math.max(0, ...rowCount.slice(minY, maxY + 1));
      if (peak >= 3) {
        const bandW = Math.max(1, xHi - xLo);
        let thr = Math.max(5, Math.min(Math.floor(peak * 0.3), Math.floor(bandW * 0.12)));
        thr = Math.min(thr, Math.max(3, peak - 1));
        const maxGap = Math.max(2, Math.min(14, Math.floor(frame.height / 40)));
        let bestA = -1;
        let bestB = -1;
        let runA = -1;
        let gap = 0;
        for (let y = minY; y <= maxY; y++) {
          if (rowCount[y] >= thr) {
            if (runA < 0) runA = y;
            gap = 0;
          } else if (runA >= 0) {
            gap += 1;
            if (gap > maxGap) {
              const runB = y - gap;
              if (bestA < 0 || runB - runA > bestB - bestA) {
                bestA = runA;
                bestB = runB;
              }
              runA = -1;
              gap = 0;
            }
          }
        }
        if (runA >= 0) {
          const runB = maxY;
          if (bestA < 0 || runB - runA > bestB - bestA) {
            bestA = runA;
            bestB = runB;
          }
        }
        if (bestA >= 0) bodyH = Math.max(8, bestB - bestA + 1);
      }
      return {
        minX,
        minY,
        w: maxX - minX + 1,
        h: inkH,
        bodyH,
        feetX,
        feetY,
        originX: feetX / frame.width,
        originY: feetY / frame.height,
      };
    } catch {
      return fallback;
    }
  }

  function scanFrameCached(scene, key, index, minAlpha = 24, additive = false) {
    scene._scanFrameCache ||= new Map();
    const cacheKey = `${key}:${index}:${minAlpha}:${additive ? 1 : 0}`;
    if (scene._scanFrameCache.has(cacheKey)) return scene._scanFrameCache.get(cacheKey);
    const scanned = scanFrame(scene, key, index, minAlpha, additive);
    scene._scanFrameCache.set(cacheKey, scanned);
    return scanned;
  }

  function clearNetLobbyPings(net) {
    if (!net) return;
    (net._lobbyPingIds || []).forEach((id) => {
      try {
        clearTimeout(id);
      } catch {
        /* ignore */
      }
    });
    net._lobbyPingIds = [];
  }

  function queueNetLobbyPings(net, delays) {
    clearNetLobbyPings(net);
    if (!net?.connected) return;
    const gen = net._fightGen || 0;
    const ping = () => {
      try {
        if (net.connected) net.send({ type: "lobby_return", gen });
      } catch {
        /* ignore */
      }
    };
    net._lobbyPingIds = (delays || []).map((ms) => setTimeout(ping, ms));
  }

  /** 贴图可见墨迹的世界矩形（忽略青底空白）。奥义/弹道判定必须用这个，不能用整帧 displaySize。 */
  function spriteInkWorldRect(scene, spr, pad = 0, minAlpha = 24) {
    if (!spr) return new Phaser.Geom.Rectangle(0, 0, 8, 8);
    const key = spr.texture?.key;
    const raw = Number(spr.frame?.name);
    const idx = Number.isFinite(raw) ? raw : 0;
    const fw = Math.max(1, spr.frame?.width || spr.width || 1);
    const fh = Math.max(1, spr.frame?.height || spr.height || 1);
    const additive = spr.blendMode === Phaser.BlendModes.ADD;
    const pivot = key && scene?.textures?.exists?.(key) ? scanFrameCached(scene, key, idx, minAlpha, additive) : null;
    const minX = pivot ? pivot.minX : 0;
    const minY = pivot ? pivot.minY : 0;
    const iw = Math.max(1, pivot?.w || fw);
    const ih = Math.max(1, pivot?.h || fh);
    const sx = Number.isFinite(spr.scaleX) ? spr.scaleX : 1;
    const sy = Number.isFinite(spr.scaleY) ? spr.scaleY : 1;
    const flipX = spr.flipX ? -1 : 1;
    const ox = (spr.originX ?? 0.5) * fw;
    const oy = (spr.originY ?? 0.5) * fh;
    const toX = (fx) => spr.x + (fx - ox) * Math.abs(sx) * flipX;
    const toY = (fy) => spr.y + (fy - oy) * Math.abs(sy);
    const x0 = toX(minX);
    const x1 = toX(minX + iw);
    const y0 = toY(minY);
    const y1 = toY(minY + ih);
    const left = Math.min(x0, x1) - pad;
    const top = Math.min(y0, y1) - pad;
    return new Phaser.Geom.Rectangle(left, top, Math.max(8, Math.abs(x1 - x0) + pad * 2), Math.max(8, Math.abs(y1 - y0) + pad * 2));
  }

  function scanSheet(scene, key, frames) {
    const out = [];
    for (let i = 0; i < frames; i++) out.push(scanFrame(scene, key, i));
    return out;
  }

  function median(values) {
    const a = values.filter((v) => v > 8).sort((x, y) => x - y);
    if (!a.length) return 1;
    const mid = Math.floor(a.length / 2);
    return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
  }

  function sheetBodyH(frames) {
    if (!frames?.length) return 1;
    // 与作图工坊一致：用躯干核心高，不用翎羽/兵器撑开的整段墨迹 AABB
    const upright = frames.filter((f) => f.h >= f.w * 0.78);
    const pool = upright.length >= Math.max(2, Math.ceil(frames.length * 0.34)) ? upright : frames;
    const cores = pool.map((f) => Number(f.bodyH) || Number(f.h) || 0);
    return median(cores);
  }

  function stageTexSize(scene, key, meta) {
    const tex = scene.textures.get(key);
    const frame = tex?.get?.();
    return {
      w: Number(meta?.width) || frame?.width || scene.scale.width,
      h: Number(meta?.height) || frame?.height || scene.scale.height,
    };
  }

  /** Fit stage to viewport height; world width follows the source image aspect ratio. */
  function buildStageLayout(scene, stageId, stages, viewH) {
    const key = `stage-${stageId}`;
    const meta = stages?.[stageId] || {};
    const { w: srcW, h: srcH } = stageTexSize(scene, key, meta);
    const scale = viewH / srcH;
    const worldW = Math.round(srcW * scale);
    const root = scene.add.container(0, 0).setDepth(0);
    root.add(scene.add.image(0, 0, key).setOrigin(0, 0).setDisplaySize(worldW, viewH));
    return { root, worldW };
  }

  function poseEnergy(frames) {
    const medH = sheetBodyH(frames);
    const medW = median(frames.map((f) => f.w));
    const medOx = median(frames.map((f) => f.originX));
    return frames.map((f, i) => ({
      i,
      e:
        Math.abs(f.h - medH) / Math.max(8, medH) +
        Math.abs(f.w - medW) / Math.max(8, medW) +
        Math.abs(f.originX - medOx) * 1.6,
    }));
  }

  function idleFramePlan(frames) {
    const n = frames.length;
    if (n <= 1) return { indexes: [0], freeze: true };
    const scored = poseEnergy(frames).sort((a, b) => a.e - b.e);
    const best = scored[0];
    const second = scored[1];
    if (!second || second.e > 0.12) return { indexes: [best.i], freeze: true };
    const quiet = scored.filter((s) => s.e < 0.09).slice(0, 3);
    const pick = (quiet.length >= 2 ? quiet : scored.slice(0, 2)).map((s) => s.i);
    return { indexes: [...new Set(pick)].sort((a, b) => a - b), freeze: false };
  }

  function moveFps(id, frameCount) {
    if (id === "idle") return frameCount <= 2 ? 1.8 : 2.2;
    if (id === "guard") return 3.2;
    if (id === "walk") return 8;
    if (id === "dash") return 10;
    if (id === "hurt" || id === "air_hurt") return 16;
    return 11;
  }

  function isPlayable(fighter, id) {
    if (id && HIDDEN_HEROES.has(id)) return false;
    if (fighter?.displayName === "努尔哈赤") return false;
    const sprites = fighter?.sprites || {};
    return Boolean(sprites.idle?.file);
  }

  function sortRoster(ids, fighters) {
    const prefer = [P1_DEFAULT, JIANG_ID, DUMMY_ID];
    return [...ids].sort((a, b) => {
      const ia = prefer.indexOf(a);
      const ib = prefer.indexOf(b);
      if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      return (fighters[a]?.displayName || a).localeCompare(fighters[b]?.displayName || b, "zh");
    });
  }

  function rosterStamp(roster) {
    const heroes = (roster?.playable || []).join(",");
    const stages = (roster?.stageIds || [])
      .map((id) => {
        const s = roster?.stages?.[id] || {};
        return `${id}:${s.committedAt || ""}:${s.width || 0}x${s.height || 0}`;
      })
      .join(",");
    return `${heroes}|${stages}`;
  }

  async function fetchRoster(prev = null) {
    const t = Date.now();
    const catalog = await fetch(`/assets/game/index.json?t=${t}`, { cache: "no-store" }).then((r) => r.json());
    const ids = catalog.heroes || [];
    const fighters = { ...(prev?.fighters || {}) };
    await Promise.all(
      ids.map(async (id) => {
        if (fighters[id]?.sprites?.idle) return;
        try {
          fighters[id] = await fetch(`/assets/game/heroes/${id}/fighter.json?t=${t}`, { cache: "no-store" }).then((r) =>
            r.json()
          );
        } catch {
          fighters[id] = null;
        }
      })
    );
    Object.keys(fighters).forEach((id) => {
      if (!ids.includes(id)) delete fighters[id];
    });
    const playable = sortRoster(
      ids.filter((id) => isPlayable(fighters[id], id)),
      fighters
    );
    const stageIds = catalog.stages || [];
    const stages = {};
    await Promise.all(
      stageIds.map(async (id) => {
        try {
          stages[id] = await fetch(`/assets/game/stages/${id}/stage.json?t=${t}`, { cache: "no-store" }).then((r) =>
            r.json()
          );
        } catch {
          stages[id] = { id, displayName: id, file: "stage.png" };
        }
      })
    );
    return { playable, fighters, stageIds, stages };
  }

  function defaultStageCollision() {
    return {
      floors: [{ x: 0, y: 0.84, w: 1, h: 0.06 }],
      platforms: [],
      pits: [],
    };
  }

  function sanitizeCollision(raw) {
    const src = raw && typeof raw === "object" ? raw : {};
    const box = (r, asPit) => {
      const x = Phaser.Math.Clamp(Number(r?.x) || 0, 0, 0.98);
      const y = Phaser.Math.Clamp(Number(r?.y) || 0.84, 0, 0.98);
      const w = Phaser.Math.Clamp(Number(r?.w) || 0.1, 0.02, 1);
      const h = Phaser.Math.Clamp(Number(r?.h) || 0.06, 0.02, 0.5);
      const out = { x, y, w: Math.min(w, 1 - x), h: Math.min(h, 1 - y) };
      if (asPit) out.kill = r?.kill === "ko" ? "ko" : "none";
      return out;
    };
    const floors = Array.isArray(src.floors) ? src.floors.map((r) => box(r, false)) : [];
    const platforms = Array.isArray(src.platforms) ? src.platforms.map((r) => box(r, false)) : [];
    const rawPits = Array.isArray(src.pits) ? src.pits.map((r) => box(r, true)) : [];
    const pits = [];
    rawPits.forEach((p) => {
      if (p.kill === "ko") {
        // 旧地形杀 → 用该矩形自身底边当可站立面，不另造「一人深」空气墙
        const ditchY = Math.min(0.965, Math.max(0.2, p.y + Math.max(0.04, p.h * 0.85)));
        floors.push(box({ x: p.x, y: ditchY, w: p.w, h: 0.05 }, false));
        return;
      }
      pits.push(p);
    });
    if (!floors.length && !platforms.length) return defaultStageCollision();
    return { floors, platforms, pits };
  }

  /** Clamp text to at most `maxLines` after Phaser advanced wrap (needed for CJK). */
  function clampWrappedLines(scene, raw, style, maxWidth, maxLines = 2) {
    const s = String(raw || "").trim();
    if (!s || maxWidth <= 0) return "";
    const wrapStyle = {
      ...style,
      wordWrap: { width: maxWidth, useAdvancedWrap: true },
    };
    const probe = scene.make.text({ x: -9999, y: -9999, text: s, style: wrapStyle });
    let lines = probe.getWrappedText();
    if (lines.length <= maxLines) {
      probe.destroy();
      return s;
    }
    let lo = 0;
    let hi = s.length;
    let best = "…";
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const candidate = `${s.slice(0, mid).replace(/[\s，、。；：！？,.!?;:]+$/u, "")}…`;
      probe.setText(candidate);
      lines = probe.getWrappedText();
      if (lines.length <= maxLines) {
        best = candidate;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    probe.destroy();
    return best;
  }

  function setChrome(mode, text) {
    const selectKeys = document.getElementById("selectKeys");
    const dummyKeys = document.getElementById("dummyKeys") || document.getElementById("fightKeys");
    const pveKeys = document.getElementById("pveKeys");
    const pvpKeys = document.getElementById("pvpKeys");
    const title = document.querySelector("header p");
    if (selectKeys) selectKeys.hidden = mode !== "select";
    if (dummyKeys) dummyKeys.hidden = mode !== "dummy";
    if (pveKeys) pveKeys.hidden = mode !== "pve";
    const cricketKeys = document.getElementById("cricketKeys");
    if (cricketKeys) cricketKeys.hidden = mode !== "cricket";
    if (pvpKeys) pvpKeys.hidden = mode !== "pvp";
    if (title && text) title.textContent = text;
  }

  function setSelectFooter(share, hint, warn) {
    const shareEl = document.getElementById("selectShare");
    const hintEl = document.getElementById("selectHint");
    if (shareEl && share != null) shareEl.textContent = share;
    if (hintEl && hint != null) {
      hintEl.textContent = hint;
      hintEl.classList.toggle("warn", Boolean(warn));
    }
  }

  function emptyPad() {
    return {
      left: false,
      right: false,
      up: false,
      down: false,
      shift: false,
      guard: false,
      justUp: false,
      justDown: false,
      justJ: false,
      justK: false,
      justL: false,
      justShift: false,
    };
  }

  function padFromMsg(msg) {
    return {
      left: !!msg.left,
      right: !!msg.right,
      up: !!msg.up,
      down: !!msg.down,
      shift: !!msg.shift,
      guard: !!msg.guard,
      justUp: !!msg.justUp,
      justDown: !!msg.justDown,
      justJ: !!msg.justJ,
      justK: !!msg.justK,
      justL: !!msg.justL,
      justShift: !!msg.justShift,
    };
  }

  function emptyPvpPicks() {
    return { host: "", guest: "", guest2: "" };
  }

  function rosterCount(seats) {
    return ["host", "guest", "guest2"].reduce((n, s) => n + (seats?.[s] ? 1 : 0), 0);
  }

  function seatLabel(seat) {
    if (seat === "host") return "主机";
    if (seat === "guest2") return "客人2";
    if (seat === "guest") return "客人1";
    return "未连线";
  }

  function sheetInkTop(scene, key) {
    const box = sheetInkBox(scene, key);
    return box ? box.top : 0.12;
  }

  /** Ink AABB inside frame 0, normalized 0–1 (ignores cyan / empty pad). */
  function sheetInkBox(scene, key, frameIndex = 0) {
    const tex = scene.textures.get(key);
    const frame = tex?.get?.(frameIndex);
    if (!frame || !scene.textures.getPixel) return null;
    const w = frame.width || 280;
    const h = frame.height || 672;
    const ox = frame.cutX || 0;
    const oy = frame.cutY || 0;
    const stepY = Math.max(2, Math.floor(h / 120));
    const stepX = Math.max(4, Math.floor(w / 36));
    let minX = w;
    let minY = h;
    let maxX = 0;
    let maxY = 0;
    for (let y = 0; y < h; y += stepY) {
      for (let x = 0; x < w; x += stepX) {
        const p = scene.textures.getPixel(ox + x, oy + y, key);
        if (!p || p.alpha < 28) continue;
        if (p.g > 180 && p.b > 180 && p.r < 90) continue;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
    if (maxY < minY) return null;
    return {
      left: minX / w,
      top: minY / h,
      right: (maxX + 1) / w,
      bottom: (maxY + 1) / h,
      width: (maxX - minX + 1) / w,
      height: (maxY - minY + 1) / h,
      inkW: maxX - minX + 1,
      inkH: maxY - minY + 1,
      frameW: w,
      frameH: h,
    };
  }

  function fitScaleToBox(inkW, inkH, boxW, boxH) {
    const w = Math.max(8, Number(inkW) || 8);
    const h = Math.max(8, Number(inkH) || 8);
    return Math.min(boxW / w, boxH / h);
  }

  const ROSTER_STD_IDLE_H = 560;

  function fighterVisualScale(fighter) {
    let vs = Number(fighter?.visualScale);
    if (!Number.isFinite(vs) || vs <= 0) {
      const guide = Number(fighter?.bodyGuideH);
      vs = guide > 0 ? guide / ROSTER_STD_IDLE_H : 1;
    }
    return Phaser.Math.Clamp(vs, VISUAL_SCALE_MIN, VISUAL_SCALE_MAX);
  }

  function fighterIdleBodyH(fighter, scene, key) {
    const metaH = Number(fighter?.sprites?.idle?.bodyH);
    if (metaH > 8) return metaH;
    const n = Math.max(1, Number(fighter?.sprites?.idle?.frames) || 6);
    if (scene?.textures?.exists?.(key)) {
      return Math.max(8, sheetBodyH(scanSheet(scene, key, n)));
    }
    return ROSTER_STD_IDLE_H;
  }

  /**
   * 选人展台：按当前帧墨迹水平居中、脚钉展台底；尽量铺满高度。
   * 宽度只用躯干，避免轮椅/方天画戟把缩放压扁。
   */
  function rosterHeroLayout(scene, fighter, key, boxW, boxH, frameIndex = 0) {
    const frame = scene.textures.get(key)?.get(frameIndex) || scene.textures.get(key)?.get(0);
    const fw = Math.max(8, frame?.width || 280);
    const fh = Math.max(8, frame?.height || 560);
    const pivot = scene.textures.exists(key) ? scanFrameCached(scene, key, frameIndex) : null;

    const inkMidX = pivot ? pivot.minX + (pivot.w || fw) * 0.5 : fw * 0.5;
    const originX = Phaser.Math.Clamp(inkMidX / fw, 0.12, 0.88);
    const originY = pivot ? Phaser.Math.Clamp((pivot.feetY || fh) / fh, 0.82, 1) : 1;

    const padX = 0.04;
    const padTop = 0.02;
    const padBottom = 0.02;
    const innerW = Math.max(16, boxW * (1 - padX * 2));
    const innerH = Math.max(16, boxH * (1 - padTop - padBottom));

    const bodyH = Math.max(8, pivot?.bodyH || pivot?.h || fighterIdleBodyH(fighter, scene, key));
    let scale = (innerH * 0.98) / bodyH;

    const inkW = Math.max(8, pivot?.w || fw * 0.42);
    const torsoW = Math.max(8, Math.min(inkW, fw * 0.52));
    scale = Math.min(scale, innerW / torsoW);

    return { scale, originX, originY };
  }

  /** 展台转盘：缩放按整套三视图取中位，避免正/侧切帧时忽大忽小。 */
  function rosterShowcaseScale(scene, fighter, key, boxW, boxH) {
    const n = Math.max(1, Number(fighter?.sprites?.turnaround?.frames) || 4);
    if (!scene.textures.exists(key) || n < 2) {
      return rosterHeroLayout(scene, fighter, key, boxW, boxH, 0).scale;
    }
    const bodies = [];
    let maxTorso = 8;
    for (let i = 0; i < n; i++) {
      const pivot = scanFrameCached(scene, key, i);
      bodies.push(Math.max(8, pivot?.bodyH || pivot?.h || 8));
      const fw = scene.textures.get(key)?.get(i)?.width || 280;
      const inkW = Math.max(8, pivot?.w || fw * 0.42);
      maxTorso = Math.max(maxTorso, Math.min(inkW, fw * 0.52));
    }
    const padX = 0.04;
    const innerW = Math.max(16, boxW * (1 - padX * 2));
    const innerH = Math.max(16, boxH * (1 - 0.02 - 0.02));
    let scale = (innerH * 0.98) / Math.max(8, median(bodies));
    return Math.min(scale, innerW / maxTorso);
  }

  /**
   * 工坊三视图播放：正、3/4、侧、背，8fps 循环，不镜像后半圈。
   */
  function showcaseTurnaroundSteps(fighter) {
    const n = Math.max(1, Number(fighter?.sprites?.turnaround?.frames) || 4);
    return [...Array(n).keys()].map((frame) => ({ frame, flip: false }));
  }

  function rosterCardFrontKey(id) {
    return `roster-ta-${id}`;
  }

  function rosterCardPortraitKey(id) {
    return `roster-card-${id}`;
  }

  function rosterCardTexKey(scene, id, fighter) {
    void scene;
    void fighter;
    return rosterCardPortraitKey(id);
  }

  function rosterCardFrontFrame() {
    return 0;
  }

  /** 从 idle/turnaround 第 0 帧算正方形脸框（像素坐标，相对帧左上）。 */
  function rosterPortraitCrop(scene, key, frameIndex = 0, isFront = false) {
    const frame = scene.textures.exists(key) ? scene.textures.get(key)?.get(frameIndex) : null;
    const fw = Math.max(8, frame?.width || 280);
    const fh = Math.max(8, frame?.height || 560);
    const fallbackSize = Math.max(8, Math.round(Math.min(fw, fh) * (isFront ? 0.42 : 0.34)));
    const fallback = {
      cropX: Math.round((fw - fallbackSize) * 0.5),
      cropY: Math.round(fh * (isFront ? 0.02 : 0.05)),
      cropSize: fallbackSize,
    };
    if (!scene.textures.exists(key)) return fallback;

    const ink =
      scanInkBounds(scene, key, frameIndex) ||
      (() => {
        const box = sheetInkBox(scene, key, frameIndex);
        if (!box) return null;
        return {
          minX: Math.round(box.left * fw),
          minY: Math.round(box.top * fh),
          inkW: box.inkW,
          inkH: box.inkH,
        };
      })();
    if (!ink) return fallback;

    let faceCx;
    let faceCy;
    if (isFront) {
      const face = scanFrontFaceCenter(scene, key, frameIndex, ink);
      faceCx = face?.faceCx ?? ink.minX + ink.inkW * 0.5;
      faceCy = face?.faceCy ?? ink.minY + ink.inkH * 0.14;
    } else {
      const face = scanIdleFaceCenter(scene, key, frameIndex, ink);
      faceCx = face?.faceCx ?? ink.minX + ink.inkW * 0.28;
      faceCy = face?.faceCy ?? ink.minY + ink.inkH * 0.15;
    }

    let cropSize = Math.round(
      Math.max(48, Math.min(ink.inkH * (isFront ? 0.34 : 0.3), ink.inkW * (isFront ? 0.62 : 0.42), fw * 0.55))
    );
    const cxBias = isFront ? 0.5 : 0.4;
    const cyBias = isFront ? 0.4 : 0.42;
    let cropX = Math.round(faceCx - cropSize * cxBias);
    let cropY = Math.round(faceCy - cropSize * cyBias);
    cropX = Phaser.Math.Clamp(cropX, 0, Math.max(0, fw - cropSize));
    cropY = Phaser.Math.Clamp(cropY, 0, Math.max(0, fh - cropSize));
    cropSize = Math.min(cropSize, fw - cropX, fh - cropY);

    return { cropX, cropY, cropSize };
  }

  function rosterIdleFaceCrop(scene, key, frameIndex = 0) {
    return rosterPortraitCrop(scene, key, frameIndex, false);
  }

  /**
   * 把 idle 脸框烘焙成与卡槽等大的 Canvas 纹理（等比、不拉伸）。
   * 若已有工坊导出的 select.png（roster-card-{id}）则直接用。
   */
  function bakeRosterCardPortrait(scene, id, fighter, boxW, boxH) {
    const outKey = rosterCardPortraitKey(id);
    const select = fighter?.sprites?.select;
    if (select?.file) {
      return outKey;
    }
    const idle = fighter?.sprites?.idle;
    const ta = fighter?.sprites?.turnaround;
    const taKey = rosterCardFrontKey(id);
    const idleKey = `roster-${id}`;
    const srcKey = scene.textures.exists(taKey) ? taKey : idleKey;
    const isFront = srcKey === taKey;
    const stamp = `${srcKey}:${idle?.committedAt || ""}:${ta?.committedAt || ""}:${boxW}x${boxH}`;
    if (scene.registry.get(`cardBake:${id}`) === stamp && scene.textures.exists(outKey)) {
      return outKey;
    }

    if (!scene.textures.exists(srcKey)) return outKey;

    const tex = scene.textures.get(srcKey);
    const frame = tex.get(0);
    const img = tex.getSourceImage();
    if (!frame || !img) return outKey;

    const crop = rosterPortraitCrop(scene, srcKey, 0, isFront);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(boxW));
    canvas.height = Math.max(1, Math.round(boxH));
    const ctx = canvas.getContext("2d");
    if (!ctx) return outKey;
    ctx.imageSmoothingEnabled = false;
    const sx = (frame.cutX || 0) + crop.cropX;
    const sy = (frame.cutY || 0) + crop.cropY;
    const sw = crop.cropSize;
    ctx.drawImage(img, sx, sy, sw, sw, 0, 0, canvas.width, canvas.height);

    if (scene.textures.exists(outKey)) scene.textures.remove(outKey);
    scene.textures.addCanvas(outKey, canvas);
    scene.registry.set(`cardBake:${id}`, stamp);
    return outKey;
  }

  function invalidateRosterCardPortraits(scene, ids) {
    (ids || []).forEach((id) => {
      scene.registry.remove(`cardBake:${id}`);
      const key = rosterCardPortraitKey(id);
      if (scene.textures.exists(key)) scene.textures.remove(key);
    });
  }

  function loadRosterHeroTextures(scene, loader, id, fighter, bust = "") {
    let queued = 0;
    const select = fighter?.sprites?.select;
    if (select?.file) {
      const cardKey = rosterCardPortraitKey(id);
      if (!scene.textures.exists(cardKey)) {
        const t = select.committedAt
          ? encodeURIComponent(select.committedAt)
          : bust.startsWith("?t=")
            ? bust.slice(3)
            : String(Date.now());
        loader.image(cardKey, `/assets/game/heroes/${id}/${select.file}?t=${t}`);
        queued += 1;
      }
    }
    const idle = fighter?.sprites?.idle;
    if (idle?.file) {
      const key = `roster-${id}`;
      if (!scene.textures.exists(key)) {
        const frames = Math.max(1, idle.frames || 6);
        loader.spritesheet(key, `/assets/game/heroes/${id}/${idle.file}${bust}`, {
          frameWidth: idle.frameWidth,
          frameHeight: idle.frameHeight,
          startFrame: 0,
          endFrame: frames - 1,
        });
        queued += 1;
      }
    }
    const ta = fighter?.sprites?.turnaround;
    if (ta?.file) {
      const taKey = rosterCardFrontKey(id);
      if (!scene.textures.exists(taKey)) {
        const frames = Math.max(1, ta.frames || 4);
        loader.spritesheet(taKey, `/assets/game/heroes/${id}/${ta.file}${bust}`, {
          frameWidth: ta.frameWidth,
          frameHeight: ta.frameHeight,
          startFrame: 0,
          endFrame: frames - 1,
        });
        queued += 1;
      }
    }
    return queued;
  }

  function isChromaPixel(r, g, b, a) {
    if (a < 24) return true;
    if (g > 180 && b > 180 && r < 90) return true;
    return false;
  }

  /** 忽略青底/透明后的角色墨线包围盒（像素坐标）。 */
  function scanInkBounds(scene, key, index = 0) {
    try {
      const tex = scene.textures.get(key);
      const frame = tex?.get?.(index);
      const img = tex?.getSourceImage?.();
      if (!frame || !img || !frame.width || !frame.height) return null;
      const canvas = document.createElement("canvas");
      canvas.width = frame.width;
      canvas.height = frame.height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return null;
      ctx.drawImage(img, frame.cutX, frame.cutY, frame.width, frame.height, 0, 0, frame.width, frame.height);
      const data = ctx.getImageData(0, 0, frame.width, frame.height).data;
      const fw = frame.width;
      const fh = frame.height;
      const step = fw > 240 ? 2 : 1;
      let minX = fw;
      let minY = fh;
      let maxX = 0;
      let maxY = 0;
      for (let y = 0; y < fh; y += step) {
        for (let x = 0; x < fw; x += step) {
          const i = (y * fw + x) * 4;
          if (isChromaPixel(data[i], data[i + 1], data[i + 2], data[i + 3])) continue;
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
      if (maxY < minY) return null;
      return {
        minX,
        minY,
        maxX,
        maxY,
        inkW: maxX - minX + 1,
        inkH: maxY - minY + 1,
        fw,
        fh,
      };
    } catch {
      return null;
    }
  }

  /** turnaround 正脸：在上身中间带找脸心。 */
  function scanFrontFaceCenter(scene, key, frameIndex, ink) {
    try {
      const tex = scene.textures.get(key);
      const frame = tex?.get?.(frameIndex);
      const img = tex?.getSourceImage?.();
      if (!frame || !img) return null;
      const canvas = document.createElement("canvas");
      canvas.width = frame.width;
      canvas.height = frame.height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return null;
      ctx.drawImage(img, frame.cutX, frame.cutY, frame.width, frame.height, 0, 0, frame.width, frame.height);
      const data = ctx.getImageData(0, 0, frame.width, frame.height).data;
      const fw = frame.width;
      const x0 = ink.minX + Math.floor(ink.inkW * 0.28);
      const x1 = ink.minX + Math.floor(ink.inkW * 0.72);
      const y1 = ink.minY + Math.floor(ink.inkH * 0.34);
      let bestY = ink.minY;
      let bestC = 0;
      for (let y = ink.minY; y < y1; y++) {
        let c = 0;
        for (let x = x0; x < x1; x += 2) {
          const i = (y * fw + x) * 4;
          if (isChromaPixel(data[i], data[i + 1], data[i + 2], data[i + 3])) continue;
          c += 1;
        }
        if (c > bestC) {
          bestC = c;
          bestY = y;
        }
      }
      if (bestC < 8) return null;
      const y0 = Math.max(ink.minY, bestY - 10);
      const y2 = ink.minY + Math.floor(ink.inkH * 0.3);
      let sx = 0;
      let sy = 0;
      let n = 0;
      for (let y = y0; y < y2; y++) {
        for (let x = x0; x < x1; x += 2) {
          const i = (y * fw + x) * 4;
          if (isChromaPixel(data[i], data[i + 1], data[i + 2], data[i + 3])) continue;
          sx += x;
          sy += y;
          n += 1;
        }
      }
      if (n < 6) return null;
      return { faceCx: sx / n, faceCy: sy / n };
    } catch {
      return null;
    }
  }

  /** idle 侧脸：在上身左半区找脸心（待机第 0 帧裁头像用）。 */
  function scanIdleFaceCenter(scene, key, frameIndex, ink) {
    try {
      const tex = scene.textures.get(key);
      const frame = tex?.get?.(frameIndex);
      const img = tex?.getSourceImage?.();
      if (!frame || !img) return null;
      const canvas = document.createElement("canvas");
      canvas.width = frame.width;
      canvas.height = frame.height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return null;
      ctx.drawImage(img, frame.cutX, frame.cutY, frame.width, frame.height, 0, 0, frame.width, frame.height);
      const data = ctx.getImageData(0, 0, frame.width, frame.height).data;
      const fw = frame.width;
      const x0 = ink.minX + Math.floor(ink.inkW * 0.12);
      const x1 = ink.minX + Math.floor(ink.inkW * 0.52);
      const y1 = ink.minY + Math.floor(ink.inkH * 0.32);
      let bestY = ink.minY;
      let bestC = 0;
      for (let y = ink.minY; y < y1; y++) {
        let c = 0;
        for (let x = x0; x < x1; x += 2) {
          const i = (y * fw + x) * 4;
          if (isChromaPixel(data[i], data[i + 1], data[i + 2], data[i + 3])) continue;
          c += 1;
        }
        if (c > bestC) {
          bestC = c;
          bestY = y;
        }
      }
      if (bestC < 8) return null;
      const y0 = Math.max(ink.minY, bestY - 10);
      const y2 = ink.minY + Math.floor(ink.inkH * 0.28);
      let sx = 0;
      let sy = 0;
      let n = 0;
      for (let y = y0; y < y2; y++) {
        for (let x = x0; x < x1; x += 2) {
          const i = (y * fw + x) * 4;
          if (isChromaPixel(data[i], data[i + 1], data[i + 2], data[i + 3])) continue;
          sx += x;
          sy += y;
          n += 1;
        }
      }
      if (n < 12) {
        return {
          faceCx: ink.minX + ink.inkW * 0.28,
          faceCy: bestY,
        };
      }
      return { faceCx: sx / n, faceCy: sy / n };
    } catch {
      return null;
    }
  }

  function rosterHeroHeadLayout(scene, fighter, key, boxW, boxH, frameIndex = 0) {
    void fighter;
    const crop = rosterIdleFaceCrop(scene, key, frameIndex);
    const scale = boxW / crop.cropSize;
    return {
      cropX: crop.cropX,
      cropY: crop.cropY,
      cropW: crop.cropSize,
      cropH: crop.cropSize,
      scale,
      frameIndex,
    };
  }

  function ensureRosterAnim(scene, id, fighter) {
    const key = `roster-${id}`;
    if (!scene.textures.exists(key)) return key;
    if (scene.anims.exists(key)) return key;
    const frames = Math.max(1, fighter?.sprites?.idle?.frames || 6);
    scene.anims.create({
      key,
      frames: scene.anims.generateFrameNumbers(key, { start: 0, end: frames - 1 }),
      frameRate: 5,
      repeat: -1,
    });
    return key;
  }

  function setLinearFilter(scene, key) {
    const tex = scene.textures.exists(key) ? scene.textures.get(key) : null;
    if (tex?.setFilter) tex.setFilter(Phaser.Textures.FilterMode.LINEAR);
  }

  function fillFlatTab(g, x, y, w, h, on) {
    paintValleyPanel(g, x, y, w, h, { selected: on, radius: 10, inset: 4 });
  }

  function paintValleyPanel(g, x, y, w, h, opts = {}) {
    const selected = !!opts.selected;
    const accent = opts.accent != null ? opts.accent : 0xd4b06a;
    const r = opts.radius != null ? opts.radius : 12;
    const inset = opts.inset != null ? opts.inset : Math.max(5, Math.round(Math.min(w, h) * 0.055));
    const rawFill = opts.fill;
    const fill =
      rawFill == null || rawFill === 0x1c222c
        ? selected
          ? 0xf6e4b4
          : 0x2a1c12
        : rawFill;
    g.fillStyle(0x120a06, 0.38);
    if (!opts.hollow) g.fillRoundedRect(x + 3, y + 5, w, h, r);
    if (opts.hollow) {
      g.lineStyle(11, selected ? 0x8d5a30 : 0x5a3c24, 1);
      g.strokeRoundedRect(x + 5, y + 5, w - 10, h - 10, Math.max(6, r - 2));
      g.lineStyle(3, 0xf2d090, selected ? 0.9 : 0.45);
      g.strokeRoundedRect(x + 8, y + 8, w - 16, h - 16, Math.max(4, r - 4));
      g.lineStyle(2, 0x1c1008, 0.55);
      g.strokeRoundedRect(x + 2, y + 2, w - 4, h - 4, r);
      g.lineStyle(2, accent, selected ? 0.95 : 0.5);
      g.strokeRoundedRect(x + 1, y + 1, w - 2, h - 2, r);
      return;
    }
    g.fillStyle(selected ? 0x8d5a30 : 0x5a3c24, 1);
    g.fillRoundedRect(x, y, w, h, r);
    g.fillStyle(fill, 1);
    g.fillRoundedRect(x + inset, y + inset, w - inset * 2, h - inset * 2, Math.max(3, r - 4));
    g.lineStyle(2, 0xf2d090, selected ? 0.92 : 0.42);
    g.beginPath();
    g.moveTo(x + 5, y + h - r);
    g.lineTo(x + 5, y + r);
    g.lineTo(x + r, y + 4);
    g.lineTo(x + w - r, y + 4);
    g.strokePath();
    g.lineStyle(2, 0x1c1008, 0.5);
    g.beginPath();
    g.moveTo(x + r, y + h - 4);
    g.lineTo(x + w - r, y + h - 4);
    g.lineTo(x + w - 4, y + h - r);
    g.lineTo(x + w - 4, y + r);
    g.strokePath();
    g.lineStyle(2, accent, selected ? 0.95 : 0.38);
    g.strokeRoundedRect(x + 2, y + 2, w - 4, h - 4, Math.max(4, r - 2));
  }

  function crispUi(text) {
    if (!text || typeof text.setFontFamily !== "function") return text;
    if (typeof text.setResolution === "function") text.setResolution(3);
    if (typeof text.setPadding === "function") text.setPadding(4, 3, 4, 3);
    if (text.texture?.setFilter) text.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
    return text;
  }

  function uiText(scene, x, y, str, style) {
    return crispUi(
      scene.add.text(x, y, str || "", {
        fontFamily: UI_FONT,
        color: "#f4ead0",
        ...style,
      })
    );
  }

  function bakeMysteryHero(scene) {
    const key = "ui-mystery-hero";
    if (scene.textures.exists(key)) return key;
    const w = 128;
    const h = 160;
    const tex = scene.textures.createCanvas(key, w, h);
    const ctx = tex.context || (typeof tex.getContext === "function" ? tex.getContext() : null);
    if (!ctx) return key;
    ctx.fillStyle = "#100c0c";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#1a1418";
    ctx.beginPath();
    ctx.ellipse(w / 2, 46, 26, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(w / 2 - 38, h);
    ctx.quadraticCurveTo(w / 2 - 42, 78, w / 2, 74);
    ctx.quadraticCurveTo(w / 2 + 42, 78, w / 2 + 38, h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#d4b06a";
    ctx.font = "700 58px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("?", w / 2, 78);
    tex.refresh();
    if (tex.setFilter) tex.setFilter(Phaser.Textures.FilterMode.LINEAR);
    return key;
  }

  function strokePlaque(g, x, y, w, h, stroke, fill, thick, radius, gloss) {
    paintValleyPanel(g, x, y, w, h, {
      selected: !!(gloss || (thick || 0) >= 2),
      accent: stroke,
      radius: Math.min(14, radius != null ? radius : 12),
      fill,
      hollow: fill == null,
      inset: Math.max(4, Math.round(Math.min(w, h) * 0.045)),
    });
  }

  function bakeDomainSoftMask(scene) {
    const key = "fx-domain-soft-mask";
    if (scene.textures.exists(key)) return key;
    const w = 640;
    const h = 400;
    const tex = scene.textures.createCanvas(key, w, h);
    const ctx = tex.context || (typeof tex.getContext === "function" ? tex.getContext() : null);
    if (!ctx) return key;
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h / 2);
    // 扁椭圆：更像领域气场，而不是矩形画框
    ctx.scale(1.18, 0.82);
    const r = Math.min(w, h) * 0.42;
    const grd = ctx.createRadialGradient(0, 0, r * 0.08, 0, 0, r);
    grd.addColorStop(0, "rgba(255,255,255,1)");
    grd.addColorStop(0.42, "rgba(255,255,255,0.92)");
    grd.addColorStop(0.68, "rgba(255,255,255,0.48)");
    grd.addColorStop(0.86, "rgba(255,255,255,0.14)");
    grd.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    tex.refresh();
    if (tex.setFilter) tex.setFilter(Phaser.Textures.FilterMode.LINEAR);
    return key;
  }

  function bakeCutinBurst(scene) {
    const key = "ui-cutin-burst";
    if (scene.textures.exists(key)) {
      setLinearFilter(scene, key);
      return key;
    }
    const s = 256;
    const tex = scene.textures.createCanvas(key, s, s);
    const ctx = tex.getContext();
    const cx = s * 0.5;
    const cy = s * 0.46;
    for (let i = 0; i < 42; i++) {
      const a = (i / 42) * Math.PI * 2 + 0.15;
      ctx.strokeStyle = `rgba(255, 228, 150, ${0.1 + (i % 4) * 0.05})`;
      ctx.lineWidth = 2 + (i % 5);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * 22, cy + Math.sin(a) * 18);
      ctx.lineTo(cx + Math.cos(a) * 170, cy + Math.sin(a) * 150);
      ctx.stroke();
    }
    tex.refresh();
    setLinearFilter(scene, key);
    return key;
  }

  let _fierceKanjiSeq = 0;

  /** 奥义字：刀刻感——字距拉开、红黑对半、硬边斜切，避免一团饱和红 */
  function makeSekiroBrushKanji(scene, text, fontSize, opts = {}) {
    const rot = opts.rot ?? -0.07;
    const fill = opts.fill || "#8a1414";
    const hot = opts.hot || "#c42828";
    const tracking = opts.tracking != null ? opts.tracking : Math.round(fontSize * 0.42);
    const chars = Array.from(String(text || ""));
    const n = Math.max(1, chars.length);
    const uid = `fierce-kanji-${++_fierceKanjiSeq}`;
    const cell = fontSize + tracking;
    const padX = Math.ceil(fontSize * 0.7);
    const padY = Math.ceil(fontSize * 0.95);
    const tw = Math.ceil(n * cell - tracking + padX * 2);
    const th = Math.ceil(fontSize * 1.75 + padY * 2);
    const hi = 3;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(8, tw * hi);
    canvas.height = Math.max(8, th * hi);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return scene.add.container(0, 0).setScrollFactor(0);
    }
    ctx.imageSmoothingEnabled = false;
    ctx.setTransform(hi, 0, 0, hi, 0, 0);
    ctx.translate(tw / 2, th / 2);
    ctx.rotate(rot);
    // 刀刻：略拉高、略收窄
    ctx.scale(0.9, 1.22);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `${Math.round(fontSize)}px BrushUI, STKaiti, KaiTi, serif`;
    ctx.lineJoin = "miter";
    ctx.miterLimit = 2;

    const startX = -((n - 1) * cell) / 2;
    const inkAt = (ch, x, dx, dy, color, alpha = 1) => {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.fillText(ch, x + dx, dy);
    };

    // ① 厚黑刀底（主体分量）
    const rim = Math.max(4, Math.round(fontSize * 0.07));
    chars.forEach((ch, i) => {
      const x = startX + i * cell;
      [
        [rim, rim + 1],
        [-rim, rim],
        [rim, -rim],
        [-rim, -rim],
        [0, rim + 2],
        [rim + 2, 0],
        [-rim - 1, 0],
        [0, -rim - 1],
      ].forEach(([dx, dy]) => inkAt(ch, x, dx, dy, "#050203", 1));
    });

    // ② 暗红刻面（偏暗、不饱和，与黑对半）
    chars.forEach((ch, i) => {
      const x = startX + i * cell;
      inkAt(ch, x, 0.5, 0.5, "#2a0808", 1);
      inkAt(ch, x, 0, 0, fill, 1);
    });

    // ③ 单侧刃口高光（只刮一条边，避免整字变亮红块）
    chars.forEach((ch, i) => {
      const x = startX + i * cell;
      inkAt(ch, x, -1.4, -2.0, hot, 0.38);
    });

    // ④ 斜刀黑切：切开红面，露出黑口，红黑交错
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "#030101";
    ctx.lineWidth = Math.max(2.2, fontSize * 0.028);
    ctx.lineCap = "square";
    chars.forEach((ch, i) => {
      const x = startX + i * cell;
      const s = fontSize * 0.48;
      ctx.beginPath();
      ctx.moveTo(x - s * 0.85, -s * 0.55);
      ctx.lineTo(x + s * 0.55, s * 0.7);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - s * 0.15, -s * 0.75);
      ctx.lineTo(x + s * 0.75, s * 0.25);
      ctx.stroke();
    });

    // 阈值硬化 + 边缘啃齿
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = img.data;
    const wpx = canvas.width;
    const hpx = canvas.height;
    const solid = new Uint8Array(wpx * hpx);
    for (let i = 0, p = 0; i < d.length; i += 4, p++) {
      const a = d[i + 3];
      if (a < 52) {
        d[i + 3] = 0;
        continue;
      }
      const r = d[i];
      const g = d[i + 1];
      const b = d[i + 2];
      // 压掉过饱和大红：偏亮的红往暗红收
      if (r > 160 && r > g * 2.2 && r > b * 2.2) {
        d[i] = Math.round(r * 0.62 + 28);
        d[i + 1] = Math.round(g * 0.55 + 6);
        d[i + 2] = Math.round(b * 0.55 + 6);
      }
      // 灰雾边 → 实黑或剔掉
      if (a < 170 && r < 55 && g < 40 && b < 40) {
        if (a > 100) {
          d[i] = 5;
          d[i + 1] = 2;
          d[i + 2] = 2;
          d[i + 3] = 255;
          solid[p] = 1;
        } else {
          d[i + 3] = 0;
        }
        continue;
      }
      d[i + 3] = 255;
      solid[p] = 1;
    }
    for (let y = 1; y < hpx - 1; y++) {
      for (let x = 1; x < wpx - 1; x++) {
        const p = y * wpx + x;
        if (!solid[p]) continue;
        let empty = 0;
        if (!solid[p - 1]) empty++;
        if (!solid[p + 1]) empty++;
        if (!solid[p - wpx]) empty++;
        if (!solid[p + wpx]) empty++;
        if (empty === 0) continue;
        if ((x * 41 + y * 19 + p) % 6 === 0 || empty >= 3) {
          d[p * 4 + 3] = 0;
          solid[p] = 0;
        }
      }
    }
    ctx.putImageData(img, 0, 0);

    if (scene.textures.exists(uid)) {
      try {
        scene.textures.remove(uid);
      } catch {
        /* ignore */
      }
    }
    scene.textures.addCanvas(uid, canvas);
    const spr = scene.add.image(0, 0, uid).setOrigin(0.5).setScrollFactor(0);
    if (spr.texture?.setFilter) spr.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
    return spr;
  }

  function defaultNick(seat) {
    if (seat === "host") return "主机";
    if (seat === "guest") return "客人1";
    if (seat === "guest2") return "客人2";
    return "玩家";
  }

  function wsUrlHint(ips, port) {
    const list = (ips || []).length ? ips : ["<局域网IP>"];
    return list.map((ip) => `http://${ip}:${port || location.port || 8788}`).join(" 或 ");
  }

  function ensureStatusFx(scene) {
    const bake = (key, w, h, paint) => {
      if (scene.textures.exists(key)) scene.textures.remove(key);
      const tex = scene.textures.createCanvas(key, w, h);
      paint(tex.getContext(), w, h);
      tex.refresh();
    };
    bake("status-ember", 16, 16, (ctx, w, h) => {
      const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      g.addColorStop(0, "rgba(255,255,240,0.95)");
      g.addColorStop(0.35, "rgba(255,200,80,0.55)");
      g.addColorStop(1, "rgba(255,80,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    });
    bake("status-flame", 28, 44, (ctx, w, h) => {
      ctx.translate(w / 2, h * 0.72);
      ctx.scale(1, 1.85);
      const g = ctx.createRadialGradient(0, 0, 1, 0, 0, 12);
      g.addColorStop(0, "rgba(255,252,220,0.9)");
      g.addColorStop(0.28, "rgba(255,190,70,0.55)");
      g.addColorStop(0.62, "rgba(255,90,20,0.22)");
      g.addColorStop(1, "rgba(180,20,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();
    });
    bake("status-spark", 18, 18, (ctx, w, h) => {
      const cx = w / 2;
      const cy = h / 2;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 8);
      g.addColorStop(0, "rgba(255,255,255,0.95)");
      g.addColorStop(0.4, "rgba(190,230,255,0.45)");
      g.addColorStop(1, "rgba(140,200,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = "rgba(230,248,255,0.55)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, 3);
      ctx.lineTo(cx, h - 3);
      ctx.moveTo(3, cy);
      ctx.lineTo(w - 3, cy);
      ctx.stroke();
    });
    bake("status-mote", 16, 22, (ctx, w, h) => {
      ctx.translate(w / 2, h / 2);
      ctx.scale(0.75, 1.15);
      const g = ctx.createRadialGradient(0, -1, 0, 0, 0, 8);
      g.addColorStop(0, "rgba(230,255,180,0.7)");
      g.addColorStop(0.45, "rgba(140,210,70,0.28)");
      g.addColorStop(1, "rgba(40,90,20,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function wipeFightAssets(scene) {
    const prefixes = ["p1-", "p2-", "p3-", "hero-voice-"];
    try {
      [...scene.textures.getTextureKeys()].forEach((k) => {
        if (prefixes.some((p) => k.startsWith(p))) scene.textures.remove(k);
      });
    } catch {
      /* ignore */
    }
    try {
      const store = scene.anims?.anims;
      const keys = store && typeof store.keys === "function" ? [...store.keys()] : [];
      keys.forEach((k) => {
        if (prefixes.some((p) => String(k).startsWith(p))) scene.anims.remove(k);
      });
    } catch {
      /* ignore */
    }
    try {
      const sounds = scene.sound?.sounds ? [...scene.sound.sounds] : [];
      sounds.forEach((s) => {
        const k = String(s?.key || "");
        if (!prefixes.some((p) => k.startsWith(p))) return;
        try {
          s.stop();
          s.destroy();
        } catch {
          /* ignore */
        }
      });
    } catch {
      /* ignore */
    }
    try {
      const audio = scene.cache?.audio;
      const keys = typeof audio?.getKeys === "function" ? audio.getKeys() : [];
      keys.forEach((k) => {
        if (prefixes.some((p) => String(k).startsWith(p))) audio.remove(k);
      });
    } catch {
      /* ignore */
    }
  }

  const VOICE_SLOTS = ["select", "intro", "hurt", "super", "win", "defeat"];

  function voiceKey(heroId, lineId) {
    return `hero-voice-${heroId}-${lineId}`;
  }

  function loadFighterSprites(scene, prefix, heroId, fighter) {
    if (!fighter) return;
    const heroRoot = `/assets/game/heroes/${heroId}`;
    Object.entries(fighter.sprites || {}).forEach(([id, spec]) => {
      if (id === "turnaround" || id === "select" || String(id).startsWith("fx_") || !spec.file) return;
      const frames = Math.max(1, spec.frames || 6);
      const bust = encodeURIComponent(spec.committedAt || "1");
      scene.load.spritesheet(`${prefix}-${id}`, `${heroRoot}/${spec.file}?t=${bust}`, {
        frameWidth: spec.frameWidth || 280,
        frameHeight: spec.frameHeight || 672,
        startFrame: 0,
        endFrame: frames - 1,
      });
    });
    const select = fighter.sprites?.select;
    if (select?.file) {
      const bust = encodeURIComponent(select.committedAt || "1");
      scene.load.image(`${prefix}-select`, `${heroRoot}/${select.file}?t=${bust}`);
    }
    Object.entries(fighter.moves || {}).forEach(([move, spec]) => {
      const proj = spec?.projectile;
      if (!proj?.file) return;
      const frames = Math.max(1, proj.frames || 4);
      const fw = proj.frameWidth || 64;
      const fh = proj.frameHeight || 64;
      scene.load.spritesheet(`${prefix}-proj-${move}`, `${heroRoot}/${proj.file}?fw=${fw}&fh=${fh}&n=${frames}`, {
        frameWidth: fw,
        frameHeight: fh,
        startFrame: 0,
        endFrame: frames - 1,
      });
    });
    const lines = fighter.voice?.lines || {};
    VOICE_SLOTS.forEach((id) => {
      const file = lines[id]?.file || `voice/${id}.mp3`;
      const key = voiceKey(heroId, id);
      if (scene.cache.audio.exists(key)) scene.cache.audio.remove(key);
      scene.load.audio(key, `${heroRoot}/${file}?v=voice2`);
    });
    Object.entries(lines).forEach(([id, line]) => {
      if (!id || VOICE_SLOTS.includes(id) || !line?.file || !heroId) return;
      const key = voiceKey(heroId, id);
      if (scene.cache.audio.exists(key)) scene.cache.audio.remove(key);
      scene.load.audio(key, `${heroRoot}/${line.file}`);
    });
  }

  function stageBgmKey(stageId) {
    return `stage-bgm-${stageId}`;
  }

  function queueStageBgm(scene, stageId, stages) {
    const meta = stages?.[stageId];
    const file = meta?.bgm;
    if (!file) return;
    const key = stageBgmKey(stageId);
    if (scene.cache.audio.exists(key)) return;
    const bust = meta?.bgmMeta?.committedAt || meta?.committedAt || Date.now();
    scene.load.audio(key, `/assets/game/stages/${stageId}/${file}?t=${encodeURIComponent(bust)}`);
  }

  function fadeBgmVolume(scene, sound, toVol, ms, onDone) {
    if (!sound) {
      onDone?.();
      return;
    }
    scene.tweens.add({
      targets: sound,
      volume: toVol,
      duration: ms,
      onComplete: () => onDone?.(),
    });
  }

  function playStageBgm(scene, stageId, stages, opts = {}) {
    const key = stageBgmKey(stageId);
    if (!scene.cache.audio.exists(key)) return;
    const vol = opts.volume ?? 0.22;
    const fadeIn = opts.fadeIn ?? 900;
    const fadeOut = opts.fadeOut ?? 500;
    if (scene._stageBgmKey === key && scene._stageBgm?.isPlaying) return;
    const prev = scene._stageBgm;
    scene._stageBgmKey = key;
    const start = () => {
      scene._stageBgm = scene.sound.add(key, { loop: true, volume: 0 });
      scene._stageBgm.play();
      fadeBgmVolume(scene, scene._stageBgm, vol, fadeIn);
    };
    if (prev && prev.isPlaying) {
      fadeBgmVolume(scene, prev, 0, fadeOut, () => {
        prev.stop();
        start();
      });
      return;
    }
    start();
  }

  function killStageBgm(scene) {
    if (!scene) return;
    if (scene._stageBgm) {
      try {
        scene._stageBgm.stop();
        scene._stageBgm.destroy();
      } catch {
        /* ignore */
      }
      scene._stageBgm = null;
    }
    scene._stageBgmKey = "";
    if (scene.sound?.sounds?.length) {
      [...scene.sound.sounds].forEach((s) => {
        if (String(s.key || "").startsWith("stage-bgm-")) {
          s.stop();
          s.destroy();
        }
      });
    }
  }

  function stopStageBgm(scene, fadeOut = 350) {
    const cur = scene._stageBgm;
    if (!cur) return;
    scene._stageBgmKey = "";
    fadeBgmVolume(scene, cur, 0, fadeOut, () => {
      cur.stop();
      cur.destroy();
      if (scene._stageBgm === cur) scene._stageBgm = null;
    });
  }

  const UI_SFX = {
    click: "ui-click",
    clickFirm: "ui-click-firm",
    mapDrawTick: "ui-map-draw-tick",
    mapDrawPick: "ui-map-draw-pick",
    countTick: "ui-count-tick",
    countGo: "ui-count-go",
    resultWin: "ui-result-win",
    resultLose: "ui-result-lose",
    hitLight: "ui-hit-light",
    hitHeavy: "ui-hit-heavy",
    hitWhoosh: "ui-hit-whoosh",
    hitGuard: "ui-hit-guard",
  };

  function loadUiSfx(scene) {
    const root = "/assets/game/ui/sfx";
    Object.entries({
      click: "click.wav",
      clickFirm: "click_firm.wav",
      mapDrawTick: "map_draw_tick.wav",
      mapDrawPick: "map_draw_pick.wav",
      countTick: "count_tick.wav",
      countGo: "count_go.wav",
      resultWin: "result_win.wav",
      resultLose: "result_lose.wav",
      hitLight: "hit_light.wav",
      hitHeavy: "hit_heavy.wav",
      hitWhoosh: "hit_whoosh.wav",
      hitGuard: "hit_guard.wav",
    }).forEach(([slot, file]) => {
      const key = UI_SFX[slot];
      if (scene.cache.audio.exists(key)) return;
      scene.load.audio(key, `${root}/${file}?v=13`);
    });
  }

  function playUiSfx(scene, key, opts = {}) {
    if (!scene?.cache?.audio?.exists(key)) return null;
    return scene.sound.play(key, {
      volume: opts.volume ?? 0.65,
      detune: opts.detune ?? 0,
      rate: opts.rate ?? 1,
    });
  }

  function playUiClick(scene, firm = false) {
    playUiSfx(scene, firm ? UI_SFX.clickFirm : UI_SFX.click, { volume: firm ? 0.88 : 0.72 });
  }

  function playHitSfx(scene, kind = "light") {
    if (!kind) return;
    // light=打到人 | whoosh=技能起手（见 startMove）
    const key = kind === "whoosh" ? UI_SFX.hitWhoosh : UI_SFX.hitLight;
    playUiSfx(scene, key, { volume: kind === "whoosh" ? 1.05 : 1.05 });
  }

  function hitSfxKind(_move, blocked) {
    // 格挡静音；命中一律 hit_light（技能起手的 whoosh 已在 startMove 播过）
    if (blocked) return null;
    return "light";
  }

  function moveVoiceOpts(anim) {
    const voice = VOICE_ON[anim];
    return voice ? { voice } : {};
  }

  function makeAnims(scene, prefix, fighter) {
    const pivots = {};
    const jobs = [];
    Object.entries(fighter?.sprites || {}).forEach(([id, spec]) => {
      if (id === "turnaround" || id === "select" || String(id).startsWith("fx_") || !spec.file) return;
      const frames = Math.max(1, spec.frames || 6);
      const key = `${prefix}-${id}`;
      if (!scene.textures.exists(key)) return;
      pivots[id] = scanSheet(scene, key, frames);
      jobs.push({ id, frames, key });
    });
    jobs.forEach(({ id, frames, key }) => {
      let indexes = [...Array(frames).keys()];
      let yoyo = false;
      let repeatDelay = 0;
      if (id === "idle") {
        const plan = idleFramePlan(pivots[id]);
        indexes = plan.indexes;
        yoyo = !plan.freeze && indexes.length > 1;
        repeatDelay = 240;
      }
      if (!scene.anims.exists(key)) {
        scene.anims.create({
          key,
          frames: indexes.map((frame) => ({ key, frame })),
          frameRate: moveFps(id, indexes.length),
          yoyo,
          repeat: LOOP.has(id) ? -1 : 0,
          repeatDelay: LOOP.has(id) ? repeatDelay : 0,
        });
      }
    });
    Object.entries(fighter?.moves || {}).forEach(([move, spec]) => {
      const proj = spec?.projectile;
      if (!proj?.file) return;
      const key = `${prefix}-proj-${move}`;
      if (!scene.textures.exists(key)) return;
      const frames = Math.max(1, proj.frames || 4);
      proj._pivots = scanSheet(scene, key, frames);
      if (!scene.anims.exists(key)) {
        const mec = mechanicSpec(spec);
        const motion = proj.motion || "forward";
        const vis = mergeProjVisual(proj, mec, motion);
        scene.anims.create({
          key,
          frames: [...Array(frames).keys()].map((frame) => ({ key, frame })),
          frameRate: vis.fps,
          repeat: -1,
        });
      }
    });
    if (!pivots.idle) {
      pivots.idle = [
        { minX: 0, minY: 0, w: 1, h: 1, feetX: 0.5, feetY: 1, originX: 0.5, originY: 1 },
      ];
    }
    return pivots;
  }

  class Actor {
    constructor(scene, prefix, fighter, pivots, x, facing) {
      this.scene = scene;
      this.prefix = prefix;
      this.fighter = fighter;
      this.pivots = pivots;
      this.facing = facing;
      this.attackFacing = 0;
      this.move = "idle";
      this.busy = false;
      this.hitThisMove = false;
      this.ko = false;
      this.hp = BASE_HP;
      this.maxHp = BASE_HP;
      this.mp = BASE_MP;
      this.maxMp = BASE_MP;
      this.sp = BASE_SP;
      this.maxSp = BASE_SP;
      this.voiceCool = {};
      this.voiceGlobalCool = 0;
      this._voiceSound = null;
      this._voicePriority = 0;
      this.heroId = fighter?.id || fighter?.heroId || "";
      this.tint = 0xffffff;
      this.anchor = false;
      this.infinite = false;
      this.mpBanned = false;
      this.moveCdUntil = { skill: 0, combo_up: 0, combo_down: 0, super: 0 };
      this.domainNoDashUntil = 0;
      this.timeLockUntil = 0;
      this.timeLockBank = 0;
      this.timeLockBanking = false;
      this.timeLockX = 0;
      this.timeLockY = 0;
      this.downedUntil = 0;
      this.stunUntil = 0;
      this.rootedUntil = 0;
      this.ailment = "none";
      this.ailmentUntil = 0;
      this.ailmentDotAt = 0;
      this.ailmentSpawnAt = 0;
      this._ailmentTickAt = 0;
      this.statusBits = [];
      this.willKnockdown = false;
      this.airFalling = false;
      this.invulnUntil = 0;
      this.breakoutAt = 0;
      this.projSpawned = false;
      this.poseDone = false;
      this.comboDmg = 0;
      this.comboUntil = 0;
      this.pullPhaseUntil = 0;
      this.jumpsLeft = MAX_JUMPS;
      this._wasGrounded = true;
      this.downScaleMul = 1;
      // idle 站立「躯干核心」→ 屏占比；各招/各帧一律用同一 baseScale（工坊已对齐）
      // onScreenH = SCREEN_H * CHAR_SCREEN * visualScale；visualScale 来自工坊准线/560
      // idleH 必须用躯干核心高（与工坊 body_h 一致），不能用翎羽/方天画戟撑开的整段墨迹，
      // 否则准线 700 的吕布会被羽饰把分母抬高，反而比准线 560 的角色更矮。
      {
        const metaH = Number(fighter?.sprites?.idle?.bodyH);
        const scanned = sheetBodyH(pivots.idle);
        this.idleH = Math.max(8, metaH > 8 ? metaH : scanned);
      }
      {
        let vs = Number(fighter?.visualScale);
        if (!Number.isFinite(vs) || vs <= 0) {
          const guide = Number(fighter?.bodyGuideH);
          vs = guide > 0 ? guide / 560 : 1;
        }
        this.visualScale = Phaser.Math.Clamp(vs, VISUAL_SCALE_MIN, VISUAL_SCALE_MAX);
      }
      this.baseScale = (scene.scale.height * CHAR_SCREEN * CHAR_DISPLAY_SHRINK * this.visualScale) / this.idleH;
      this.moveBodyH = {};
      this.moveScale = {};
      Object.entries(pivots).forEach(([id, frames]) => {
        this.moveBodyH[id] = Math.max(8, sheetBodyH(frames));
        this.moveScale[id] = this.baseScale;
      });
      this.moveBodyH.idle = this.idleH;
      this.moveScale.idle = this.baseScale;
      this.displayScale = this.baseScale;
      this.spawnX = x;
      this.pitFalling = false;
      const spawnY = scene.spawnFloorY ? scene.spawnFloorY(x) : scene.groundY;
      this.sprite = scene.physics.add.sprite(x, spawnY, `${prefix}-idle`, 0);
      this.sprite.setScale(this.displayScale);
      this.sprite.setBounce(0);
      this.sprite.setCollideWorldBounds(true);
      this.sprite.body.setMaxVelocity(1100, 1050);
      this.sprite.body.setAllowGravity(true);
      this.sprite.body.setDragX(820);
      this.sprite.setDepth(2);
      this.sprite.setData("actor", this);
      this.ghost = scene.add.sprite(x, spawnY, `${prefix}-idle`, 0);
      this.ghost.setVisible(false).setAlpha(0).setDepth(1);
      this.ghostTween = null;
      ensureStatusFx(scene);
      this.shell = scene.add.sprite(x, spawnY, `${prefix}-idle`, 0);
      this.shell.setVisible(false).setAlpha(0).setDepth(3);
      this.shell.setBlendMode(Phaser.BlendModes.ADD);
      this.sprite.on("animationupdate", () => {
        this.plantFrame();
        this.maybeSpawnProjectile();
      });
      this.sprite.on("animationcomplete", (anim) => this.onAnimDone(anim));
      this.plantFrame(true);
    }

    has(move) {
      return this.scene.anims.exists(`${this.prefix}-${move}`);
    }

    grounded() {
      if (this.pitFalling) return false;
      const body = this.sprite.body;
      if (!body) return false;
      if (body.velocity.y < -40) return false;
      if (body.blocked.down || body.touching.down) return true;
      const top = this.scene.surfaceTop?.(this.sprite.x, this.sprite.y);
      return top != null && body.velocity.y >= 0 && this.sprite.y >= top - 5 && this.sprite.y <= top + 10;
    }

    stayOnStage() {
      const p = this.sprite;
      const body = p.body;
      if (body) {
        if (this.pullPhaseUntil && this.scene.time.now >= this.pullPhaseUntil) {
          this.pullPhaseUntil = 0;
          body.checkCollision.none = false;
          body.setAllowGravity(true);
        }
        const bounds = this.scene.physics.world.bounds;
        const half = Math.abs(body.halfWidth || body.width * 0.5 || 28);
        const minX = bounds.x + half + 2;
        const maxX = bounds.x + bounds.width - half - 2;
        const clampedX = Phaser.Math.Clamp(p.x, minX, maxX);
        if (clampedX !== p.x) {
          p.x = clampedX;
          if ((p.x <= minX + 0.5 && body.velocity.x < 0) || (p.x >= maxX - 0.5 && body.velocity.x > 0)) {
            p.setVelocityX(0);
          }
        }
        const minY = bounds.y - 8;
        const maxY = bounds.y + bounds.height + 24;
        if (p.y < minY) {
          p.y = minY;
          if (body.velocity.y < 0) p.setVelocityY(0);
        } else if (p.y > maxY) {
          p.y = maxY;
          if (body.velocity.y > 0) p.setVelocityY(0);
        }
        if (!this.reacting() && !this.pitFalling && !(this.pullPhaseUntil && this.scene.time.now < this.pullPhaseUntil)) {
          body.setDragX(this.grounded() ? 820 : 0);
        }
      }
      this.refreshJumps();
      this.tickDashTrail();
      this.scene.ejectFromTerrain?.(this);
      this.scene.tickPit?.(this);
    }

    refreshJumps() {
      const g = this.grounded();
      if (g) {
        this.jumpsLeft = MAX_JUMPS;
        this._wasGrounded = true;
        return;
      }
      if (this._wasGrounded) {
        // 走出平台：保留一次空中跳
        if (this.jumpsLeft >= MAX_JUMPS) this.jumpsLeft = MAX_JUMPS - 1;
        this._wasGrounded = false;
      }
    }

    canJump() {
      return (this.jumpsLeft || 0) > 0 && !this.ko && !this.pitFalling;
    }

    invulnerable() {
      // 只有 invulnUntil（倒地起身瞬间等）才无敌；击飞/趴地/站立常态均可挨打
      return Boolean(this.invulnUntil && this.scene.time.now < this.invulnUntil);
    }

    /** 连击窗口内未击飞：持续锁招，不能立刻还手 */
    comboLocked() {
      if (this.ko || this.willKnockdown || this.airFalling) return false;
      const now = this.scene.time.now;
      if (!(this.comboUntil && now < this.comboUntil && (this.comboDmg || 0) > 0)) return false;
      return true;
    }

    downed() {
      return Boolean(this.downedUntil && this.scene.time.now < this.downedUntil);
    }

    canAct() {
      if (this.ko) return false;
      if (this.pitFalling) return false;
      if (this.airFalling) return false;
      if (this.willKnockdown) return false;
      if (this.downedUntil && this.scene.time.now < this.downedUntil) return false;
      if (this.stunUntil && this.scene.time.now < this.stunUntil) return false;
      if (this.rootedUntil && this.scene.time.now < this.rootedUntil) return false;
      if (this.frozen()) return false;
      if (this.comboLocked()) return false;
      return !this.busy;
    }

    reacting() {
      if (this.airFalling) return true;
      if (this.willKnockdown) return true;
      if (this.downedUntil && this.scene.time.now < this.downedUntil) return true;
      if (this.stunUntil && this.scene.time.now < this.stunUntil) return true;
      if (this.rootedUntil && this.scene.time.now < this.rootedUntil) return true;
      if (this.frozen()) return true;
      return FALL.has(this.move);
    }

    frozen() {
      return this.ailment === "freeze" && this.scene.time.now < this.ailmentUntil;
    }

    immobilized() {
      const now = this.scene.time.now;
      return Boolean((this.rootedUntil && now < this.rootedUntil) || this.frozen());
    }

    airborne() {
      return !this.grounded();
    }

    phasing() {
      return this.move === "dash";
    }

    tickGetUp() {
      if (this.ko) return;
      if (this.airFalling) {
        this.tickDownScaleMul();
        this.plantFrame(false);
        if (this.grounded() && this.sprite.body.velocity.y >= 0) {
          this.airFalling = false;
          this.sprite.setVelocityY(0);
          this.holdDown();
        }
        return;
      }
      if (this.willKnockdown && this.grounded() && this.sprite.body.velocity.y >= -20) {
        this.tickDownScaleMul();
        this.plantFrame(false);
        if (!this.sprite.anims.isPlaying) this.holdDown();
        return;
      }
      if (this.downedUntil && this.scene.time.now >= this.downedUntil) {
        this.downedUntil = 0;
        this.willKnockdown = false;
        // 仅在起身站起来的瞬间给短暂无敌
        this.invulnUntil = this.scene.time.now + GET_UP_INVULN_MS;
        this.busy = false;
        if (this.grounded()) this.startMove("idle", { busy: false });
        return;
      }
      // 倒地动画/趴地期间持续缓放缩
      if (this.downed()) {
        this.tickDownScaleMul();
        this.plantFrame(false);
        return;
      }
      if ((this.downScaleMul || 1) > 1.002) {
        this.tickDownScaleMul();
        this.plantFrame(false);
      }
      if (!this.willKnockdown && this.stunUntil && this.scene.time.now >= this.stunUntil) {
        this.stunUntil = 0;
        const now = this.scene.time.now;
        // 仍在连击窗口：保持 hurt 硬直，不回 idle 还手
        if (this.comboUntil && now < this.comboUntil && (this.comboDmg || 0) > 0) {
          this.busy = true;
          if (FALL.has(this.move) && this.sprite.anims?.isPlaying) this.sprite.anims.pause();
          return;
        }
        this.busy = false;
        if (this.grounded() && (this.move === "hurt" || this.move === "air_hurt")) {
          this.startMove("idle", { busy: false });
        }
      }
      // 连击窗口自然结束且未击飞：解除硬直
      if (
        !this.willKnockdown &&
        !this.airFalling &&
        this.comboUntil &&
        this.scene.time.now >= this.comboUntil &&
        (this.comboDmg || 0) > 0
      ) {
        this.comboDmg = 0;
        this.comboUntil = 0;
        if (FALL.has(this.move)) {
          this.busy = false;
          if (this.grounded()) this.startMove("idle", { busy: false });
        }
      }
    }

    holdDown() {
      this.busy = true;
      this.willKnockdown = false;
      this.airFalling = false;
      this.stunUntil = 0;
      this.comboDmg = 0;
      this.comboUntil = 0;
      this.sp = this.maxSp;
      this.downedUntil = this.scene.time.now + GET_UP_MS;
      // 趴地阶段不预挂无敌；起身时再刷 GET_UP_INVULN_MS
      this.invulnUntil = 0;
      const pose = this.has("knockdown") ? "knockdown" : this.move === "air_hurt" ? "air_hurt" : "hurt";
      if (this.has(pose)) {
        this.move = pose;
        this.poseDone = false;
        const key = `${this.prefix}-${pose}`;
        // 播完整倒地帧，尺度在整段动画里缓入；不跳末帧硬放大
        if (this.sprite.anims.isPaused) this.sprite.anims.resume();
        this.sprite.anims.play({ key, startFrame: 0, repeat: 0 }, false);
      }
      this.tickDownScaleMul();
      this.plantFrame(false);
    }

    isProne() {
      if (this.ko) return true;
      if (this.downedUntil && this.scene.time.now < this.downedUntil) return true;
      if (!FALL.has(this.move) || this.airFalling) return false;
      const pivot = this.pivots[this.move]?.[this.textureIndex()];
      return Boolean(pivot && pivot.h < pivot.w * 0.85);
    }

    tickDownScaleMul() {
      // 全招固定尺度，不再做倒地放大
      this.downScaleMul = 1;
    }

    textureIndex() {
      const name = this.sprite.frame?.name;
      const n = Number(name);
      const raw = Number.isFinite(n) ? n : Number(this.sprite.anims.currentFrame?.textureFrame);
      const last = Math.max(0, (this.pivots[this.move]?.length || 1) - 1);
      if (!Number.isFinite(raw)) return 0;
      return Phaser.Math.Clamp(raw, 0, last);
    }

    poseFrameCount(move) {
      return this.pivots[move]?.length || 1;
    }

    applyMoveFrame(move, index = 0) {
      const key = `${this.prefix}-${move}`;
      if (!this.scene.textures.exists(key)) return;
      const last = Math.max(0, this.poseFrameCount(move) - 1);
      const idx = Phaser.Math.Clamp(index, 0, last);
      this.sprite.setTexture(key, idx, true, false);
      const name = this.sprite.frame?.name;
      if (name === "__BASE" || name === undefined || name === null) this.sprite.setFrame(0, true, false);
      this.plantFrame(true);
    }

    isZhuHero() {
      const id = this.fighter?.id || "";
      const name = this.fighter?.displayName || "";
      return id === ZHU_ID || name.includes("朱元璋");
    }

    /**
     * 工坊已按 idle 头脚准线对齐各招；对战只做「idle → 屏高占比」统一缩放，
     * 不再按单帧/整招墨迹补矮放大。
     */
    poseRefH(pivot) {
      return this.idleH || 8;
    }

    targetScale(_pivot) {
      return this.baseScale;
    }

    /** 朝向：正缩放 + flipX（负 scaleX 会搞坏 Arcade 碰撞体，人会卡出地形） */
    facingSign() {
      return (this.facing || 1) < 0 ? -1 : 1;
    }

    /** 出招锁定的朝向（避免招中途被拨转向导致判定翻到背后） */
    strikeFacing() {
      if (ATTACKS.has(this.move) && this.attackFacing) return this.attackFacing < 0 ? -1 : 1;
      return this.facingSign();
    }

    syncFacingVisual(scaleAbs) {
      const p = this.sprite;
      const shown = Number.isFinite(scaleAbs) ? Math.abs(scaleAbs) : Math.abs(this.displayScale) || this.baseScale;
      p.setScale(shown, shown);
      p.setFlipX(this.strikeFacing() < 0);
      p.setFlipY(false);
    }

    flashGhost() {
      const src = this.sprite;
      if (this.ghostTween) this.ghostTween.stop();
      const shown = Math.abs(src.scaleY) || Math.abs(this.displayScale) || this.baseScale;
      this.ghost.setTexture(src.texture.key, src.frame.name);
      this.ghost.setScale(shown, shown);
      this.ghost.setFlipX(src.flipX);
      this.ghost.setFlipY(false);
      this.ghost.setOrigin(src.originX, src.originY);
      this.ghost.setPosition(src.x, src.y);
      this.ghost.setTint(this.tint);
      this.ghost.setVisible(true).setAlpha(0.4);
      this._ghostFrozen = true;
      this.ghostTween = this.scene.tweens.add({
        targets: this.ghost,
        alpha: 0,
        duration: 120,
        onComplete: () => {
          this.ghost.setVisible(false);
          this._ghostFrozen = false;
        },
      });
    }

    /** 冲刺残影：沿途不断甩出淡出分身 */
    spawnDashAfterimage() {
      const src = this.sprite;
      if (!src?.active) return;
      const shown = Math.abs(src.scaleY) || Math.abs(this.displayScale) || this.baseScale;
      const g = this.scene.add.sprite(src.x, src.y, src.texture.key, src.frame.name);
      g.setDepth(Math.max(0, (src.depth || 2) - 1));
      g.setScale(shown, shown);
      g.setFlipX(src.flipX);
      g.setFlipY(false);
      g.setOrigin(src.originX, src.originY);
      g.setTint(this.tint !== 0xffffff ? this.tint : 0xa8d4ff);
      g.setAlpha(0.55);
      this.scene.tweens.add({
        targets: g,
        alpha: 0,
        x: src.x - this.facingSign() * 18,
        duration: 220,
        ease: "Quad.easeOut",
        onComplete: () => g.destroy(),
      });
    }

    tickDashTrail() {
      if (this.move !== "dash" || this.ko) return;
      const now = this.scene.time.now;
      if (now < (this._dashGhostAt || 0)) return;
      this._dashGhostAt = now + 38;
      this.spawnDashAfterimage();
    }

    clearGhost() {
      if (this.ghostTween) {
        this.ghostTween.stop();
        this.ghostTween = null;
      }
      this._ghostFrozen = false;
      if (this.ghost) this.ghost.setVisible(false).setAlpha(0);
    }

    plantFrame(snap = false) {
      this.tickDownScaleMul();
      const p = this.sprite;
      const index = this.textureIndex();
      const pivot = this.pivots[this.move]?.[index] || this.pivots.idle?.[0];
      if (!pivot) return;
      // 全招全帧同一尺度 = 工坊入库相对比例；仅 idle 保留极轻微呼吸
      this.displayScale = this.baseScale;
      let shown = Math.abs(this.displayScale) || this.baseScale;
      if (this.move === "idle") {
        shown *= 1 + Math.sin(this.scene.time.now / 920) * 0.012;
      }
      this.syncFacingVisual(shown);
      p.setOrigin(pivot.originX, pivot.originY);
      this.syncPushbox(pivot);
      this.tickAilment();
      this.maybeSpawnProjectile();
    }

    syncPushbox(pivot) {
      const p = this.sprite;
      const s = Math.abs(p.scaleX) || 0.01;
      const prone = this.isProne();
      const srcW = (prone ? PUSH_PRONE_W : PUSH_W) / s;
      const srcH = (prone ? PUSH_PRONE_H : PUSH_H) / s;
      const feetX = pivot.originX * p.frame.width;
      const feetY = pivot.originY * p.frame.height;
      const flipped = this.strikeFacing() < 0;
      const left = flipped ? p.frame.width - feetX - srcW / 2 : feetX - srcW / 2;
      p.body.setSize(srcW, srcH, false);
      p.body.setOffset(left, feetY - srcH);
    }

    worldHurt() {
      const p = this.sprite;
      const index = this.textureIndex();
      const pivot = this.pivots[this.move]?.[index] || this.pivots.idle?.[0];
      if (!pivot) return new Phaser.Geom.Rectangle(p.x - 20, p.y - 80, 40, 80);
      const s = Math.abs(p.scaleX);
      const minX = pivot.minX;
      const maxX = pivot.minX + pivot.w;
      let left;
      let right;
      if (this.strikeFacing() < 0) {
        left = p.x - (maxX - pivot.feetX) * s;
        right = p.x - (minX - pivot.feetX) * s;
      } else {
        left = p.x + (minX - pivot.feetX) * s;
        right = p.x + (maxX - pivot.feetX) * s;
      }
      const top = p.y + (pivot.minY - pivot.feetY) * s;
      return new Phaser.Geom.Rectangle(left, top, Math.max(8, right - left), Math.max(8, p.y - top));
    }

    emitPoint(origin, aimX) {
      const vis = this.worldHurt();
      const facing = this.strikeFacing();
      const aheadX = this.sprite.x + facing * 210;
      const floorY = this.scene.groundYAt?.(this.sprite.x) ?? this.scene.groundY;
      if (origin === "front_up") {
        const cam = this.scene.cameras.main;
        return {
          x: this.sprite.x + facing * Math.max(78, vis.width * 0.72 + 40),
          y: Phaser.Math.Clamp(
            vis.top + vis.height * 0.08,
            cam.scrollY + 72,
            vis.top + vis.height * 0.28
          ),
        };
      }
      if (origin === "front_down") {
        return {
          x: this.sprite.x + facing * Math.max(70, vis.width * 0.68 + 32),
          y: Math.min(vis.bottom - 6, floorY - 16),
        };
      }
      if (origin === "sky") {
        return { x: Number.isFinite(aimX) ? aimX : aheadX, y: 8 };
      }
      if (origin === "air") {
        return {
          x: Number.isFinite(aimX) ? aimX : aheadX,
          y: floorY - this.scene.scale.height * 0.4,
        };
      }
      if (origin === "feet") {
        return { x: this.sprite.x + facing * 70, y: floorY };
      }
      if (origin === "ahead") {
        return { x: this.sprite.x + facing * 150, y: floorY };
      }
      const y = vis.top + vis.height * 0.34;
      const x = facing > 0 ? vis.right + 1 : vis.left - 1;
      return { x, y };
    }

    applyAilment(kind, strength) {
      if (!kind || kind === "none") return;
      const s = Number.isFinite(strength) ? strength : 1;
      const now = this.scene.time.now;
      const dur =
        kind === "freeze" ? 900 + 400 * s : kind === "poison" ? 3200 + 900 * s : 2800 + 900 * s;
      this.ailment = kind;
      this.ailmentUntil = now + Math.round(dur);
      this.ailmentDotAt = now + 220;
      this.ailmentSpawnAt = now;
      if (kind === "freeze") {
        this.sprite.anims.pause();
        this.sprite.setVelocityX(0);
      }
      this.refreshAilmentTint();
    }

    clearAilment() {
      this.ailment = "none";
      this.ailmentUntil = 0;
      this.sprite.clearTint();
      if (this.tint !== 0xffffff) this.sprite.setTint(this.tint);
      if (this.shell) this.shell.setVisible(false).setAlpha(0);
      this.statusBits.forEach((bit) => bit.destroy());
      this.statusBits = [];
    }

    refreshAilmentTint() {
      if (this.frozen()) {
        this.sprite.setTint(0xe8f3ff);
        return;
      }
      if (this.ailment === "burn" && this.scene.time.now < this.ailmentUntil) {
        this.sprite.setTint(0xffe6d4);
        return;
      }
      if (this.ailment === "poison" && this.scene.time.now < this.ailmentUntil) {
        this.sprite.setTint(0xeef6dc);
        return;
      }
      this.sprite.clearTint();
      if (this.tint !== 0xffffff) this.sprite.setTint(this.tint);
    }

    syncAilmentShell() {
      const src = this.sprite;
      const on = this.ailment !== "none" && this.scene.time.now < this.ailmentUntil;
      if (!on) {
        this.shell.setVisible(false);
        return;
      }
      const pulse = 0.5 + 0.5 * Math.sin(this.scene.time.now / 220);
      this.shell.setTexture(src.texture.key, src.frame.name);
      this.shell.setOrigin(src.originX, src.originY);
      this.shell.setFlipX(src.flipX);
      this.shell.setFlipY(false);
      this.shell.setPosition(src.x, src.y);
      this.shell.setScale(Math.abs(src.scaleX) * 1.03, Math.abs(src.scaleY) * 1.03);
      this.shell.setVisible(true);
      if (this.ailment === "freeze") {
        this.shell.setTintFill(0xc8e8ff);
        this.shell.setAlpha(0.1 + 0.04 * pulse);
      } else if (this.ailment === "burn") {
        this.shell.setTintFill(0xff7a28);
        this.shell.setAlpha(0.11 + 0.05 * pulse);
      } else {
        this.shell.setTintFill(0x9ad84a);
        this.shell.setAlpha(0.09 + 0.04 * pulse);
      }
    }

    spawnStatusBit(kind) {
      const hurt = this.worldHurt();
      let key = "status-ember";
      let color = 0xffffff;
      let scale = 0.7;
      let vx = 0;
      let vy = 0;
      let x = hurt.centerX;
      let y = hurt.centerY;
      let originY = 0.5;
      if (kind === "burn") {
        const flame = Math.random() < 0.55;
        key = flame ? "status-flame" : "status-ember";
        color = flame ? 0xffffff : [0xffe08a, 0xff9a40][Phaser.Math.Between(0, 1)];
        scale = flame ? Phaser.Math.FloatBetween(0.45, 0.75) : Phaser.Math.FloatBetween(0.35, 0.55);
        x = hurt.left + hurt.width * Phaser.Math.FloatBetween(0.2, 0.8);
        y = hurt.bottom - hurt.height * Phaser.Math.FloatBetween(0.02, 0.45);
        vx = Phaser.Math.FloatBetween(-10, 10);
        vy = Phaser.Math.FloatBetween(-70, -36);
        originY = flame ? 1 : 0.5;
      } else if (kind === "poison") {
        key = "status-mote";
        color = [0xd8f090, 0xb4e05a][Phaser.Math.Between(0, 1)];
        scale = Phaser.Math.FloatBetween(0.4, 0.7);
        x = hurt.left + hurt.width * Phaser.Math.FloatBetween(0.25, 0.75);
        y = hurt.top + hurt.height * Phaser.Math.FloatBetween(0.2, 0.7);
        vx = Phaser.Math.FloatBetween(-8, 8);
        vy = Math.random() < 0.35 ? Phaser.Math.FloatBetween(18, 36) : Phaser.Math.FloatBetween(-36, -16);
      } else {
        key = "status-spark";
        color = 0xffffff;
        scale = Phaser.Math.FloatBetween(0.22, 0.38);
        x = hurt.left + hurt.width * Phaser.Math.FloatBetween(0.1, 0.9);
        y = hurt.top + hurt.height * Phaser.Math.FloatBetween(0.1, 0.85);
        vx = Phaser.Math.FloatBetween(-6, 6);
        vy = Phaser.Math.FloatBetween(8, 22);
      }
      if (!this.scene.textures.exists(key)) return;
      const bit = this.scene.add.image(x, y, key).setDepth(6);
      bit.setTint(color);
      bit.setBlendMode(Phaser.BlendModes.ADD);
      bit.setScale(scale);
      bit.setOrigin(0.5, originY);
      bit.setAlpha(kind === "burn" ? 0.85 : 0.7);
      bit.vx = vx;
      bit.vy = vy;
      bit.phase = Math.random() * Math.PI * 2;
      bit.baseScale = scale;
      this.statusBits.push(bit);
      const cap = kind === "freeze" ? 4 : kind === "burn" ? 10 : 7;
      while (this.statusBits.length > cap) this.statusBits.shift().destroy();
    }

    tickAilment() {
      const now = this.scene.time.now;
      if (this.ailment !== "none" && now >= this.ailmentUntil) {
        const wasFreeze = this.ailment === "freeze";
        this.clearAilment();
        if (wasFreeze && this.sprite.anims.isPaused && !this.willKnockdown && !this.downedUntil) {
          this.sprite.anims.resume();
        }
      }
      this.syncAilmentShell();
      if (this._ailmentTickAt === now) return;
      this._ailmentTickAt = now;
      if (this.ko || this.ailment === "none" || now >= this.ailmentUntil) {
        this.statusBits.forEach((bit) => {
          bit.alpha -= 0.08;
          if (bit.alpha <= 0) bit.destroy();
        });
        this.statusBits = this.statusBits.filter((bit) => bit.active);
        return;
      }
      if (this.frozen()) {
        this.sprite.setVelocityX(0);
        this.sprite.anims.pause();
        this.sprite.setTint(0xe8f3ff);
      } else if (this.ailment === "burn") {
        const t = 0.5 + 0.5 * Math.sin(now / 240);
        this.sprite.setTint(t > 0.55 ? 0xffe2cc : 0xfff4ea);
      } else if (this.ailment === "poison") {
        const t = 0.5 + 0.5 * Math.sin(now / 320);
        this.sprite.setTint(t > 0.55 ? 0xe6f0d0 : 0xf5fae8);
      }
      const gap = this.ailment === "burn" ? 90 : this.ailment === "poison" ? 130 : 280;
      if (now >= this.ailmentSpawnAt) {
        this.ailmentSpawnAt = now + gap;
        this.spawnStatusBit(this.ailment);
      }
      const dt = this.scene.game.loop.delta / 1000;
      this.statusBits.forEach((bit) => {
        bit.phase += dt * 3;
        bit.x += bit.vx * dt + Math.sin(bit.phase) * 10 * dt;
        bit.y += bit.vy * dt;
        const life = Math.max(0, bit.alpha);
        bit.setScale(bit.baseScale * (0.65 + 0.35 * life));
        bit.alpha -= dt * (this.ailment === "freeze" ? 0.55 : this.ailment === "burn" ? 0.7 : 0.5);
      });
      this.statusBits = this.statusBits.filter((bit) => {
        if (bit.alpha <= 0 || !bit.active) {
          bit.destroy();
          return false;
        }
        return true;
      });
      const dotEvery = this.ailment === "poison" ? 480 : 360;
      if ((this.ailment === "burn" || this.ailment === "poison") && now >= this.ailmentDotAt) {
        this.ailmentDotAt = now + dotEvery;
        const dmg = this.ailment === "burn" ? 2 : 1;
        if (!this.infinite) this.hp = Math.max(0, this.hp - dmg);
        if (!this.infinite && this.hp <= 0 && !this.ko) {
          this.ko = true;
          this.busy = true;
          this.clearAilment();
          this.startMove("defeat_cg", { voice: "defeat", busy: true });
          this.scene.noteKo?.(this);
        }
      }
    }

    playVoice(id) {
      const hid = this.heroId;
      const key = hid ? voiceKey(hid, id) : `${this.prefix}-voice-${id}`;
      if (!this.scene.cache.audio.exists(key)) return false;
      this._voicePlaying = this._voicePlaying || {};
      const live = this._voicePlaying[id];
      if (live?.isPlaying) return false;
      const now = this.scene.time.now;
      if (id === "hurt" && (this.voiceCool.hurt || 0) > now) return false;
      if (id === "hurt") this.voiceCool.hurt = now + 420;
      const volume = id === "super" || id === "intro" || id === "win" || id === "defeat" ? 1 : id === "hurt" ? 0.96 : 0.9;
      const snd = this.scene.sound.add(key, { volume });
      this._voicePlaying[id] = snd;
      snd.once("complete", () => {
        try {
          snd.destroy();
        } catch {
          /* ignore */
        }
        if (this._voicePlaying[id] === snd) delete this._voicePlaying[id];
      });
      snd.play();
      return true;
    }

    startMove(move, { voice, busy = true } = {}) {
      if (this.ko && move !== "defeat_cg" && move !== "win_cg") return false;
      const resolved =
        this.has(move)
          ? move
          : move === "air_hurt" && this.has("hurt")
            ? "hurt"
            : move === "knockdown" || move === "defeat_cg"
              ? this.has("hurt")
                ? "hurt"
                : ""
              : "";
      if (!resolved || !this.has(resolved)) return false;
      if (this.move === resolved && LOOP.has(resolved) && this.sprite.anims.isPlaying) {
        this.busy = busy;
        return true;
      }
      if (this.move !== resolved && !FALL.has(resolved) && !LOOP.has(resolved) && resolved !== "super") {
        this.flashGhost();
      }
      this.move = resolved;
      this.hitThisMove = false;
      this.projSpawned = false;
      this.poseDone = false;
      // 攻击招式锁定出招朝向，左右判定一致
      this.attackFacing = ATTACKS.has(resolved) ? this.facingSign() : 0;
      // 倒地/受击帧不要清掉趴地计时，否则会丢掉无敌
      if (resolved !== "knockdown" && resolved !== "hurt" && resolved !== "air_hurt") {
        this.downedUntil = 0;
      }
      if (resolved !== "air_hurt" && resolved !== "hurt") {
        this.airFalling = false;
        this.willKnockdown = false;
        this.stunUntil = 0;
        if (this.sprite.body) {
          const airMove = resolved === "jump" || resolved === "air_attack";
          this.sprite.body.setDragX(airMove ? 0 : 820);
        }
      }
      const key = `${this.prefix}-${resolved}`;
      this.applyMoveFrame(resolved, 0);
      if (this.sprite.anims.isPaused) this.sprite.anims.resume();
      this.sprite.anims.play({ key, startFrame: 0, skipMissedFrames: false }, LOOP.has(resolved));
      this.applyMoveFrame(resolved, this.textureIndex());
      this.busy = busy;
      this._moveAt = this.scene.time.now;
      if (resolved === "dash" && DASH_IFRAMES_MS > 0) {
        this.invulnUntil = Math.max(this.invulnUntil || 0, this.scene.time.now + DASH_IFRAMES_MS);
      }
      if (this.frozen()) this.sprite.anims.pause();
      if (voice) this.playVoice(voice);
      if (isSkillSfxMove(resolved)) {
        playUiSfx(this.scene, UI_SFX.hitWhoosh, { volume: 1.05 });
      }
      if (resolved === "super") this.scene.beginSuperCutin?.(this);
      return true;
    }

    onAnimDone(anim) {
      const move = (anim.key || "").replace(`${this.prefix}-`, "");
      if (move === "opening_cg") this.playVoice("intro");
      if (move === "defeat_cg" || move === "win_cg") {
        this.busy = true;
        this.poseDone = true;
        this.scene.onCinePoseDone?.();
        return;
      }
      if (move === "air_hurt") {
        if (this.willKnockdown && (!this.grounded() || this.sprite.body.velocity.y < -40)) {
          this.airFalling = true;
          this.busy = true;
          if (this.sprite.anims.isPlaying) this.sprite.anims.pause();
          return;
        }
        if (this.willKnockdown) {
          this.holdDown();
          return;
        }
        this.busy = false;
        if (this.grounded()) this.startMove("idle", { busy: false });
        return;
      }
      if (move === "hurt" || move === "knockdown") {
        if (this.downed()) {
          // 倒地动画播完停在末帧，尺度已在前面各帧缓入
          this.applyMoveFrame(this.move, this.poseFrameCount(this.move) - 1);
          this.sprite.anims.pause();
          this.plantFrame(false);
          return;
        }
        if (this.willKnockdown || move === "knockdown") {
          this.holdDown();
          return;
        }
        this.busy = false;
        if (this.grounded()) this.startMove("idle", { busy: false });
        return;
      }
      if (!LOOP.has(move) && move !== "jump") this.busy = false;
    }

    attacking() {
      if (!ATTACKS.has(this.move) || this.hitThisMove) return false;
      // 命中硬直把动画暂停时仍算攻击判定，避免卡在暂停帧丢伤害
      const n = this.pivots[this.move]?.length || 6;
      const index = this.textureIndex();
      const start = n <= 2 ? 0 : Math.max(0, Math.floor(n * 0.08));
      const end = Math.max(start, Math.ceil(n * 0.92));
      return index >= start && index <= end;
    }

    /** 防止 freezeHit / cutin 导致攻击动画永久暂停；并兜底卡死 busy */
    ensureAttackAnimLive() {
      if (!ATTACKS.has(this.move) || this.ko) return;
      const now = this.scene.time.now;
      const anims = this.sprite?.anims;
      if (anims?.isPaused) {
        if (!this._attackPauseAt) this._attackPauseAt = now;
        if (now - this._attackPauseAt > 220) {
          anims.resume();
          this._attackPauseAt = 0;
        }
      } else {
        this._attackPauseAt = 0;
      }
      if (this.scene.cutinActive || this.scene.hitstop) return;
      if (this.busy && this._moveAt && now - this._moveAt > 1800) {
        this.busy = false;
      }
    }

    attackBox() {
      const vis = this.worldHurt();
      const extra = moveSpec(this.fighter, this.move).reach;
      const top = vis.top - 16;
      const h = Math.max(48, vis.height + 28);
      const face = this.strikeFacing();
      const core = this.sprite.x;
      // 左右对称：从身体中线向前伸出（含贴图像素前沿 + reach）
      let near;
      let tip;
      if (face > 0) {
        near = Math.min(vis.centerX, core) - 14;
        tip = Math.max(vis.right, core + 24) + extra;
      } else {
        near = Math.max(vis.centerX, core) + 14;
        tip = Math.min(vis.left, core - 24) - extra;
      }
      const left = Math.min(near, tip);
      const right = Math.max(near, tip);
      return new Phaser.Geom.Rectangle(left, top, Math.max(56, right - left), h);
    }

    takeHit(move, dir, fromSpec) {
      if (this.ko) return;
      if (this.invulnerable()) return;
      const specFull = fromSpec || moveSpec(null, move);
      const dmg = specFull.damage || moveDamage(move);
      const now = this.scene.time.now;
      // 霍金时间凝滞：只记账，无击退/无受击动作，结束时一并爆发
      if (this.timeLockBanking && now < (this.timeLockUntil || 0) && !specFull.timeLockBurst) {
        if (dmg > 0) this.timeLockBank = (this.timeLockBank || 0) + dmg;
        return;
      }
      // 趴地可被追打但减伤，避免完全无敌；起身瞬间才有短暂无敌
      if (this.downed() || this.move === "knockdown") {
        if (!this.infinite && dmg > 0) {
          this.hp = Math.max(0, this.hp - Math.max(1, Math.floor(dmg * 0.35)));
        }
        if (!this.infinite && this.hp <= 0) {
          this.hp = 0;
          this.ko = true;
          this.busy = true;
          this.stunUntil = 0;
          this.rootedUntil = 0;
          this.willKnockdown = false;
          this.clearAilment();
          this.startMove("defeat_cg", { voice: "defeat", busy: true });
          this.scene.noteKo?.(this);
        }
        return;
      }
      // 奥义可被普攻 / 小技能打断：先清掉 cutin 与己方奥义弹道
      const canInterruptSuper =
        isLightAttack(move) || move === "skill" || move === "combo_up" || move === "combo_down";
      if (canInterruptSuper && (this.move === "super" || this.scene._cutinActor === this)) {
        this.scene.interruptActorSuper?.(this);
      }
      const wasGrounded = this.grounded();
      const spec = specFull.hit || moveHit(move);
      if (now > (this.comboUntil || 0)) this.comboDmg = 0;
      if (dmg > 0) {
        this.comboDmg = (this.comboDmg || 0) + dmg;
        this.comboUntil = now + COMBO_WINDOW_MS;
      }
      const forceLaunch = specFull.timeLockBurst
        ? Boolean(specFull.forceLaunch)
        : isSuperMove(move) || (dmg > 0 && this.comboDmg >= COMBO_LAUNCH_DMG);
      if (!this.infinite && dmg > 0) this.hp = Math.max(0, this.hp - dmg);
      this.willKnockdown = forceLaunch;
      this.stunUntil = forceLaunch ? 0 : now + Math.max(spec.stun || 360, dmg > 0 ? 460 : 200);
      this.airFalling = forceLaunch;
      this.downedUntil = 0;
      this.sprite.body.blocked.down = false;
      this.sprite.body.touching.down = false;
      let knock = spec.knock;
      let lift = spec.lift;
      if (forceLaunch) {
        knock = Math.max(knock, 380);
        lift = Math.min(lift, -680);
        this.comboDmg = 0;
        this.comboUntil = 0;
      }
      if (lift < -80) this.sprite.y = Math.min(this.sprite.y, this.scene.supportY?.(this) ?? this.scene.groundY) - 16;
      this.sprite.body.setDragX(this.willKnockdown ? 540 : 980);
      this.sprite.setVelocity(dir * knock, lift);
      this.scene.ejectFromTerrain?.(this);
      if (!this.infinite && this.hp <= 0) {
        this.ko = true;
        this.busy = true;
        this.stunUntil = 0;
        this.rootedUntil = 0;
        this.willKnockdown = false;
        this.clearAilment();
        this.startMove("defeat_cg", { voice: "defeat", busy: true });
        this.scene.noteKo?.(this);
        return;
      }
      // 贴图按「挨打前」是否站地选：落地轻击用 hurt；已在空中或击飞用 air_hurt。
      // 不能在清掉 grounded / 加上 lift 后再测 —— 几乎总会误判成空中受击。
      const aerial = forceLaunch || this.airFalling || !wasGrounded;
      const pose = aerial && this.has("air_hurt") ? "air_hurt" : "hurt";
      this.startMove(pose, { busy: true });
      this.playVoice("hurt");
      this.applyMoveFrame(this.move, 0);
      if (!this.willKnockdown) this.sprite.anims.pause();
      this.sprite.setTintFill(0xffffff);
      this.scene.time.delayedCall(70, () => {
        this.refreshAilmentTint();
      });
    }

    maybeSpawnProjectile() {
      if (this.scene.cutinActive || this.scene.cine || this.scene.over) return;
      if (this.projSpawned || !ATTACKS.has(this.move)) return;
      const spec = moveSpec(this.fighter, this.move);
      const proj = spec.projectile;
      if (!proj?.file) return;
      const key = `${this.prefix}-proj-${this.move}`;
      if (!this.scene.textures.exists(key)) return;
      const n = this.pivots[this.move]?.length || 6;
      const index = this.textureIndex();
      const gate = Math.max(0, Math.floor(n * (proj.spawnFrame ?? 0.35)));
      if (index < gate) return;
      this.projSpawned = true;
      this.scene.spawnProjectile(this, this.move, spec);
    }
  }

  class Boot extends Phaser.Scene {
    constructor() {
      super("boot");
    }

    async create() {
      try {
        if (document.fonts?.load) {
          await Promise.all([
            document.fonts.load("24px GameUI"),
            document.fonts.load("24px BodyUI"),
            document.fonts.load("64px BrushUI"),
            document.fonts.load("120px BrushUI"),
          ]);
          await document.fonts.ready;
        }
      } catch {
        /* PingFang fallback */
      }
      let roster;
      try {
        roster = await fetchRoster();
      } catch {
        this.add.text(40, 40, "读不到 assets/game/index.json。", { fontSize: 18, color: "#f88" });
        return;
      }
      if (!roster.playable.length || !roster.stageIds.length) {
        this.add.text(40, 40, "assets/game 里还没有可玩的英雄或地图。", { fontSize: 18, color: "#f88" });
        return;
      }
      this.registry.set("roster", roster);
      this.scene.start("select");
    }
  }

  class Select extends Phaser.Scene {
    constructor() {
      super("select");
    }

    preload() {
      loadUiSfx(this);
      const roster = this.registry.get("roster") || {};
      const { playable = [], fighters = {}, stageIds = [], stages = {} } = roster;
      playable.forEach((id) => {
        loadRosterHeroTextures(this, this.load, id, fighters[id] || {});
        const vkey = `select-voice-${id}`;
        if (!this.cache.audio.exists(vkey)) {
          const selectFile = fighters[id]?.voice?.lines?.select?.file || "voice/select.mp3";
          this.load.audio(vkey, `/assets/game/heroes/${id}/${selectFile}`);
        }
      });
      stageIds.forEach((id) => {
        const key = `stage-thumb-${id}`;
        if (this.textures.exists(key)) return;
        const file = stages[id]?.file || "stage.png";
        const bust = stages[id]?.committedAt || Date.now();
        this.load.image(key, `/assets/game/stages/${id}/${file}?t=${encodeURIComponent(bust)}`);
      });
    }

    create() {
      killStageBgm(this);
      const roster = this.registry.get("roster") || {};
      this.playable = roster.playable || [];
      this.fighters = roster.fighters || {};
      this.stageIds = roster.stageIds || [];
      this.stages = roster.stages || {};
      const w = this.scale.width;
      const h = this.scale.height;
      const wantP1 = queryParam("p1") || P1_DEFAULT;
      const wantP2 = queryParam("p2") || DUMMY_ID;
      this.p1Index = Math.max(0, this.playable.indexOf(wantP1));
      this.p2Index = Math.max(0, this.playable.indexOf(wantP2));
      if (this.playable.indexOf(wantP1) < 0) this.p1Index = 0;
      if (this.playable.indexOf(wantP2) < 0) {
        const dummyAt = this.playable.indexOf(DUMMY_ID);
        this.p2Index = dummyAt >= 0 ? dummyAt : Math.min(1, this.playable.length - 1);
      }
      this.slot = "p1";
      this.hoverIndex = -1;
      this._selectVoiceCool = 0;
      this.locked = false;
      this.drawingMap = false;
      const wantStage = queryParam("stage");
      this.stageIndex = Math.max(0, this.stageIds.indexOf(wantStage));
      if (this.stageIds.indexOf(wantStage) < 0) this.stageIndex = 0;
      this.stageConfirmed = !this.stageIds.length;
      const wantMode = queryParam("mode");
      this.mode = wantMode === "pve" || wantMode === "pvp" || wantMode === "cricket" ? wantMode : "dummy";
      this.cpuDiff = loadCpuDiff();
      this.pvpSeat = "";
      this.pvpRoom = "";
      this.pvpPeerHero = "";
      this.pvpPicks = emptyPvpPicks();
      this.pvpSeats = { host: false, guest: false, guest2: false };
      this.pvpProfiles = {
        host: { nick: "主机", ready: false, heroId: "" },
        guest: { nick: "客人1", ready: false, heroId: "" },
        guest2: { nick: "客人2", ready: false, heroId: "" },
      };
      this.pvpStatus = "";
      this.lanIps = [];
      this.lanPort = Number(location.port) || 8788;
      fetch("/api/lan")
        .then((r) => r.json())
        .then((info) => {
          this.lanIps = info.ips || [];
          this.lanPort = info.port || this.lanPort;
          this.refresh();
        })
        .catch(() => {});
      const existingNet = this.registry.get("net");
      const resume = this.registry.get("pvpResume");
      if (existingNet?.connected) {
        this.mode = "pvp";
        this.pvpSeat = existingNet.seat || "";
        this.pvpRoom = existingNet.room || this.pvpRoom;
        this.pvpSeats[this.pvpSeat] = true;
        this.ensureProfile(this.pvpSeat).nick = this.localNick() || defaultNick(this.pvpSeat);
        const pack = this.registry.get("match");
        if (pack?.mode === "pvp") {
          if (pack.p1Id) this.rememberPick("host", pack.p1Id);
          if (pack.p2Id) this.rememberPick("guest", pack.p2Id);
          if (pack.p3Id) this.rememberPick("guest2", pack.p3Id);
          const mine = this.heroOf(this.pvpSeat);
          const mineAt = this.playable.indexOf(mine);
          if (mineAt >= 0) this.p1Index = mineAt;
          const lastStage = pack.stageId;
          const lastAt = this.stageIds.indexOf(lastStage);
          if (lastAt >= 0) this.stageIndex = lastAt;
          if (pack.profiles) {
            ["host", "guest", "guest2"].forEach((seat) => {
              const src = pack.profiles[seat];
              if (!src) return;
              const cur = this.ensureProfile(seat);
              if (src.nick) cur.nick = src.nick;
              if (src.heroId) cur.heroId = src.heroId;
            });
          }
        }
        existingNet.discard?.(["start", "map_draw", "ready", "lobby_return", "lobby_state", "state"]);
        clearNetLobbyPings(existingNet);
        this._blockAutoStart = true;
        this.resetLobbyReady();
        this.bindNet(existingNet);
        this._resumeStage = !!resume?.refreshStage;
        this._pullPeers = !!resume?.pullPeers;
        this.time.delayedCall(600, () => {
          this._blockAutoStart = false;
        });
        this.pvpStatus =
          this.pvpSeat === "host"
            ? `房间 ${this.pvpRoom}　可换英灵换图，全员准备后开战`
            : `已回到房间 ${this.pvpRoom}　可换人，地图由主机选择`;
        this.broadcastNick();
        this.scheduleSync();
        try {
          const url = new URL(location.href);
          url.searchParams.set("mode", "pvp");
          history.replaceState({}, "", url);
        } catch {
          /* ignore */
        }
      }
      this.registry.remove("pvpResume");

      this.paintSelectBackdrop(w, h);
      this.modeGfx = this.add.graphics().setDepth(5);
      const modeStyle = {
        fontSize: 18,
        color: "#ead8a8",
      };
      this.modeDummy = uiText(this, w / 2 - 288, 36, "木桩练习", modeStyle)
        .setOrigin(0.5, 0)
        .setDepth(6)
        .setInteractive({ useHandCursor: true });
      this.modePve = uiText(this, w / 2 - 96, 36, "PVE 对战", modeStyle)
        .setOrigin(0.5, 0)
        .setDepth(6)
        .setInteractive({ useHandCursor: true });
      this.modeCricket = uiText(this, w / 2 + 96, 36, "电子斗蛐蛐", modeStyle)
        .setOrigin(0.5, 0)
        .setDepth(6)
        .setInteractive({ useHandCursor: true });
      this.modePvp = uiText(this, w / 2 + 288, 36, "局域网 PVP", modeStyle)
        .setOrigin(0.5, 0)
        .setDepth(6)
        .setInteractive({ useHandCursor: true });
      [this.modeDummy, this.modePve, this.modeCricket, this.modePvp].forEach((tab) => tab.setData("uiClickFirm", true));
      this.modeDummy.on("pointerdown", () => this.setMode("dummy"));
      this.modePve.on("pointerdown", () => this.setMode("pve"));
      this.modeCricket.on("pointerdown", () => this.setMode("cricket"));
      this.modePvp.on("pointerdown", () => this.setMode("pvp"));
      const diffStyle = {
        fontSize: 16,
        color: "#ead8a8",
      };
      this.diffKind = uiText(this, w / 2 - 186, 82, "仁慈的敌人", diffStyle)
        .setOrigin(0.5, 0)
        .setDepth(6)
        .setInteractive({ useHandCursor: true });
      this.diffFair = uiText(this, w / 2, 82, "认真的敌人", diffStyle)
        .setOrigin(0.5, 0)
        .setDepth(6)
        .setInteractive({ useHandCursor: true });
      this.diffCruel = uiText(this, w / 2 + 186, 82, "残忍的敌人", diffStyle)
        .setOrigin(0.5, 0)
        .setDepth(6)
        .setInteractive({ useHandCursor: true });
      [this.diffKind, this.diffFair, this.diffCruel].forEach((tab) => tab.setData("uiClickFirm", true));
      this.diffKind.on("pointerdown", () => this.setCpuDiff("kind"));
      this.diffFair.on("pointerdown", () => this.setCpuDiff("fair"));
      this.diffCruel.on("pointerdown", () => this.setCpuDiff("cruel"));
      this.title = uiText(this, w / 2, 70, "", {
        fontSize: 15,
        color: "#c8b88a",
        wordWrap: { width: w - 80, useAdvancedWrap: true },
        align: "center",
      })
        .setOrigin(0.5, 0)
        .setDepth(6);
      this.buildShowcases(w, h);
      this.buildPvpLobby(w);

      this.cards = [];
      this.heroRailPage = 0;
      this.buildHeroRail();
      this.buildStageDeck(w, h);
      this._rosterStamp = rosterStamp({
        playable: this.playable,
        stageIds: this.stageIds,
        stages: this.stages,
      });
      this._stageThumbStamp = {};
      this.stageIds.forEach((id) => {
        const s = this.stages[id] || {};
        this._stageThumbStamp[id] = String(s.committedAt || `${s.width || 0}x${s.height || 0}`);
      });
      this.rosterPoll = this.time.addEvent({
        delay: 2500,
        loop: true,
        callback: () => this.pullStudioRoster(),
      });
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        this.rosterPoll?.remove(false);
        this.rosterPoll = null;
      });
      this.keys = this.input.keyboard.addKeys("A,D,W,S,R,J,Q,E,F,ENTER,SPACE,LEFT,RIGHT,TAB,UP,DOWN,ONE,TWO,THREE,FOUR,FIVE,SIX");
      this.input.keyboard.addCapture("TAB");
      this.input.once("pointerdown", () => this.sound.unlock());
      this.input.keyboard.once("keydown", () => this.sound.unlock());
      this.input.on("pointerdown", (_pointer, objects) => {
        if (!objects?.length) return;
        const firm = objects.some((o) => o.getData?.("uiClickFirm"));
        playUiClick(this, firm);
      });
      this.refresh();
      this.pullStudioRoster();
      if (this._resumeStage) {
        this._resumeStage = false;
        this.refreshStageForNewRound();
      }
      if (this._pullPeers) {
        this._pullPeers = false;
        this.pullPeersToLobby();
      }
    }

    paintSelectBackdrop(w, h) {
      this.add.rectangle(w / 2, h / 2, w + 8, h + 8, 0x1a1410).setDepth(0);
    }

    buildShowcases(w) {
      this.showGfx = this.add.graphics().setDepth(2);
      const boxW = 312;
      const boxH = 368;
      const top = 118;
      this.showBox = { w: boxW, h: boxH, top, leftX: 22, rightX: w - 22 - boxW };
      const mkPlate = (cx, color) =>
        uiText(this, cx, top + boxH - 78, "", {
          fontFamily: BODY_FONT,
          fontSize: 24,
          color,
          align: "center",
          wordWrap: { width: boxW - 36, useAdvancedWrap: true },
        })
          .setOrigin(0.5, 0)
          .setDepth(5);
      const mkLine = (cx) =>
        uiText(this, cx, top + boxH - 48, "", {
          fontFamily: BODY_FONT,
          fontSize: 16,
          color: "#2a160c",
          align: "center",
          wordWrap: { width: boxW - 36, useAdvancedWrap: true },
        })
          .setOrigin(0.5, 0)
          .setDepth(5);
      const mkTag = (cx, color, label) =>
        uiText(this, cx, top + 12, label, {
          fontSize: 16,
          color,
          stroke: "#4a3018",
          strokeThickness: 3,
        })
          .setOrigin(0.5, 0)
          .setDepth(5);
      const leftCx = this.showBox.leftX + boxW / 2;
      const rightCx = this.showBox.rightX + boxW / 2;
      this.showP1 = this.add.sprite(leftCx, top + boxH - 88, "").setDepth(3).setVisible(false);
      this.showP1Ghost = this.add.sprite(leftCx, top + boxH - 88, "").setDepth(4).setVisible(false).setAlpha(0);
      this.showP2 = this.add.sprite(rightCx, top + boxH - 88, "").setDepth(3).setVisible(false);
      this.showP2Ghost = this.add.sprite(rightCx, top + boxH - 88, "").setDepth(4).setVisible(false).setAlpha(0);
      this.showP1Name = mkPlate(leftCx, "#2a5080");
      this.showP2Name = mkPlate(rightCx, "#8a3028");
      this.showP1Line = mkLine(leftCx);
      this.showP2Line = mkLine(rightCx);
      this.showP1Tag = mkTag(leftCx, "#1a5a9a", "1P  出战");
      this.showP2Tag = mkTag(rightCx, "#9a3028", "2P");
      this.vsMark = uiText(this, w / 2, 136, "VS", {
        fontSize: 64,
        color: "#f2d36b",
        stroke: "#3a2410",
        strokeThickness: 5,
      })
        .setOrigin(0.5)
        .setDepth(5);
      this.vsSub = this.add.text(w / 2, 196, "").setVisible(false);
    }

    paintShowcasePose(spr, texKey, fighter, step, cx, feetY, fitW, fitH, scale) {
      const frame = Number(step?.frame ?? 0);
      const layout = rosterHeroLayout(this, fighter, texKey, fitW, fitH, frame);
      if (spr.anims?.isPlaying) spr.anims.stop();
      spr.setTexture(texKey, frame).setVisible(true);
      spr.setFlipX(!!step?.flip);
      spr.setOrigin(layout.originX, layout.originY);
      spr.setScale(scale ?? layout.scale);
      spr.setPosition(cx, feetY);
    }

    applyShowcaseSprite(sprite, ghost, id, cx, feetY, fitW, fitH, flip) {
      const fighter = this.fighters[id] || {};
      const ta = fighter?.sprites?.turnaround;
      const taKey = rosterCardFrontKey(id);
      const hasTa = !!(ta?.file && this.textures.exists(taKey));
      if (!hasTa && !this.textures.exists(`roster-${id}`)) {
        sprite._showcaseSpin = null;
        sprite.setVisible(false);
        if (ghost) ghost.setVisible(false).setAlpha(0);
        return;
      }
      if (hasTa) {
        const scale = rosterShowcaseScale(this, fighter, taKey, fitW, fitH);
        const same = sprite._showcaseSpin?.id === id && sprite._showcaseSpin?.texKey === taKey;
        sprite._showcaseSpin = {
          id,
          texKey: taKey,
          fighter,
          seq: showcaseTurnaroundSteps(fighter),
          cx,
          feetY,
          fitW,
          fitH,
          scale,
          ghost,
          t0: same ? sprite._showcaseSpin.t0 : this.time.now,
          i0: same ? sprite._showcaseSpin.i0 : -1,
          i1: same ? sprite._showcaseSpin.i1 : -1,
        };
        this.tickShowcaseSpin(sprite);
        return;
      }
      sprite._showcaseSpin = null;
      if (ghost) ghost.setVisible(false).setAlpha(0);
      const key = ensureRosterAnim(this, id, fighter);
      sprite.setTexture(key, 0).setVisible(true);
      sprite.setFlipX(!!flip);
      const layout = rosterHeroLayout(this, fighter, key, fitW, fitH, 0);
      sprite.setOrigin(layout.originX, layout.originY);
      sprite.setScale(layout.scale);
      sprite.setPosition(cx, feetY);
      sprite.setAlpha(1);
      if (this.anims.exists(key)) sprite.anims.play(key, true);
    }

    tickShowcaseSpin(sprite) {
      const spin = sprite?._showcaseSpin;
      if (!spin?.seq?.length || !this.textures.exists(spin.texKey)) return;
      const seq = spin.seq;
      const stepMs = 1000 / 8;
      const elapsed = Math.max(0, this.time.now - (spin.t0 || 0));
      const i0 = seq.length < 2 ? 0 : Math.floor(elapsed / stepMs) % seq.length;
      if (spin.i0 !== i0) {
        this.paintShowcasePose(sprite, spin.texKey, spin.fighter, seq[i0], spin.cx, spin.feetY, spin.fitW, spin.fitH, spin.scale);
        spin.i0 = i0;
      } else {
        sprite.setPosition(spin.cx, spin.feetY).setScale(spin.scale);
      }
      sprite.setAlpha(1).setVisible(true);
      if (spin.ghost) spin.ghost.setVisible(false).setAlpha(0);
    }

    tickShowcaseSpins() {
      this.tickShowcaseSpin(this.showP1);
      if (this.showP2?.visible || this.showP2?._showcaseSpin) this.tickShowcaseSpin(this.showP2);
    }

    refreshShowcases() {
      if (!this.showGfx) return;
      const { w: boxW, h: boxH, top, leftX, rightX } = this.showBox;
      const pvp = this.mode === "pvp";
      const p1Id = this.playable[this.p1Index];
      const p2Id = pvp ? this.heroOf("guest") || this.playable[this.p2Index] : this.playable[this.p2Index];
      const p1 = this.fighters[p1Id] || {};
      const p2 = this.fighters[p2Id] || {};
      const leftCx = leftX + boxW / 2;
      const rightCx = rightX + boxW / 2;
      const fitW = boxW - 28;
      const zoneTop = top + 12;
      const zoneBottom = top + boxH - 78;
      const feetY = zoneBottom - 2;
      this.showGfx.clear();
      paintValleyPanel(this.showGfx, leftX, top, boxW, boxH, {
        selected: true,
        accent: 0x4aa3ff,
        radius: 14,
        inset: 10,
      });
      this.applyShowcaseSprite(this.showP1, this.showP1Ghost, p1Id, leftCx, feetY, fitW, zoneBottom - zoneTop, false);
      this.showP1Name.setText(p1.displayName || "—");
      this.showP1Line.setText(p1.oneLiner || "");
      this.showP1Tag.setText(pvp ? "出战 · 我" : this.slot === "p1" ? "1P  出战" : "1P");
      this.showP1Tag.setColor(this.slot === "p1" || pvp ? "#1a5a9a" : "#5a6a78");
      if (pvp) {
        this.showP2.setVisible(false);
        if (this.showP2Ghost) {
          this.showP2Ghost.setVisible(false).setAlpha(0);
          this.showP2._showcaseSpin = null;
        }
        this.showP2Name.setText("");
        this.showP2Line.setText("");
        this.showP2Tag.setText("");
        this.vsMark.setText(this.pvpConnectedCount() >= 3 ? "混战" : "VS").setPosition(this.scale.width / 2 - 40, 136);
      } else {
        paintValleyPanel(this.showGfx, rightX, top, boxW, boxH, {
          selected: true,
          accent: 0xe86a5a,
          radius: 14,
          inset: 10,
        });
        this.applyShowcaseSprite(this.showP2, this.showP2Ghost, p2Id, rightCx, feetY, fitW, zoneBottom - zoneTop, true);
        this.showP2Name.setText(p2.displayName || "—");
        this.showP2Line.setText(p2.oneLiner || "");
        const role = this.p2Role();
        this.showP2Tag.setText(this.slot === "p2" ? `2P  ${role}` : `2P`);
        this.showP2Tag.setColor(this.slot === "p2" ? "#9a3028" : "#7a5850");
        this.vsMark.setText("VS").setPosition(this.scale.width / 2, 136);
      }
    }

    buildHeroRail() {
      this.playable.forEach((id, i) => {
        const fighter = this.fighters[id] || {};
        ensureRosterAnim(this, id, fighter);
        const g = this.add.graphics().setDepth(8);
        const maskG = this.add.graphics().setDepth(7).setVisible(false);
        const portrait = this.add.image(0, 0, "__MISSING").setDepth(9);
        portrait.setMask(maskG.createGeometryMask());
        const name = uiText(this, 0, 0, fighter.displayName || id, {
          fontFamily: BODY_FONT,
          fontSize: 15,
          color: "#f4e6c4",
          stroke: "#2a180c",
          strokeThickness: 2,
          align: "center",
          wordWrap: { width: 96, useAdvancedWrap: true },
        })
          .setOrigin(0.5, 0)
          .setDepth(10);
        const line = this.add.text(0, 0, "").setVisible(false);
        const badge = uiText(this, 0, 0, "", {
          fontSize: 13,
          color: "#f2e6c4",
          stroke: "#3a2410",
          strokeThickness: 3,
        })
          .setOrigin(0.5, 0)
          .setDepth(11);
        const zone = this.add.zone(0, 0, 96, 118).setInteractive({ useHandCursor: true }).setDepth(12);
        zone.on("pointerdown", () => {
          if (this.drawingMap) return;
          if (this.mode === "pvp") {
            this.p1Index = i;
            this.broadcastPick();
          } else if (this.slot === "p1") this.p1Index = i;
          else this.p2Index = i;
          this.ensureHeroRailPageFor(i);
          this.refresh();
          this.playSelectVoice(this.playable[i]);
        });
        zone.on("pointerover", () => {
          this.hoverIndex = i;
          this.refresh();
        });
        zone.on("pointerout", () => {
          if (this.hoverIndex === i) this.hoverIndex = -1;
          this.refresh();
        });
        this.cards.push({ id, x: 0, cardW: 96, cardH: 118, top: 0, g, maskG, portrait, name, line, badge, zone });
      });
      this.addComingSoonCard();
      this.buildHeroRailArrows();
      this.layoutHeroRail();
    }

    addComingSoonCard() {
      bakeMysteryHero(this);
      const g = this.add.graphics().setDepth(8);
      const maskG = this.add.graphics().setDepth(7).setVisible(false);
      const portrait = this.add.image(0, 0, "ui-mystery-hero").setDepth(9);
      portrait.setMask(maskG.createGeometryMask());
      const name = uiText(this, 0, 0, "即将登场", {
        fontFamily: BODY_FONT,
        fontSize: 14,
        color: "#8a7a60",
        align: "center",
        wordWrap: { width: 96, useAdvancedWrap: true },
      })
        .setOrigin(0.5, 0)
        .setDepth(10);
      const line = this.add.text(0, 0, "").setVisible(false);
      const badge = uiText(this, 0, 0, "？", {
        fontSize: 16,
        color: "#d4b06a",
      })
        .setOrigin(0.5, 0)
        .setDepth(11);
      const zone = this.add.zone(0, 0, 96, 118).setInteractive({ useHandCursor: false }).setDepth(12);
      zone.on("pointerdown", () => {
        if (this.drawingMap) return;
        setSelectFooter(null, "更多英灵正在赶来的路上", false);
        this.time.delayedCall(1600, () => this.refresh());
      });
      this.cards.push({
        id: "__coming_soon__",
        comingSoon: true,
        x: 0,
        cardW: 96,
        cardH: 118,
        top: 0,
        g,
        maskG,
        portrait,
        name,
        line,
        badge,
        zone,
      });
    }

    heroRailPageCount() {
      return Math.max(1, Math.ceil((this.cards?.length || 0) / HERO_RAIL_PAGE));
    }

    ensureHeroRailPageFor(index) {
      if (!Number.isFinite(index) || index < 0) return;
      const page = Math.floor(index / HERO_RAIL_PAGE);
      const maxPage = this.heroRailPageCount() - 1;
      this.heroRailPage = Phaser.Math.Clamp(page, 0, maxPage);
    }

    shiftHeroRail(dir) {
      if (this.drawingMap) return;
      const pages = this.heroRailPageCount();
      if (pages <= 1) return;
      this.heroRailPage = (this.heroRailPage + dir + pages * 8) % pages;
      this.refresh();
    }

    buildHeroRailArrows() {
      this.destroyHeroRailArrows();
      // 位置在 layoutHeroRail 里按卡池区域重算；深度高于地图区，避免点不中
      this.heroRailPrev = this.makeHeroRailArrow(0, 0, -1);
      this.heroRailNext = this.makeHeroRailArrow(0, 0, 1);
    }

    makeHeroRailArrow(x, y, dir) {
      const arrow = { g: null, zone: null, paint: null, dir, x, y };
      const g = this.add.graphics().setDepth(60);
      const zone = this.add
        .zone(x, y, 52, 80)
        .setInteractive({ useHandCursor: true })
        .setDepth(61)
        .setData("uiClickFirm", true);
      const paint = (hover) => {
        const ax = arrow.x;
        const ay = arrow.y;
        g.clear();
        paintValleyPanel(g, ax - 20, ay - 28, 40, 56, {
          selected: !!hover,
          accent: 0xf2d090,
          radius: 10,
          inset: 5,
        });
        g.lineStyle(4, hover ? 0x5a3818 : 0xf4ead0, 1);
        g.beginPath();
        if (dir < 0) {
          g.moveTo(ax + 6, ay - 12);
          g.lineTo(ax - 8, ay);
          g.lineTo(ax + 6, ay + 12);
        } else {
          g.moveTo(ax - 6, ay - 12);
          g.lineTo(ax + 8, ay);
          g.lineTo(ax - 6, ay + 12);
        }
        g.strokePath();
      };
      paint(false);
      zone.on("pointerover", () => paint(true));
      zone.on("pointerout", () => paint(false));
      zone.on("pointerdown", () => this.shiftHeroRail(dir));
      arrow.g = g;
      arrow.zone = zone;
      arrow.paint = paint;
      return arrow;
    }

    setHeroRailArrowsVisible(show) {
      [this.heroRailPrev, this.heroRailNext].forEach((arrow) => {
        if (!arrow) return;
        arrow.g?.setVisible(show);
        if (show) arrow.zone?.setInteractive({ useHandCursor: true });
        else arrow.zone?.disableInteractive();
      });
    }

    destroyHeroRailArrows() {
      [this.heroRailPrev, this.heroRailNext].forEach((arrow) => {
        arrow?.g?.destroy();
        arrow?.zone?.destroy();
      });
      this.heroRailPrev = null;
      this.heroRailNext = null;
    }

    layoutHeroRail() {
      const w = this.scale.width;
      const n = this.cards.length;
      if (!n) return;
      const pvp = this.mode === "pvp";
      const reserve = pvp ? 328 : 0;
      const icon = 96;
      const gap = 12;
      const arrowW = 48;
      const pageSize = HERO_RAIL_PAGE;
      const pages = this.heroRailPageCount();
      this.heroRailPage = Phaser.Math.Clamp(this.heroRailPage ?? 0, 0, pages - 1);
      const start = this.heroRailPage * pageSize;
      const visible = Math.min(pageSize, n - start);
      const areaW = w - 32 - reserve;
      const stripW = visible * icon + Math.max(0, visible - 1) * gap;
      const left = 16 + Math.max(0, (areaW - stripW) / 2);
      const top = 532;
      const midY = top + icon / 2;

      this.cards.forEach((card, i) => {
        const onPage = i >= start && i < start + pageSize;
        card.g?.setVisible(onPage);
        card.maskG?.setVisible(false);
        card.portrait?.setVisible(onPage);
        card.name?.setVisible(onPage);
        card.badge?.setVisible(onPage);
        if (!onPage) {
          card.zone?.disableInteractive();
          // 挪出屏幕，避免残留命中区挡箭头
          card.zone?.setPosition(-9999, -9999);
          return;
        }
        const col = i - start;
        const x = left + col * (icon + gap);
        const y = top;
        card.x = x;
        card.top = y;
        card.cardW = icon;
        card.cardH = icon + 22;
        const cx = x + icon / 2;
        card.zone.setPosition(cx, y + card.cardH / 2).setSize(icon, card.cardH);
        card.zone.setInteractive({ useHandCursor: !card.comingSoon });
        if (card.comingSoon) {
          card.portrait.setOrigin(0.5, 0.5);
          card.portrait.setDisplaySize(icon - 10, icon - 10);
          card.portrait.setPosition(cx, y + icon / 2);
          card.maskG.clear();
          card.maskG.fillStyle(0xffffff, 1);
          card.maskG.fillRoundedRect(x + 5, y + 5, icon - 10, icon - 10, 14);
          card.name.setPosition(cx, y + icon + 2).setWordWrapWidth(icon + 4);
          card.badge.setOrigin(0.5, 1).setPosition(cx, y - 3);
          return;
        }
        const fighter = this.fighters[card.id] || {};
        const slotX = x + 3;
        const slotY = y + 3;
        const slotW = icon - 6;
        const slotH = icon - 6;
        const slotCx = slotX + slotW / 2;
        const slotCy = slotY + slotH / 2;
        const cardKey = bakeRosterCardPortrait(this, card.id, fighter, slotW, slotH);
        if (this.textures.exists(cardKey)) {
          card.portrait.setTexture(cardKey);
        }
        card.portrait.setOrigin(0.5, 0.5);
        card.portrait.setDisplaySize(slotW, slotH);
        card.portrait.setPosition(slotCx, slotCy);
        card.maskG.clear();
        card.maskG.fillStyle(0xffffff, 1);
        card.maskG.fillRoundedRect(x + 3, y + 3, icon - 6, icon - 6, 18);
        card.name.setPosition(cx, y + icon + 2).setWordWrapWidth(icon + 4);
        card.badge.setOrigin(0.5, 1).setPosition(cx, y - 3);
      });

      const showArrows = pages > 1;
      const placeArrow = (arrow, x) => {
        if (!arrow) return;
        arrow.x = x;
        arrow.y = midY;
        arrow.zone?.setPosition(x, midY);
        arrow.paint?.(false);
      };
      placeArrow(this.heroRailPrev, left - arrowW);
      placeArrow(this.heroRailNext, left + stripW + arrowW);
      this.setHeroRailArrowsVisible(showArrows);
    }

    clearHeroRail() {
      this.destroyHeroRailArrows();
      (this.cards || []).forEach((c) => {
        c.g?.destroy();
        c.maskG?.destroy();
        c.portrait?.destroy();
        c.name?.destroy();
        c.line?.destroy();
        c.badge?.destroy();
        c.zone?.destroy();
      });
      this.cards = [];
    }

    destroyStageDeck() {
      (this.stageLayers || []).forEach((layer) => {
        layer.img?.destroy();
        layer.frame?.destroy();
        layer.maskG?.destroy();
      });
      this.stageLayers = [];
      this.stageGlow?.destroy();
      this.stageLabel?.destroy();
      this.stageHint?.destroy();
      this.stageZone?.destroy();
      this.stagePrev?.g?.destroy();
      this.stagePrev?.zone?.destroy();
      this.stageNext?.g?.destroy();
      this.stageNext?.zone?.destroy();
      this.stageGlow = null;
      this.stageLabel = null;
      this.stageHint = null;
      this.stageZone = null;
      this.stagePrev = null;
      this.stageNext = null;
    }

    queueRosterHeroThumbs() {
      let queued = 0;
      this.playable.forEach((id) => {
        queued += loadRosterHeroTextures(this, this.load, id, this.fighters[id] || {}, `?t=${Date.now()}`);
      });
      return queued;
    }

    async pullStudioRoster() {
      if (this._rosterPulling || this.drawingMap) return;
      this._rosterPulling = true;
      try {
        const roster = await fetchRoster(this.registry.get("roster"));
        if (!this.sys?.isActive?.()) {
          this._rosterPulling = false;
          return;
        }
        const next = rosterStamp(roster);
        this.registry.set("roster", roster);
        if (next === this._rosterStamp) {
          this._rosterPulling = false;
          return;
        }
        const prevStageIds = this.stageIds || [];
        const stagesChanged =
          prevStageIds.join() !== roster.stageIds.join() ||
          roster.stageIds.some((id) => {
            const a = this.stages?.[id] || {};
            const b = roster.stages[id] || {};
            return (a.committedAt || "") !== (b.committedAt || "") || a.width !== b.width || a.height !== b.height;
          });
        const heroesChanged = (this.playable || []).join() !== roster.playable.join();
        const keepStage = this.stageIds[this.stageIndex];
        this.playable = roster.playable;
        this.fighters = roster.fighters;
        this.stageIds = roster.stageIds;
        this.stages = roster.stages;
        this._rosterStamp = next;
        invalidateRosterCardPortraits(this, roster.playable);
        if (this.p1Index >= this.playable.length) this.p1Index = 0;
        if (this.p2Index >= this.playable.length) this.p2Index = Math.min(1, Math.max(0, this.playable.length - 1));
        const idx = this.stageIds.indexOf(keepStage);
        this.stageIndex = idx >= 0 ? idx : 0;
        if (this.stageConfirmed && idx < 0) this.stageConfirmed = false;
        let queued = this.queueRosterHeroThumbs();
        if (stagesChanged) {
          this._stageThumbStamp = this._stageThumbStamp || {};
          this.stageIds.forEach((id) => {
            const meta = this.stages[id] || {};
            const stamp = String(meta.committedAt || `${meta.width || 0}x${meta.height || 0}`);
            const key = `stage-thumb-${id}`;
            if (this.textures.exists(key) && this._stageThumbStamp[id] === stamp) return;
            if (this.textures.exists(key)) this.textures.remove(key);
            const file = meta.file || "stage.png";
            this.load.image(key, `/assets/game/stages/${id}/${file}?t=${encodeURIComponent(stamp || Date.now())}`);
            this._stageThumbStamp[id] = stamp;
            queued += 1;
          });
        }
        const applyUi = () => {
          if (!this.sys?.isActive?.()) return;
          if (heroesChanged) {
            this.clearHeroRail();
            this.buildHeroRail();
          } else if (queued) {
            this.layoutHeroRail();
          }
          if (stagesChanged) {
            this.destroyStageDeck();
            this.buildStageDeck(this.scale.width, this.scale.height);
          }
          this.refresh();
          this._rosterPulling = false;
        };
        if (!queued) {
          applyUi();
          return;
        }
        this.load.once("complete", applyUi);
        this.load.start();
        return;
      } catch {
        /* keep last roster */
      }
      this._rosterPulling = false;
    }

    buildStageDeck(w, h) {
      const sw = 456;
      const sh = 256;
      const cx = w / 2;
      const cy = 328;
      this.stageDeckCx = cx;
      this.stageDeckCy = cy;
      this.stageDeckW = sw;
      this.stageDeckH = sh;
      this.stageLayers = [];
      const depthBase = 12;
      this.stageIds.forEach((id, i) => {
        const off = Math.min(i, 4) * 5;
        const img = this.add
          .image(cx + off, cy - off, `stage-thumb-${id}`)
          .setDisplaySize(sw, sh)
          .setDepth(depthBase + i)
          .setVisible(false);
        const maskG = this.add.graphics().setVisible(false);
        img.setMask(maskG.createGeometryMask());
        const frame = this.add.graphics().setDepth(depthBase + i + 0.5);
        this.stageLayers.push({ id, img, frame, maskG, off });
      });
      this.stageGlow = this.add.graphics().setDepth(depthBase + 40);
      this.stageLabel = uiText(this, cx, cy + sh / 2 + 12, "", {
        fontSize: 20,
        color: "#f4ead0",
        stroke: "#3a2410",
        strokeThickness: 3,
        wordWrap: { width: sw, useAdvancedWrap: true },
        align: "center",
      })
        .setOrigin(0.5, 0)
        .setDepth(depthBase + 41);
      this.stageHint = this.add.text(cx, cy + sh / 2 + 34, "").setVisible(false);
      this.stageZone = this.add
        .zone(cx, cy, sw + 28, sh + 28)
        .setInteractive({ useHandCursor: true })
        .setDepth(depthBase + 42)
        .setData("uiClickFirm", true);
      this.stageZone.on("pointerdown", () => {
        if (this.drawingMap) return;
        if (this.mode === "pvp" && this.pvpSeat !== "host") return;
        if (this.stageConfirmed) {
          this.stageConfirmed = false;
          this.refreshStageDeck(true);
          if (this.mode === "pvp") this.broadcastStage();
          return;
        }
        this.confirmStage();
      });
      this.stagePrev = this.makeStageArrow(cx - sw / 2 - 38, cy, -1);
      this.stageNext = this.makeStageArrow(cx + sw / 2 + 38, cy, 1);
      this.refreshStageDeck(true);
    }

    makeStageArrow(x, y, dir) {
      const g = this.add.graphics().setDepth(54);
      const zone = this.add.zone(x, y, 46, 72).setInteractive({ useHandCursor: true }).setDepth(55).setData("uiClickFirm", true);
        const paint = (hover) => {
        g.clear();
        paintValleyPanel(g, x - 20, y - 28, 40, 56, {
          selected: !!hover,
          accent: 0xf2d090,
          radius: 10,
          inset: 5,
        });
        g.lineStyle(4, hover ? 0x5a3818 : 0xf4ead0, 1);
        g.beginPath();
        if (dir < 0) {
          g.moveTo(x + 6, y - 12);
          g.lineTo(x - 8, y);
          g.lineTo(x + 6, y + 12);
        } else {
          g.moveTo(x - 6, y - 12);
          g.lineTo(x + 8, y);
          g.lineTo(x - 6, y + 12);
        }
        g.strokePath();
      };
      paint(false);
      zone.on("pointerover", () => paint(true));
      zone.on("pointerout", () => paint(false));
      zone.on("pointerdown", () => this.shiftStage(dir));
      return { g, zone, paint, dir, x, y };
    }

    setStageArrowsVisible(show) {
      [this.stagePrev, this.stageNext].forEach((arrow) => {
        if (!arrow) return;
        arrow.g?.setVisible(show);
        if (show) arrow.zone?.setInteractive({ useHandCursor: true });
        else arrow.zone?.disableInteractive();
      });
    }

    stageNameAt(index) {
      const id = this.stageIds[index];
      return this.stages[id]?.displayName || id || "—";
    }

    cycleStagePreview() {
      this.shiftStage(1);
    }

    shiftStage(dir) {
      if (!this.stageIds.length) return;
      if (this.mode === "pvp" && this.pvpSeat !== "host") return;
      const n = this.stageIds.length;
      this.stageIndex = (this.stageIndex + dir + n * 8) % n;
      this.stageConfirmed = false;
      this.refreshStageDeck(false);
      this.refresh();
      if (this.mode === "pvp") this.broadcastStage();
    }

    confirmStage() {
      if (this.drawingMap) return;
      if (this.mode === "pvp" && this.pvpSeat !== "host") return;
      if (!this.stageIds.length) return;
      this.stageConfirmed = true;
      try {
        const url = new URL(location.href);
        url.searchParams.set("stage", this.stageIds[this.stageIndex]);
        history.replaceState({}, "", url);
      } catch {
        /* ignore */
      }
      this.refreshStageDeck(true);
      this.refresh();
      if (this.mode === "pvp") this.broadcastStage();
    }

    refreshStageDeck(snap) {
      const n = this.stageLayers?.length || 0;
      if (!n) return;
      const { stageDeckCx: cx, stageDeckCy: cy, stageDeckW: sw, stageDeckH: sh } = this;
      this.stageLayers.forEach((layer, i) => {
        const dist = (i - this.stageIndex + n) % n;
        const show = dist <= 3;
        layer.img.setVisible(show);
        layer.frame.setVisible(show);
        if (!show) return;
        const off = dist * 6;
        const depth = 12 + (3 - dist);
        const targetX = cx + off;
        const targetY = cy - off;
        layer.img.setDepth(depth);
        layer.frame.setDepth(depth + 0.2);
        if (snap) {
          layer.img.setPosition(targetX, targetY).setAlpha(dist === 0 ? 1 : 0.55 - dist * 0.08);
        } else {
          this.tweens.add({
            targets: layer.img,
            x: targetX,
            y: targetY,
            alpha: dist === 0 ? 1 : 0.55 - dist * 0.08,
            duration: 180,
            ease: "Sine.easeOut",
          });
        }
        layer.frame.clear();
        if (layer.maskG) {
          layer.maskG.clear();
          layer.maskG.fillStyle(0xffffff, 1);
          layer.maskG.fillRoundedRect(targetX - sw / 2, targetY - sh / 2, sw, sh, 22);
        }
        if (dist === 0) {
          const col = this.stageConfirmed ? 0xe8c36a : 0xc4b078;
          strokePlaque(layer.frame, targetX - sw / 2 - 8, targetY - sh / 2 - 8, sw + 16, sh + 16, col, null, this.stageConfirmed ? 2 : 1, 26);
        }
      });
      this.stageGlow.clear();
      this.stageLabel.setVisible(true);
      const hostMap = this.mode !== "pvp" || this.pvpSeat === "host";
      if (hostMap) this.stageZone?.setInteractive({ useHandCursor: true });
      else this.stageZone?.disableInteractive();
      this.setStageArrowsVisible(hostMap && this.stageIds.length > 1);
      {
        const labelStyle = {
          fontFamily: UI_FONT,
          fontSize: 20,
          color: "#f4ead0",
          stroke: "#3a2410",
          strokeThickness: 3,
        };
        this.stageLabel.setText(clampWrappedLines(this, this.stageNameAt(this.stageIndex), labelStyle, sw, 2));
      }
      if (this.stageConfirmed) {
        this.stageGlow.lineStyle(6, 0xe8c36a, 0.22);
        this.stageGlow.strokeRoundedRect(cx - sw / 2 - 14, cy - sh / 2 - 14, sw + 28, sh + 28, 28);
      }
    }

    p2Role() {
      if (this.mode === "pvp" || this.mode === "pve") return "对手";
      if (this.mode === "cricket") return "人机";
      return "木桩";
    }

    setMode(mode) {
      const next = mode === "pve" || mode === "pvp" || mode === "cricket" ? mode : "dummy";
      if (next !== this.mode && this.mode === "pvp") this.teardownNet();
      this.mode = next;
      if (this.mode === "pvp") {
        this.slot = "p1";
        this.pvpStatus = "点右侧「创建房间」或「加入房间」";
      } else {
        this.pvpStatus = "";
      }
      this.refreshStageDeck(true);
      this.refresh();
    }

    setCpuDiff(id) {
      this.cpuDiff = saveCpuDiff(id);
      this.refresh();
    }

    teardownNet() {
      const net = this.registry.get("net");
      if (net) {
        net.close();
        this.registry.remove("net");
      }
      this.pvpSeat = "";
      this.pvpRoom = "";
      this.pvpPeerHero = "";
      this.pvpPicks = emptyPvpPicks();
      this.pvpSeats = { host: false, guest: false, guest2: false };
      this.pvpProfiles = {
        host: { nick: "主机", ready: false, heroId: "" },
        guest: { nick: "客人1", ready: false, heroId: "" },
        guest2: { nick: "客人2", ready: false, heroId: "" },
      };
      this.locked = false;
      this.drawingMap = false;
    }

    applyRoster(msg) {
      if (msg?.seats) {
        this.pvpSeats = {
          host: !!msg.seats.host,
          guest: !!msg.seats.guest,
          guest2: !!msg.seats.guest2,
        };
      }
    }

    rememberPick(seat, heroId, ts) {
      if (!seat || !heroId) return;
      if (!this.pvpPicks) this.pvpPicks = emptyPvpPicks();
      this.pvpPicks[seat] = heroId;
      const profile = this.ensureProfile(seat);
      profile.heroId = heroId;
      if (ts) profile.ts = Number(ts) || profile.ts || 0;
      else if (seat === this.pvpSeat) profile.ts = Date.now();
      if (seat !== this.pvpSeat) this.pvpSeats[seat] = true;
      if (seat === "guest") this.pvpPeerHero = heroId;
      if (seat !== this.pvpSeat) {
        const idx = this.playable.indexOf(heroId);
        if (idx >= 0 && seat === "guest") this.p2Index = idx;
      }
    }

    pvpConnectedCount() {
      return this.onlineSeats().length;
    }

    onlineSeats() {
      return ["host", "guest", "guest2"].filter((seat) => !!this.pvpSeats?.[seat]);
    }

    heroOf(seat) {
      return this.pvpPicks?.[seat] || this.ensureProfile(seat).heroId || "";
    }

    ensureProfile(seat) {
      if (!this.pvpProfiles[seat]) {
        this.pvpProfiles[seat] = { nick: defaultNick(seat), ready: false, heroId: "" };
      }
      return this.pvpProfiles[seat];
    }

    localNick() {
      try {
        return String(localStorage.getItem("hg_pvp_nick") || "").trim().slice(0, 12);
      } catch {
        return "";
      }
    }

    saveLocalNick(nick) {
      try {
        localStorage.setItem("hg_pvp_nick", String(nick || "").trim().slice(0, 12));
      } catch {
        /* ignore */
      }
    }

    promptNick(action) {
      const saved = this.localNick();
      const next = String(
        window.prompt(`给自己取个昵称（最多 12 字）${action ? `，然后${action}` : ""}`, saved) || ""
      )
        .trim()
        .slice(0, 12);
      if (!next) {
        this.pvpStatus = "需要昵称才能进房";
        this.refresh();
        return "";
      }
      this.saveLocalNick(next);
      return next;
    }

    setReady(ready) {
      if (!this.pvpSeat) return;
      const profile = this.ensureProfile(this.pvpSeat);
      profile.ready = !!ready;
      profile.ts = Date.now();
      const net = this.registry.get("net");
      if (net?.connected) net.send({ type: "ready", ready: profile.ready, ts: profile.ts });
      this.broadcastLobby();
      this.refresh();
      this.tryAutoStart();
    }

    allOnlineReady() {
      const online = this.onlineSeats();
      if (online.length < 2) return false;
      return online.every((seat) => {
        const p = this.ensureProfile(seat);
        return !!p.ready && !!this.heroOf(seat);
      });
    }

    tryAutoStart() {
      if (this._blockAutoStart) return;
      if (this.pvpSeat !== "host" || this.drawingMap || this.locked) return;
      if (!this.allOnlineReady()) return;
      this.startHostMatch();
    }

    broadcastNick() {
      if (!this.pvpSeat) return;
      const profile = this.ensureProfile(this.pvpSeat);
      profile.ts = Date.now();
      const net = this.registry.get("net");
      if (net?.connected) net.send({ type: "nick", nick: profile.nick || defaultNick(this.pvpSeat), ts: profile.ts });
    }

    broadcastLobby() {
      const net = this.registry.get("net");
      if (!net?.connected || !this.pvpSeat) return;
      this.ensureProfile(this.pvpSeat).ts = Date.now();
      net.send({
        type: "lobby_state",
        seats: this.pvpSeats,
        profiles: {
          host: { ...this.ensureProfile("host") },
          guest: { ...this.ensureProfile("guest") },
          guest2: { ...this.ensureProfile("guest2") },
        },
        picks: { ...(this.pvpPicks || emptyPvpPicks()) },
        stageId: this.stageIds[this.stageIndex] || "",
        stageConfirmed: !!this.stageConfirmed,
      });
    }

    broadcastStage() {
      const net = this.registry.get("net");
      if (!net?.connected || this.pvpSeat !== "host") return;
      net.send({
        type: "stage_pick",
        stageId: this.stageIds[this.stageIndex] || "",
        confirmed: !!this.stageConfirmed,
      });
      this.broadcastLobby();
    }

    applyStagePick(msg) {
      if (!msg?.stageId) return;
      const idx = this.stageIds.indexOf(msg.stageId);
      if (idx >= 0) this.stageIndex = idx;
      if ("confirmed" in msg) this.stageConfirmed = !!msg.confirmed;
      else if ("stageConfirmed" in msg) this.stageConfirmed = !!msg.stageConfirmed;
      this.refreshStageDeck(true);
    }

    resetLobbyReady() {
      this.locked = false;
      this.drawingMap = false;
      ["host", "guest", "guest2"].forEach((seat) => {
        const p = this.ensureProfile(seat);
        p.ready = false;
        p.ts = Date.now();
      });
      if (this.pvpSeat) {
        const net = this.registry.get("net");
        const profile = this.ensureProfile(this.pvpSeat);
        if (net?.connected) net.send({ type: "ready", ready: false, ts: profile.ts });
      }
    }

    pullPeersToLobby() {
      const net = this.registry.get("net");
      if (!net?.connected || !this.pvpSeat) return;
      const gen = Number(this.registry.get("pvpFightGen")) || 0;
      net._fightGen = gen;
      const ping = () => {
        if (this.scene.isActive() && net.connected) net.send({ type: "lobby_return", gen });
      };
      ping();
      this.time.delayedCall(160, ping);
      this.time.delayedCall(420, ping);
    }

    refreshStageForNewRound() {
      if (!this.stageIds.length) return;
      if (this.pvpSeat === "host") {
        let next = Phaser.Math.Between(0, Math.max(0, this.stageIds.length - 1));
        if (this.stageIds.length > 1 && next === this.stageIndex) {
          next = (next + 1) % this.stageIds.length;
        }
        this.stageIndex = next;
        this.stageConfirmed = false;
        this.refreshStageDeck(true);
        this.broadcastStage();
      }
    }

    applyLobbyState(msg) {
      const from = msg._from;
      if (!from || from === this.pvpSeat) return;
      this.pvpSeats[from] = true;
      if (msg.seats) {
        ["host", "guest", "guest2"].forEach((seat) => {
          if (msg.seats[seat]) this.pvpSeats[seat] = true;
        });
      }
      const profiles = msg.profiles || {};
      ["host", "guest", "guest2"].forEach((seat) => {
        if (seat === this.pvpSeat) return;
        const p = profiles[seat];
        if (!p) return;
        const cur = this.ensureProfile(seat);
        const ts = Number(p.ts) || 0;
        if (cur.ts && ts && ts < cur.ts) return;
        if (p.heroId) this.rememberPick(seat, p.heroId, ts);
        if (p.nick) cur.nick = String(p.nick).trim().slice(0, 12);
        if (typeof p.ready === "boolean") cur.ready = !!p.ready;
        if (ts) cur.ts = ts;
      });
      if (msg.picks) {
        Object.entries(msg.picks).forEach(([seat, heroId]) => {
          if (seat !== this.pvpSeat && heroId) this.rememberPick(seat, heroId);
        });
      }
      if (msg.stageId) this.applyStagePick(msg);
    }

    scheduleSync() {
      this.syncSelf();
      this.time.delayedCall(80, () => this.syncSelf());
      this.time.delayedCall(320, () => this.syncSelf());
    }

    editNick() {
      if (!this.pvpSeat) return;
      const next = this.promptNick();
      if (!next) return;
      this.ensureProfile(this.pvpSeat).nick = next;
      this.broadcastNick();
      this.broadcastLobby();
      this.refresh();
    }

    addLobbyBtn(x, y, bw, bh, fill, label, handler) {
      const g = this.add.graphics().setDepth(36);
      const zone = this.add
        .zone(x + bw / 2, y + bh / 2, bw, bh)
        .setDepth(36)
        .setInteractive({ useHandCursor: true })
        .setData("uiClickFirm", true);
      const text = uiText(this, x + bw / 2, y + bh / 2, label, {
        fontSize: 15,
        color: "#5a3818",
      })
        .setOrigin(0.5)
        .setDepth(37);
      zone.on("pointerdown", handler);
      const btn = { g, zone, text, x, y, w: bw, h: bh, fill };
      this.paintLobbyBtn(btn, true);
      return btn;
    }

    paintLobbyBtn(btn, show) {
      btn.g.clear();
      btn.g.setVisible(show);
      btn.text.setVisible(show);
      if (!show) {
        btn.zone.disableInteractive();
        return;
      }
      paintValleyPanel(btn.g, btn.x, btn.y, btn.w, btn.h, {
        selected: true,
        accent: btn.fill || 0xd4b06a,
        radius: 10,
        inset: 4,
      });
      btn.text.setColor("#5a3818");
      btn.zone.setPosition(btn.x + btn.w / 2, btn.y + btn.h / 2).setSize(btn.w, btn.h);
      btn.zone.setInteractive({ useHandCursor: true });
      btn.text.setPosition(btn.x + btn.w / 2, btn.y + btn.h / 2);
    }

    buildPvpLobby(w) {
      const railW = 300;
      const startX = w - 16 - railW;
      const top = 98;
      this.lobbyX = startX;
      this.lobbyW = railW;
      this.lobbyTop = top;
      this.lobbyPanel = this.add.graphics().setDepth(34);
      this.lobbyTitle = uiText(this, startX + 18, top + 12, "", {
        fontFamily: BODY_FONT,
        fontSize: 20,
        color: "#3a2410",
      }).setDepth(36);
      this.lobbySub = uiText(this, startX + 18, top + 38, "", {
        fontFamily: BODY_FONT,
        fontSize: 14,
        color: "#3a2414",
        wordWrap: { width: railW - 44, useAdvancedWrap: true },
        lineSpacing: 4,
      }).setDepth(36);
      this.pvpLobby = [];
      const rowH = 70;
      const rowsTop = top + 86;
      ["host", "guest", "guest2"].forEach((seat, i) => {
        const y = rowsTop + i * (rowH + 8);
        const g = this.add.graphics().setDepth(35);
        const avatar = this.add.sprite(startX + 28, y + 58, "roster-" + (this.playable[0] || "")).setDepth(36).setVisible(false);
        const title = uiText(this, startX + 56, y + 10, "", {
          fontFamily: BODY_FONT,
          fontSize: 15,
          color: "#3a2410",
        }).setDepth(36);
        const hero = uiText(this, startX + 56, y + 32, "", {
          fontFamily: BODY_FONT,
          fontSize: 14,
          color: "#1a3a6a",
        }).setDepth(36);
        const ready = uiText(this, startX + 56, y + 50, "", {
          fontFamily: BODY_FONT,
          fontSize: 14,
          color: "#3a2414",
        }).setDepth(36);
        this.pvpLobby.push({ seat, g, avatar, title, hero, ready, x: startX, y, h: rowH });
      });
      const btnY = rowsTop + 3 * (rowH + 8) + 8;
      this.createBtn = this.addLobbyBtn(startX + 12, btnY, 132, 34, 0x3d5a3d, "创建房间", () => this.hostPvp());
      this.joinBtn = this.addLobbyBtn(startX + 156, btnY, 132, 34, 0x3a4d66, "加入房间", () => this.joinPvp(""));
      this.readyBtn = this.addLobbyBtn(startX + 12, btnY, 132, 34, 0x2f393f, "准备", () => {
        if (!this.pvpSeat) return;
        this.setReady(!this.ensureProfile(this.pvpSeat).ready);
      });
      this.startBtn = this.addLobbyBtn(startX + 156, btnY, 132, 34, 0x6a4a18, "开战", () => this.startHostMatch());
      this.nickBtn = this.addLobbyBtn(startX + 12, btnY + 42, 132, 30, 0x313131, "改昵称", () => this.editNick());
      this.leaveBtn = this.addLobbyBtn(startX + 156, btnY + 42, 132, 30, 0x4a3030, "离开房间", () => {
        this.teardownNet();
        this.pvpStatus = "已离开房间";
        this.refresh();
      });
      this.refreshPvpLobby();
    }

    setLobbyBtn(btn, show, label, fill) {
      if (!btn) return;
      if (show && label) btn.text.setText(label);
      if (show && fill != null) btn.fill = fill;
      this.paintLobbyBtn(btn, show);
    }

    refreshPvpLobby() {
      const show = this.mode === "pvp";
      const inRoom = show && !!this.pvpSeat;
      if (this.lobbyPanel) {
        this.lobbyPanel.clear();
        this.lobbyPanel.setVisible(show);
        if (show) {
          paintValleyPanel(this.lobbyPanel, this.lobbyX, this.lobbyTop ?? 98, this.lobbyW, 412, {
            selected: true,
            accent: 0xd4b056,
            radius: 14,
            inset: 8,
          });
        }
      }
      this.lobbyTitle?.setVisible(show);
      this.lobbySub?.setVisible(show);
      if (show) {
        const n = this.pvpConnectedCount();
        const readyN = this.onlineSeats().filter((s) => this.ensureProfile(s).ready).length;
        this.lobbyTitle.setText(inRoom ? `房间  ${this.pvpRoom}` : "局域网对战");
        let sub = "每人打开同一地址，创建或加入房间，无需带参数";
        if (inRoom) {
          if (n < 2) sub = "1 人在场　把房号发给同事即可开战";
          else if (n === 2) {
            sub = this.allOnlineReady()
              ? "2 人已准备　即将 1v1"
              : `2 人在场 · 1v1　已准备 ${readyN}/2`;
          } else {
            sub = this.allOnlineReady()
              ? "3 人已准备　即将混战"
              : `3 人在场 · 混战　已准备 ${readyN}/3`;
          }
        }
        this.lobbySub.setText(sub);
      }
      (this.pvpLobby || []).forEach((row) => {
        row.g.clear();
        row.g.setVisible(show);
        row.avatar.setVisible(false);
        row.title.setVisible(show);
        row.hero.setVisible(show);
        row.ready.setVisible(show);
        if (!show) return;
        const online = !!this.pvpSeats?.[row.seat];
        const profile = this.ensureProfile(row.seat);
        const mine = row.seat === this.pvpSeat;
        paintValleyPanel(row.g, row.x + 10, row.y, this.lobbyW - 20, row.h, {
          selected: mine,
          accent: mine ? 0xe8c36a : 0xa08050,
          radius: 10,
          inset: 4,
        });
        const nick = online ? profile.nick || defaultNick(row.seat) : "空位";
        row.title.setText(`${seatLabel(row.seat)}${mine ? " ·我" : ""}　${nick}`);
        row.hero.setText(online && profile.heroId ? this.fighters[profile.heroId]?.displayName || profile.heroId : "未选英灵");
        row.title.setColor(mine ? "#3a2410" : "#ead8a8");
        row.hero.setColor(online ? (mine ? "#1a3a6a" : "#c8d8f0") : "#8a7a60");
        row.ready.setText(!online ? "未入场" : profile.ready ? "已准备" : "选人中");
        row.ready.setColor(!online ? "#8a7a60" : profile.ready ? "#2d6a32" : "#8a5a18");
        if (online && profile.heroId) {
          const texKey = `roster-${profile.heroId}`;
          if (this.textures.exists(texKey)) {
            const fighter = this.fighters[profile.heroId] || {};
            const layout = rosterHeroLayout(this, fighter, texKey, 34, 42);
            row.avatar.setTexture(texKey, 0).setVisible(true);
            row.avatar
              .setOrigin(layout.originX, layout.originY)
              .setPosition(row.x + 32, row.y + row.h - 8)
              .setScale(layout.scale);
          }
        }
      });
      this.setLobbyBtn(this.createBtn, show && !inRoom);
      this.setLobbyBtn(this.joinBtn, show && !inRoom);
      const mineReady = inRoom && this.ensureProfile(this.pvpSeat).ready;
      const hostStart = inRoom && this.pvpSeat === "host";
      if (this.readyBtn) this.readyBtn.w = hostStart ? 132 : 276;
      this.setLobbyBtn(
        this.readyBtn,
        inRoom,
        mineReady ? "取消准备" : "准备",
        mineReady ? 0x3f5e3f : 0x2f4a66
      );
      const startLabel = this.pvpConnectedCount() >= 3 ? "开战·混战" : "开战·1v1";
      this.setLobbyBtn(
        this.startBtn,
        hostStart && this.pvpConnectedCount() >= 2,
        this.allOnlineReady() ? startLabel : "等人齐",
        this.allOnlineReady() ? 0x6a4a18 : 0x333333
      );
      this.setLobbyBtn(this.nickBtn, inRoom);
      this.setLobbyBtn(this.leaveBtn, inRoom);
    }

    playSelectVoice(heroId) {
      if (!heroId || this.drawingMap) return;
      const key = `select-voice-${heroId}`;
      const line = this.fighters[heroId]?.voice?.lines?.select;
      const file = line?.file || "voice/select.mp3";
      if (this._selectVoice?.heroId === heroId && this._selectVoice?.snd?.isPlaying) return;
      const play = () => {
        if (!this.cache.audio.exists(key)) return;
        if (this._selectVoice?.snd?.isPlaying && this._selectVoice.heroId !== heroId) {
          /* previous pick no longer selected; new pick must play in full */
        }
        const snd = this.sound.add(key, { volume: 0.78 });
        if (this._selectVoice?.snd) {
          try {
            this._selectVoice.snd.stop();
            this._selectVoice.snd.destroy();
          } catch {
            /* ignore */
          }
        }
        this._selectVoice = { heroId, snd };
        snd.once("complete", () => {
          try {
            snd.destroy();
          } catch {
            /* ignore */
          }
          if (this._selectVoice?.snd === snd) this._selectVoice = null;
        });
        snd.play();
      };
      if (!this.cache.audio.exists(key)) {
        this.load.audio(key, `/assets/game/heroes/${heroId}/${file}`);
        this.load.once(Phaser.Loader.Events.COMPLETE, play);
        this.load.start();
        return;
      }
      play();
    }

    broadcastPick() {
      const net = this.registry.get("net");
      if (!net?.connected || !this.pvpSeat) return;
      const id = this.playable[this.p1Index];
      this.rememberPick(this.pvpSeat, id);
      const ts = this.ensureProfile(this.pvpSeat).ts || Date.now();
      net.send({ type: "pick", heroId: id, ts });
      this.setReady(false);
    }

    syncSelf() {
      const net = this.registry.get("net");
      if (!net?.connected || !this.pvpSeat) return;
      const id = this.playable[this.p1Index];
      this.rememberPick(this.pvpSeat, id);
      const profile = this.ensureProfile(this.pvpSeat);
      net.send({ type: "pick", heroId: id, ts: profile.ts });
      this.broadcastNick();
      net.send({ type: "ready", ready: !!profile.ready, ts: profile.ts });
      this.broadcastLobby();
    }

    bindNet(net) {
      this.registry.set("net", net);
      net.on("state", () => {});
      net.on("roster", (msg) => {
        this.applyRoster(msg);
        this.refresh();
        this.tryAutoStart();
      });
      net.on("peer", (msg) => {
        this.applyRoster(msg);
        if (msg.event === "joined") {
          const n = this.pvpConnectedCount();
          this.pvpStatus = n >= 3 ? `房间 ${this.pvpRoom}　三人已齐，选定英灵后点准备` : `房间 ${this.pvpRoom}　已有 ${n} 人`;
          this.scheduleSync();
          this.refresh();
          this.tryAutoStart();
        } else if (msg.event === "left") {
          if (msg.seat && this.pvpPicks) this.pvpPicks[msg.seat] = "";
          if (msg.seat && this.pvpProfiles[msg.seat]) {
            this.pvpProfiles[msg.seat] = { nick: defaultNick(msg.seat), ready: false, heroId: "" };
          }
          if (msg.seat === "guest") this.pvpPeerHero = "";
          const n = this.pvpConnectedCount();
          this.pvpStatus =
            n <= 1
              ? `房间 ${this.pvpRoom}　有人离线，等待加入`
              : `房间 ${this.pvpRoom}　有人离线，现 ${n} 人`;
          this.locked = false;
          this.drawingMap = false;
          this.refresh();
        }
      });
      net.on("lobby_state", (msg) => {
        this.applyLobbyState(msg);
        this.refresh();
        this.tryAutoStart();
      });
      net.on("pick", (msg) => {
        if (!msg.heroId) return;
        const seat = msg._from || "guest";
        this.pvpSeats[seat] = true;
        this.rememberPick(seat, msg.heroId, msg.ts);
        this.refresh();
        this.tryAutoStart();
      });
      net.on("nick", (msg) => {
        const seat = msg._from;
        if (!seat) return;
        this.pvpSeats[seat] = true;
        const profile = this.ensureProfile(seat);
        profile.nick = String(msg.nick || "").trim().slice(0, 12) || defaultNick(seat);
        if (msg.ts) profile.ts = Number(msg.ts) || profile.ts || 0;
        this.refresh();
      });
      net.on("ready", (msg) => {
        const seat = msg._from;
        if (!seat) return;
        this.pvpSeats[seat] = true;
        const profile = this.ensureProfile(seat);
        const ts = Number(msg.ts) || 0;
        if (profile.ts && ts && ts < profile.ts) return;
        profile.ready = !!msg.ready;
        if (ts) profile.ts = ts;
        this.refresh();
        this.tryAutoStart();
      });
      net.on("stage_pick", (msg) => {
        if (msg._from === this.pvpSeat) return;
        this.applyStagePick(msg);
        this.refresh();
      });
      net.on("lobby_return", () => {
        if (this.mode !== "pvp") return;
        // 抽图/进战途中的过期回房包会掐掉本局
        if (this.drawingMap || this.locked) return;
        this.resetLobbyReady();
        this.pvpStatus = `房间 ${this.pvpRoom}　对局结束，可换英灵换图后再次准备`;
        this.refresh();
      });
      net.on("map_draw", (msg) => {
        if (this._blockAutoStart || this.pvpSeat === "host" || this.drawingMap) return;
        this.runMapDraw(msg.stageId, () => {
          this.beginMatch(msg.p1Id, msg.p2Id, msg.stageId, this.pvpSeat, msg.p3Id, msg.profiles);
        });
      });
      net.on("start", (msg) => {
        if (this._blockAutoStart || this.pvpSeat === "host" || this.drawingMap) return;
        this.beginMatch(msg.p1Id, msg.p2Id, msg.stageId, this.pvpSeat, msg.p3Id, msg.profiles);
      });
      net.on("error", (msg) => {
        this.pvpStatus = msg.message || "对战连接出错";
        this.locked = false;
        this.drawingMap = false;
        this.refresh();
      });
      net.on("close", () => {
        if (this.mode !== "pvp") return;
        this.pvpStatus = "连接已断开";
        this.locked = false;
        this.drawingMap = false;
        this.refresh();
      });
    }

    heroName(index) {
      const id = this.playable[index];
      return this.fighters[id]?.displayName || id || "—";
    }

    refresh() {
      const modeLabel =
        this.mode === "pvp" ? "PVP" : this.mode === "pve" ? "PVE" : this.mode === "cricket" ? "斗蛐蛐" : "木桩";
      if (this.mode === "pvp") {
        setChrome("select", this.pvpSeat && this.pvpRoom ? `${GAME_NAME}　房 ${this.pvpRoom}` : `${GAME_NAME}　局域网 PVP`);
        if (this.title) this.title.setText("").setVisible(false);
      } else {
        setChrome("select", `${GAME_NAME}　${modeLabel}`);
        if (this.title) this.title.setText("").setVisible(false);
      }
      this.paintModeTabs();
      // 翻页与换人解耦：refresh 不改卡池页码；仅点头像 / A·D 换人时 ensureHeroRailPageFor
      this.layoutHeroRail();
      this.refreshShowcases();
      if (this.modeDummy) this.modeDummy.setColor(this.mode === "dummy" ? "#4a3018" : "#ead8a8");
      if (this.modePve) this.modePve.setColor(this.mode === "pve" ? "#4a3018" : "#ead8a8");
      if (this.modeCricket) this.modeCricket.setColor(this.mode === "cricket" ? "#4a3018" : "#ead8a8");
      if (this.modePvp) this.modePvp.setColor(this.mode === "pvp" ? "#4a3018" : "#ead8a8");
      const share = this.mode === "pvp" ? `同网访问：${wsUrlHint(this.lanIps, this.lanPort)}` : "";
      setSelectFooter(
        share,
        this.mode === "cricket"
          ? "点左右立绘选两名人机　不锁地图则开战抽签　W/S 切 1P/2P　J 开打旁观"
          : this.mode === "pve"
            ? "点下方难度　　不锁地图则开战抽签　　F 切换难度"
            : "",
        false
      );
      this.refreshPvpLobby();
      this.cards.forEach((card, i) => {
        if (card.comingSoon) {
          card.g.clear();
          paintValleyPanel(card.g, card.x, card.top, card.cardW, card.cardW, {
            selected: false,
            accent: 0x5a4a38,
            radius: 12,
            inset: 5,
          });
          card.portrait.setAlpha(0.92);
          card.name.setColor("#8a7a60");
          card.badge.setText("？").setColor("#d4b06a");
          return;
        }
        const asMine = i === this.p1Index;
        const picks = this.pvpPicks || emptyPvpPicks();
        const peerSeats = [];
        if (this.mode === "pvp") {
          ["host", "guest", "guest2"].forEach((seat) => {
            if (seat === this.pvpSeat) return;
            if (picks[seat] === card.id) peerSeats.push(seat);
          });
        }
        const asPeer = this.mode === "pvp" ? peerSeats.length > 0 : i === this.p2Index;
        const on = this.mode === "pvp" ? asMine : this.slot === "p1" ? asMine : asPeer;
        const hover = i === this.hoverIndex;
        card.g.clear();
        const stroke =
          asMine && asPeer ? 0xf2d36b : asMine ? 0x4aa3ff : asPeer ? 0xe86a5a : hover ? 0xd4b056 : 0x4a4333;
        paintValleyPanel(card.g, card.x, card.top, card.cardW, card.cardW, {
          selected: on,
          accent: stroke,
          radius: 12,
          inset: 5,
        });
        card.portrait.setAlpha(asMine || asPeer || hover ? 1 : 0.72);
        card.name.setColor(on ? "#f8ecd0" : "#c4b090");
        if (this.mode === "pvp") {
          const peerLabel = peerSeats.map((s) => seatLabel(s)).join("+");
          if (asMine && asPeer) card.badge.setText(`我+${peerLabel}`).setColor("#e8c36a");
          else if (asMine) card.badge.setText("我").setColor("#6ec8ff");
          else if (asPeer) card.badge.setText(peerLabel).setColor("#ff8a78");
          else card.badge.setText("");
        } else if (asMine && asPeer) card.badge.setText("双方").setColor("#e8c36a");
        else if (asMine) card.badge.setText("1P").setColor("#6ec8ff");
        else if (asPeer) card.badge.setText("2P").setColor("#ff8a78");
        else card.badge.setText("");
      });
    }

    paintModeTabs() {
      if (!this.modeGfx) return;
      this.modeGfx.clear();
      const tabs = [
        { t: this.modeDummy, on: this.mode === "dummy" },
        { t: this.modePve, on: this.mode === "pve" },
        { t: this.modeCricket, on: this.mode === "cricket" },
        { t: this.modePvp, on: this.mode === "pvp" },
      ];
      tabs.forEach(({ t, on }) => {
        if (!t) return;
        const bw = 132;
        const bh = 34;
        fillFlatTab(this.modeGfx, t.x - bw / 2, t.y - 6, bw, bh, on);
      });
      const pve = this.mode === "pve";
      const diffs = [
        { t: this.diffKind, id: "kind" },
        { t: this.diffFair, id: "fair" },
        { t: this.diffCruel, id: "cruel" },
      ];
      diffs.forEach(({ t, id }) => {
        if (!t) return;
        t.setVisible(pve);
        if (pve) t.setInteractive({ useHandCursor: true });
        else t.disableInteractive();
        const on = pve && this.cpuDiff === id;
        t.setColor(on ? "#4a3018" : "#ead8a8");
        if (!pve) return;
        const bw = 156;
        const bh = 32;
        fillFlatTab(this.modeGfx, t.x - bw / 2, t.y - 6, bw, bh, on);
      });
    }

    runMapDraw(stageId, onDone) {
      if (this.drawingMap) return;
      this.drawingMap = true;
      this.locked = true;
      const w = this.scale.width;
      const h = this.scale.height;
      const n = this.stageIds.length;
      if (!n) {
        this.drawingMap = false;
        this.locked = false;
        this.time.delayedCall(200, () => onDone?.());
        return;
      }
      const pick = this.stageIds.includes(stageId) ? stageId : this.stageIds[0];
      const pickIndex = Math.max(0, this.stageIds.indexOf(pick));
      const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x140e0a, 0.88).setDepth(200);
      const title = uiText(this, w / 2, 56, "战场抽签", {
        fontSize: 32,
        color: "#f6e4b4",
        stroke: "#3a2410",
        strokeThickness: 4,
      })
        .setOrigin(0.5)
        .setDepth(201);
      const nameText = uiText(this, w / 2, h - 72, "", {
        fontSize: 24,
        color: "#f4ead0",
        stroke: "#3a2410",
        strokeThickness: 4,
        wordWrap: { width: Math.min(w - 80, 640), useAdvancedWrap: true },
        align: "center",
      })
        .setOrigin(0.5)
        .setDepth(201);
      const cardW = Math.min(220, (w - 80) / Math.max(3, Math.min(n, 6)));
      const cardH = cardW * 0.56;
      const gap = 14;
      const total = n * cardW + (n - 1) * gap;
      const left = (w - total) / 2;
      const cy = h / 2 - 10;
      const cards = this.stageIds.map((id, i) => {
        const x = left + i * (cardW + gap) + cardW / 2;
        const img = this.add
          .image(x, cy, `stage-thumb-${id}`)
          .setDisplaySize(cardW, cardH)
          .setDepth(202)
          .setAlpha(0.45);
        const frame = this.add.graphics().setDepth(203);
        return { id, x, img, frame };
      });
      const glow = this.add.graphics().setDepth(204);
      const totalSteps = Math.max(n * 2 + pickIndex, pickIndex);
      const stepMs = 90;
      let step = 0;
      let finished = false;
      const paint = (hi, settled) => {
        glow.clear();
        cards.forEach((c, i) => {
          const on = i === hi;
          c.img.setAlpha(on ? 1 : settled ? 0.28 : 0.4);
          c.frame.clear();
          if (on) {
            paintValleyPanel(c.frame, c.x - cardW / 2 - 8, cy - cardH / 2 - 8, cardW + 16, cardH + 16, {
              selected: settled,
              accent: settled ? 0xe8c36a : 0x7ec8ff,
              radius: 10,
              hollow: true,
            });
            if (!settled) {
              glow.lineStyle(2, 0x9ad4ff, 0.55);
              glow.strokeRoundedRect(c.x - cardW / 2 - 12, cy - cardH / 2 - 12, cardW + 24, cardH + 24, 12);
            }
          }
        });
        const stageNameStyle = {
          fontFamily: UI_FONT,
          fontSize: 24,
          color: "#f4ead0",
          stroke: "#3a2410",
          strokeThickness: 4,
        };
        nameText.setText(
          clampWrappedLines(
            this,
            this.stages[this.stageIds[hi]]?.displayName || this.stageIds[hi] || "",
            stageNameStyle,
            Math.min(w - 80, 640),
            2
          )
        );
      };
      paint(0, false);
      playUiSfx(this, UI_SFX.mapDrawTick, { volume: 0.68 });
      this.mapDrawTimer = this.time.addEvent({
        delay: stepMs,
        repeat: totalSteps,
        callback: () => {
          if (finished || !n) return;
          const hi = step % n;
          step += 1;
          const settled = step > totalSteps;
          paint(settled ? pickIndex : hi, settled);
          if (!settled) {
            playUiSfx(this, UI_SFX.mapDrawTick, {
              volume: 0.58 + (step / totalSteps) * 0.28,
              detune: hi * 35,
              rate: 0.95 + (step / totalSteps) * 0.15,
            });
            return;
          }
          finished = true;
          playUiSfx(this, UI_SFX.mapDrawPick, { volume: 0.92 });
          title.setText(`选定：${this.stages[pick]?.displayName || pick}`);
          this.time.delayedCall(700, () => {
            overlay.destroy();
            title.destroy();
            nameText.destroy();
            glow.destroy();
            cards.forEach((c) => {
              c.img.destroy();
              c.frame.destroy();
            });
            this.drawingMap = false;
            onDone?.();
          });
        },
      });
    }

    beginMatch(p1Id, p2Id, stageId, seat, p3Id, profiles) {
      this.locked = true;
      this.drawingMap = false;
      const net = this.registry.get("net");
      clearNetLobbyPings(net);
      const fightGen = Number(this.registry.get("pvpFightGen")) || 0;
      if (net) net._fightGen = fightGen;
      net?.discard?.(["lobby_return", "state", "start", "map_draw"]);
      const three = Boolean(p3Id);
      const pack = {
        p1Id,
        p2Id,
        p3Id: three ? p3Id : "",
        pvpThree: three,
        mode: "pvp",
        seat,
        room: this.pvpRoom,
        stageId: stageId || this.stageIds[0],
        stageIds: this.stageIds,
        stages: this.stages,
        p1: this.fighters[p1Id],
        p2: this.fighters[p2Id],
        p3: three ? this.fighters[p3Id] : null,
        profiles: profiles || this.pvpProfiles || {},
        fightGen,
      };
      this.registry.set("match", pack);
      this.scene.start("loader", pack);
    }

    async hostPvp() {
      if (!window.HeroNet?.NetRoom) {
        this.pvpStatus = "缺少 net.js";
        this.refresh();
        return;
      }
      if (this.pvpSeat || this.locked) return;
      const nick = this.promptNick("创建房间");
      if (!nick) return;
      this.locked = true;
      this.pvpStatus = "正在开房…";
      this.refresh();
      try {
        const net = new window.HeroNet.NetRoom();
        const msg = await net.create();
        this.bindNet(net);
        this.pvpSeat = "host";
        this.pvpRoom = msg.room;
        this.ensureProfile(this.pvpSeat).nick = nick;
        this.lanIps = msg.ips || this.lanIps;
        this.lanPort = msg.port || this.lanPort;
        this.applyRoster(msg);
        this.pvpSeats.host = true;
        this.pvpStatus = `房间 ${this.pvpRoom}　把房号发给同事`;
        this.locked = false;
        try {
          const url = new URL(location.href);
          url.searchParams.set("mode", "pvp");
          history.replaceState({}, "", url);
        } catch {
          /* ignore */
        }
        this.scheduleSync();
        this.refresh();
      } catch (err) {
        this.pvpStatus = err.message || "开房失败";
        this.locked = false;
        this.refresh();
      }
    }

    async joinPvp(roomCode) {
      if (!window.HeroNet?.NetRoom) {
        this.pvpStatus = "缺少 net.js";
        this.refresh();
        return;
      }
      if (this.pvpSeat || this.locked) return;
      let code = String(roomCode || "").trim().toUpperCase();
      if (!code) {
        code = String(window.prompt("输入房间号（4 位）", "") || "")
          .trim()
          .toUpperCase();
      }
      if (!code) return;
      const nick = this.promptNick("加入房间");
      if (!nick) return;
      this.locked = true;
      this.pvpStatus = `正在加入 ${code}…`;
      this.refresh();
      try {
        const net = new window.HeroNet.NetRoom();
        const msg = await net.join(code);
        this.bindNet(net);
        this.pvpSeat = msg.seat || "guest";
        this.pvpRoom = code;
        this.ensureProfile(this.pvpSeat).nick = nick;
        this.applyRoster(msg);
        this.pvpSeats[this.pvpSeat] = true;
        this.pvpStatus = `已加入 ${code}　选定英灵后点准备`;
        this.locked = false;
        try {
          const url = new URL(location.href);
          url.searchParams.set("mode", "pvp");
          history.replaceState({}, "", url);
        } catch {
          /* ignore */
        }
        this.scheduleSync();
        this.refresh();
      } catch (err) {
        this.pvpStatus = err.message || "加入失败";
        this.locked = false;
        this.refresh();
      }
    }

    startHostMatch() {
      if (this.pvpSeat !== "host" || this.drawingMap) return;
      const net = this.registry.get("net");
      if (!net?.connected) {
        this.pvpStatus = "尚未开房";
        this.refresh();
        return;
      }
      const n = this.pvpConnectedCount();
      if (n < 2) {
        this.pvpStatus = `房间 ${this.pvpRoom}　至少 2 人在线才能开战`;
        this.refresh();
        return;
      }
      if (!this.allOnlineReady()) {
        this.pvpStatus = `房间 ${this.pvpRoom}　等待全员准备`;
        this.refresh();
        return;
      }
      this.locked = true;
      const p1Id = this.heroOf("host") || this.playable[this.p1Index];
      const p2Id = this.heroOf("guest");
      const p3Id = n >= 3 ? this.heroOf("guest2") : "";
      if (!p2Id || (n >= 3 && !p3Id)) {
        this.locked = false;
        this.pvpStatus = `房间 ${this.pvpRoom}　还有人未选定英灵（${n} 人在线）`;
        this.refresh();
        return;
      }
      const stageId = this.stageConfirmed
        ? this.stageIds[this.stageIndex] || this.stageIds[0]
        : this.stageIds[Phaser.Math.Between(0, Math.max(0, this.stageIds.length - 1))] || this.stageIds[0];
      this.pvpStatus = this.stageConfirmed ? "全员已准备，进入选定地图" : "全员已准备，开战";
      this.refresh();
      const payload = { p1Id, p2Id, p3Id: p3Id || undefined, stageId, profiles: this.pvpProfiles };
      if (this.stageConfirmed) {
        net.send({ type: "start", ...payload });
        this.beginMatch(p1Id, p2Id, stageId, "host", p3Id || undefined, this.pvpProfiles);
        return;
      }
      net.send({ type: "map_draw", ...payload });
      this.runMapDraw(stageId, () => {
        this.beginMatch(p1Id, p2Id, stageId, "host", p3Id || undefined, this.pvpProfiles);
      });
    }

    confirm() {
      if (this.drawingMap) return;
      if (this.mode === "pvp") {
        if (this.locked) return;
        if (this.pvpSeat) this.setReady(!this.ensureProfile(this.pvpSeat).ready);
        return;
      }
      if (this.locked || !this.playable.length) return;
      const wantDraw = (this.mode === "pve" || this.mode === "cricket") && !this.stageConfirmed && this.stageIds.length > 1;
      if (!this.stageConfirmed && !wantDraw) {
        setSelectFooter(null, "请先锁定战场", true);
        this.time.delayedCall(1800, () => this.refresh());
        return;
      }
      this.locked = true;
      this.cpuDiff = saveCpuDiff(this.cpuDiff);
      const p1Id = this.playable[this.p1Index];
      const p2Id = this.playable[this.p2Index] || p1Id;
      const stageId = this.stageConfirmed
        ? this.stageIds[this.stageIndex] || this.stageIds[0]
        : this.stageIds[Phaser.Math.Between(0, Math.max(0, this.stageIds.length - 1))] || this.stageIds[0];
      try {
        const url = new URL(location.href);
        url.searchParams.set("p1", p1Id);
        url.searchParams.set("p2", p2Id);
        url.searchParams.set("mode", this.mode);
        url.searchParams.set("diff", cpuDiffId(this.cpuDiff));
        if (stageId) url.searchParams.set("stage", stageId);
        history.replaceState({}, "", url);
      } catch {
        /* ignore */
      }
      const pack = {
        p1Id,
        p2Id,
        mode: this.mode,
        cpuDiff: cpuDiffId(this.cpuDiff),
        stageId,
        stageIds: this.stageIds,
        stages: this.stages,
        p1: this.fighters[p1Id],
        p2: this.fighters[p2Id],
      };
      const go = () => {
        this.registry.set("match", pack);
        this.scene.start("loader", pack);
      };
      if (wantDraw) {
        this.runMapDraw(stageId, go);
        return;
      }
      go();
    }

    update() {
      this.tickShowcaseSpins();
      if (!this.keys || this.drawingMap || this.locked) return;
      const pressed = (key) => key && Phaser.Input.Keyboard.JustDown(key);
      if (pressed(this.keys.Q)) {
        const order = ["dummy", "pve", "cricket", "pvp"];
        this.setMode(order[(order.indexOf(this.mode) + 1) % order.length]);
      }
      if (pressed(this.keys.ONE)) this.setMode("dummy");
      if (pressed(this.keys.TWO)) this.setMode("pve");
      if (pressed(this.keys.THREE)) this.setMode("cricket");
      if (pressed(this.keys.FOUR)) this.setMode("pvp");
      if (this.mode === "pve") {
        if (pressed(this.keys.FIVE)) this.setCpuDiff("kind");
        if (pressed(this.keys.SIX)) this.setCpuDiff("fair");
        if (pressed(this.keys.F)) {
          const order = ["kind", "fair", "cruel"];
          const i = Math.max(0, order.indexOf(cpuDiffId(this.cpuDiff)));
          this.setCpuDiff(order[(i + 1) % order.length]);
        }
      }
      if (this.mode === "pvp") {
        const left = pressed(this.keys.A) || pressed(this.keys.LEFT);
        const right = pressed(this.keys.D) || pressed(this.keys.RIGHT);
        const readyToggle = pressed(this.keys.R);
        const n = this.playable.length;
        if (n && (left || right)) {
          const dir = left ? n - 1 : 1;
          this.p1Index = (this.p1Index + dir) % n;
          this.ensureHeroRailPageFor(this.p1Index);
          this.broadcastPick();
          this.refresh();
          this.playSelectVoice(this.playable[this.p1Index]);
        }
        if (readyToggle && this.pvpSeat) this.setReady(!this.ensureProfile(this.pvpSeat).ready);
        if (pressed(this.keys.E)) this.confirmStage();
        if ((pressed(this.keys.J) || pressed(this.keys.ENTER) || pressed(this.keys.SPACE)) && this.pvpSeat) {
          this.setReady(!this.ensureProfile(this.pvpSeat).ready);
        }
        return;
      }
      if (pressed(this.keys.E)) this.confirmStage();
      const pickP1 = pressed(this.keys.W) || pressed(this.keys.UP);
      const pickP2 = pressed(this.keys.S) || pressed(this.keys.DOWN);
      const tab = pressed(this.keys.TAB);
      const left = pressed(this.keys.A) || pressed(this.keys.LEFT);
      const right = pressed(this.keys.D) || pressed(this.keys.RIGHT);
      const start = pressed(this.keys.J) || pressed(this.keys.ENTER) || pressed(this.keys.SPACE);
      if (pickP1) this.slot = "p1";
      else if (pickP2) this.slot = "p2";
      else if (tab) this.slot = this.slot === "p1" ? "p2" : "p1";
      const n = this.playable.length;
      if (n && (left || right)) {
        const dir = left ? n - 1 : 1;
        if (this.slot === "p1") {
          this.p1Index = (this.p1Index + dir) % n;
          this.ensureHeroRailPageFor(this.p1Index);
          this.playSelectVoice(this.playable[this.p1Index]);
        } else {
          this.p2Index = (this.p2Index + dir) % n;
          this.ensureHeroRailPageFor(this.p2Index);
          this.playSelectVoice(this.playable[this.p2Index]);
        }
      } else if (pickP1 || pickP2 || tab) {
        this.ensureHeroRailPageFor(this.slot === "p1" ? this.p1Index : this.p2Index);
      }
      if (pickP1 || pickP2 || tab || left || right) this.refresh();
      if (start) this.confirm();
    }
  }

  class Load extends Phaser.Scene {
    constructor() {
      super("loader");
    }

    init(data) {
      this.pack = data && data.p1 ? data : this.registry.get("match") || {};
    }

    preload() {
      wipeFightAssets(this);
      loadUiSfx(this);
      setChrome("select", "正在进入对战…");
      const pack = this.pack || {};
      const { p1Id, p2Id, p3Id } = pack;
      const t = Date.now();
      // Same keys would be skipped from json cache on rematch, so old fighter.json sticks
      // and preload queues 0 files — create then thinks there is nothing to load.
      this.cache.json.remove("fresh-p1");
      this.cache.json.remove("fresh-p2");
      this.cache.json.remove("fresh-p3");
      if (p1Id) this.load.json("fresh-p1", `/assets/game/heroes/${p1Id}/fighter.json?t=${t}`);
      if (p2Id && p2Id !== p1Id) this.load.json("fresh-p2", `/assets/game/heroes/${p2Id}/fighter.json?t=${t}`);
      if (p3Id && p3Id !== p1Id && p3Id !== p2Id) {
        this.load.json("fresh-p3", `/assets/game/heroes/${p3Id}/fighter.json?t=${t}`);
      }
    }

    create() {
      const pack = this.pack || {};
      const p1Id = pack.p1Id;
      const p2Id = pack.p2Id;
      const p3Id = pack.p3Id;
      const p1 = this.cache.json.get("fresh-p1") || pack.p1;
      const p2 = p2Id === p1Id ? p1 : this.cache.json.get("fresh-p2") || pack.p2 || p1;
      let p3 = null;
      if (p3Id) {
        if (p3Id === p1Id) p3 = p1;
        else if (p3Id === p2Id) p3 = p2;
        else p3 = this.cache.json.get("fresh-p3") || pack.p3;
      }
      this.pack = { ...pack, p1, p2, p3 };
      const roster = this.registry.get("roster") || {};
      if (roster.fighters) {
        if (p1Id && p1) roster.fighters[p1Id] = p1;
        if (p2Id && p2) roster.fighters[p2Id] = p2;
        if (p3Id && p3) roster.fighters[p3Id] = p3;
      }
      this.failedFiles = [];
      this.load.off("loaderror");
      this.load.on("loaderror", (file) => {
        const src = file?.src || file?.url || file?.key;
        this.failedFiles.push(src);
        console.warn("asset missing", file?.key, src);
      });
      this.queueFightAssets();
      this.finishLoad(0);
    }

    queueFightAssets() {
      const pack = this.pack || {};
      (pack.stageIds || [pack.stageId]).filter(Boolean).forEach((id) => {
        const key = `stage-${id}`;
        if (this.textures.exists(key)) this.textures.remove(key);
        const file = pack.stages?.[id]?.file || "stage.png";
        const bust = pack.stages?.[id]?.committedAt || Date.now();
        this.load.image(key, `/assets/game/stages/${id}/${file}?t=${encodeURIComponent(bust)}`);
        queueStageBgm(this, id, pack.stages);
      });
      loadFighterSprites(this, "p1", pack.p1Id, pack.p1);
      if (pack.p2Id && pack.p2Id !== pack.p1Id) loadFighterSprites(this, "p2", pack.p2Id, pack.p2);
      if (pack.p3Id) {
        const p3Data =
          pack.p3 ||
          (pack.p3Id === pack.p1Id ? pack.p1 : pack.p3Id === pack.p2Id ? pack.p2 : null);
        loadFighterSprites(this, "p3", pack.p3Id, p3Data);
      }
    }

    finishLoad(attempt) {
      const go = () => {
        if (this.textures.exists("p1-idle")) {
          this.enterFight();
          return;
        }
        if (attempt < 1) {
          this.queueFightAssets();
          this.finishLoad(attempt + 1);
          return;
        }
        this.showLoadFail();
      };
      // totalToLoad is leftover from preload; list.size is the files just queued.
      if (this.load.list.size > 0) {
        this.load.once("complete", go);
        this.load.start();
      } else {
        go();
      }
    }

    showLoadFail() {
      const detail = this.failedFiles.slice(0, 3).join("\n");
      setChrome("select", "加载失败，返回英灵选择");
      this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x121314, 1).setOrigin(0, 0);
      this.add
        .text(
          this.scale.width / 2,
          this.scale.height / 2,
          detail ? `英灵资源加载失败\n${detail}\n按 Esc 返回` : "英灵资源加载失败，按 Esc 返回",
          {
            fontFamily: UI_FONT,
            fontSize: 16,
            color: "#f88",
            align: "center",
          }
        )
        .setOrigin(0.5);
      this.input.keyboard.once("keydown-ESC", () => this.scene.start("select"));
    }

    enterFight() {
      const { p1, p2, p1Id, p2Id, p3Id, p3 } = this.pack || {};
      if (!p1 || !this.textures.exists("p1-idle")) {
        this.showLoadFail();
        return;
      }
      let p1Pivots = {};
      let p2Pivots = {};
      let p3Pivots = {};
      try {
        p1Pivots = makeAnims(this, "p1", p1);
        p2Pivots = p2Id === p1Id ? p1Pivots : makeAnims(this, "p2", p2 || p1);
        if (p3Id) {
          if (p3Id === p1Id) p3Pivots = p1Pivots;
          else if (p3Id === p2Id) p3Pivots = p2Pivots;
          else p3Pivots = makeAnims(this, "p3", p3 || p2);
        }
      } catch (err) {
        console.warn("makeAnims", err);
      }
      this.scene.start("fight", {
        ...this.pack,
        p1Pivots,
        p2Pivots,
        p3Pivots,
        shareDummy: p2Id === p1Id,
        mode: this.pack.mode || "dummy",
      });
    }
  }

  class Fight extends Phaser.Scene {
    constructor() {
      super("fight");
    }

    init(data) {
      this.pack = data;
    }

    create() {
      const w = this.scale.width;
      const h = this.scale.height;
      this.groundY = Math.round(h * 0.84);
      this.stageIds = this.pack.stageIds || [this.pack.stageId];
      this.stageIndex = Math.max(0, this.stageIds.indexOf(this.pack.stageId));
      this.mountStage(this.pack.stageId);
      this.physics.world.setBoundsCollision(true, true, true, true);
      this.physics.world.gravity.y = GRAVITY;
      this.buildTerrain();

      this.p1 = new Actor(this, "p1", this.pack.p1, this.pack.p1Pivots, this.spawnX(this.pack.pvpThree ? 0.22 : 0.32), 1);
      this.p1.heroId = this.pack.p1Id || this.p1.heroId;
      this.p2 = new Actor(
        this,
        this.pack.shareDummy ? "p1" : "p2",
        this.pack.p2,
        this.pack.p2Pivots,
        this.spawnX(this.pack.pvpThree ? 0.5 : 0.68),
        -1
      );
      this.p2.heroId = this.pack.p2Id || this.p2.heroId;
      this.p3 = null;
      if (this.pack.pvpThree && this.pack.p3) {
        this.p3 = new Actor(this, "p3", this.pack.p3, this.pack.p3Pivots, this.spawnX(0.78), 1);
        this.p3.heroId = this.pack.p3Id || this.p3.heroId;
      }
      if (this.pack.shareDummy) {
        this.p2.tint = 0xc5d0ee;
        this.p2.sprite.setTint(this.p2.tint);
      }
      this.pve = this.pack.mode === "pve";
      this.pvp = this.pack.mode === "pvp";
      this.cricket = this.pack.mode === "cricket";
      this.cpuDiff = cpuDiffId(this.pack.cpuDiff);
      this.pvpThree = !!(this.pvp && this.pack.pvpThree && this.p3);
      this.seat = this.pack.seat || "host";
      this.isHost = !this.pvp || this.seat === "host";
      this.net = this.pvp ? this.registry.get("net") : null;
      this.fightGen = Number(this.pack.fightGen) || Number(this.registry.get("pvpFightGen")) || 0;
      if (this.pvp) {
        this.fightGen += 1;
        this.pack.fightGen = this.fightGen;
        this.registry.set("pvpFightGen", this.fightGen);
        if (this.net) this.net._fightGen = this.fightGen;
      }
      this.remotePads = { guest: emptyPad(), guest2: emptyPad() };
      this.guestBuf = { lastUpAt: 0, lastDownAt: 0, pendingJumpAt: 0, pendingJAt: 0, pendingKAt: 0, pendingLAt: 0 };
      this.guest2Buf = { lastUpAt: 0, lastDownAt: 0, pendingJumpAt: 0, pendingJAt: 0, pendingKAt: 0, pendingLAt: 0 };
      this.hostBuf = { lastUpAt: 0, lastDownAt: 0, pendingJumpAt: 0, pendingJAt: 0, pendingKAt: 0, pendingLAt: 0 };
      this.p2.anchor = false;
      this.p2.infinite = !this.pve && !this.pvp && !this.cricket;
      this.p2.sprite.body.pushable = true;
      this.p2.sprite.setImmovable(false);
      if (this.p3) {
        this.p3.anchor = false;
        this.p3.infinite = false;
        this.p3.sprite.body.pushable = true;
        this.p3.sprite.setImmovable(false);
      }
      this.wireTerrainColliders();
      this.cpuMap = {};
      this.cpu = this.cpuBrain(this.p2);
      if (this.cricket) {
        [this.p1, this.p2].forEach((a) => {
          a.maxHp = Math.round(BASE_HP * 1.35);
          a.hp = a.maxHp;
        });
        this.cpuBrain(this.p1).nextAt = 80;
        this.cpuBrain(this.p2).nextAt = 280;
      }
      const openMs = this.pvp || this.pve || this.cricket ? 1800 : 800;
      // 所有模式开战前都 3-2-1（含木桩），幕拉开后再喊
      this.countMs = 3800;
      this.countAt = Number.MAX_SAFE_INTEGER;
      this.roundAt = Number.MAX_SAFE_INTEGER;
      this._countdownArmed = false;
      this._countLabelPrev = "";
      this.profiles = this.pack.profiles || {};
      const nickOf = (seat) => this.profiles?.[seat]?.nick || defaultNick(seat);
      this.playerTags = [];
      const tagStyle = {
        fontFamily: UI_FONT,
        fontSize: 13,
        color: "#e8c36a",
        stroke: "#000",
        strokeThickness: 3,
      };
      if (this.pvp) {
        const tags = this.pvpThree
          ? [
              { actor: this.p1, label: nickOf("host") },
              { actor: this.p2, label: nickOf("guest") },
              { actor: this.p3, label: nickOf("guest2") },
            ]
          : [
              { actor: this.p1, label: nickOf("host") },
              { actor: this.p2, label: nickOf("guest") },
            ];
        tags.forEach(({ actor, label }) => {
          const mine = actor === this.myActor();
          this.playerTags.push(
            crispUi(
              this.add
                .text(actor.sprite.x, actor.sprite.y - 210, mine ? `我·${label}` : label, {
                  ...tagStyle,
                  fontSize: 16,
                })
                .setOrigin(0.5, 1)
            )
          );
        });
        this.dummyTag = this.playerTags[this.pvpThree ? 0 : 1];
      } else if (this.cricket) {
        [this.p1, this.p2].forEach((actor, i) => {
          this.playerTags.push(
            crispUi(
              this.add
                .text(actor.sprite.x, actor.sprite.y - 210, i === 0 ? "人机·甲" : "人机·乙", {
                  ...tagStyle,
                  fontSize: 16,
                  color: i === 0 ? "#6ec8ff" : "#ff8a78",
                })
                .setOrigin(0.5, 1)
            )
          );
        });
        this.dummyTag = this.playerTags[1];
      } else {
        const tagLabel = this.pve ? cpuDiffLabel(this.cpuDiff) : "木桩";
        this.dummyTag = crispUi(
          this.add
            .text(this.p2.sprite.x, this.p2.sprite.y - 210, tagLabel, {
              ...tagStyle,
              fontSize: 16,
              color: this.pve ? "#e8c36a" : "#d7e2ff",
            })
            .setOrigin(0.5, 1)
        );
      }

      this.over = false;
      this.resultShown = false;
      this.hitstop = false;
      this.cine = null;
      this.camLock = null;
      this.outcomeTags = [];
      this.lastKo = null;
      this.cutinActive = false;
      this.cutinFx = null;
      this.lastUpAt = 0;
      this.lastDownAt = 0;
      this.upJumpAt = 0;
      this.pendingJumpAt = 0;
      this.pendingJAt = 0;
      this.pendingKAt = 0;
      this.pendingLAt = 0;
      if (!this.p1.startMove("opening_cg")) {
        this.p1.startMove("idle", { busy: false });
      }
      if (this.cricket) {
        if (!this.p2.startMove("opening_cg")) {
          this.p2.startMove("idle", { busy: false });
        }
      } else {
        this.p2.startMove("idle", { busy: false });
      }
      if (this.p3) this.p3.startMove("idle", { busy: false });

      this.projectiles = [];
      this.input.once("pointerdown", () => this.sound.unlock());
      this.input.keyboard.once("keydown", () => this.sound.unlock());
      this.keys = this.input.keyboard.addKeys("W,A,S,D,J,K,L,I,O,P,H,N,ESC,ENTER,SHIFT");
      this.input.keyboard.addCapture("ESC");
      this._leavingFight = false;
      this.input.keyboard.on("keydown-ESC", this.onFightEsc, this);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        this.input.keyboard.off("keydown-ESC", this.onFightEsc, this);
        killStageBgm(this);
      });

      setChrome(this.pvp ? "pvp" : this.pve ? "pve" : this.cricket ? "cricket" : "dummy");
      this.syncTitle();
      if (this.pvp && this.net) this.wireNet();

      this.resultWash = this.add.graphics().setScrollFactor(0).setDepth(54).setAlpha(0);
      this.result = this.add
        .text(w / 2, h * 0.46, "", {
          fontFamily: BRUSH_FONT,
          fontSize: 168,
          color: "#f3e6c0",
          stroke: "#2a1a0c",
          strokeThickness: 8,
        })
        .setOrigin(0.5)
        .setDepth(55)
        .setScrollFactor(0)
        .setAlpha(0);
      this.resultHint = this.add
        .text(w / 2, h * 0.72, "", {
          fontFamily: UI_FONT,
          fontSize: 16,
          color: "#c8b88a",
          stroke: "#000",
          strokeThickness: 4,
        })
        .setOrigin(0.5)
        .setDepth(55)
        .setScrollFactor(0)
        .setAlpha(0);
      this.countText = crispUi(
        this.add
          .text(w / 2, h * 0.42, "", {
            fontFamily: UI_FONT,
            fontSize: 118,
            color: "#f2e6c4",
            stroke: "#000",
            strokeThickness: 12,
          })
          .setOrigin(0.5)
          .setDepth(70)
          .setScrollFactor(0)
          .setAlpha(0)
      );

      this.hpGfx = this.add.graphics().setScrollFactor(0).setDepth(20);
      this.hud = uiText(this, 16, 92, "", {
        fontSize: 16,
        color: "#f8ecd0",
        stroke: "#3a2410",
        strokeThickness: 3,
      }).setScrollFactor(0).setDepth(22);
      this.buildHudChrome();
      this.drawHp();
      this.buildCurtains();
      this.openCurtains(openMs);
    }

    stageName() {
      const id = this.pack.stageId;
      return this.pack.stages?.[id]?.displayName || id;
    }

    applyArenaBounds() {
      const h = this.scale.height;
      // 四面挡：防止跳飞出顶、掉出底；左右挡边
      this.physics.world.setBounds(48, -48, this.worldW - 96, h + 12);
      this.cameras.main.setBounds(0, 0, this.worldW, h);
    }

    collisionSpec() {
      return sanitizeCollision(this.pack.stages?.[this.pack.stageId]?.collision);
    }

    worldBox(r) {
      return {
        left: r.x * this.worldW,
        right: (r.x + r.w) * this.worldW,
        top: r.y * this.scale.height,
        bottom: (r.y + r.h) * this.scale.height,
      };
    }

    spawnFloorY(x) {
      const spec = this.collisionSpec();
      let floor = null;
      spec.floors.forEach((r) => {
        const b = this.worldBox(r);
        if (x >= b.left && x <= b.right) {
          if (floor == null || b.top > floor) floor = b.top;
        }
      });
      if (floor != null) return floor;
      let plat = null;
      spec.platforms.forEach((r) => {
        const b = this.worldBox(r);
        if (x >= b.left && x <= b.right) {
          if (plat == null || b.top > plat) plat = b.top;
        }
      });
      return plat ?? this.groundY;
    }

    spawnX(frac) {
      const x = this.worldW * frac;
      const spec = this.collisionSpec();
      const onFloor = spec.floors.some((r) => {
        const b = this.worldBox(r);
        return x >= b.left + 20 && x <= b.right - 20;
      });
      if (onFloor) return x;
      let best = x;
      let bestD = 1e9;
      spec.floors.forEach((r) => {
        const b = this.worldBox(r);
        const nx = Phaser.Math.Clamp(x, b.left + 40, b.right - 40);
        const d = Math.abs(nx - x);
        if (d < bestD) {
          bestD = d;
          best = nx;
        }
      });
      return best;
    }

    surfaceTop(x, feetY) {
      const spec = this.collisionSpec();
      let best = null;
      let bestDist = 9999;
      spec.floors.concat(spec.platforms).forEach((r) => {
        const b = this.worldBox(r);
        if (x < b.left - 6 || x > b.right + 6) return;
        if (b.top > feetY + 12) return;
        const dist = Math.abs(b.top - feetY);
        if (dist < bestDist) {
          bestDist = dist;
          best = b.top;
        }
      });
      return best;
    }

    hasWalkable(x, feetY) {
      const spec = this.collisionSpec();
      return spec.floors.concat(spec.platforms).some((r) => {
        const b = this.worldBox(r);
        return x >= b.left && x <= b.right && Math.abs(b.top - feetY) < 22;
      });
    }

    cpuKillPitAt(x, y) {
      const spec = this.collisionSpec();
      for (const r of spec.pits) {
        if (r.kill === "none") continue;
        const b = this.worldBox(r);
        if (x >= b.left - 6 && x <= b.right + 6 && y >= b.top - 28) return b;
      }
      return null;
    }

    cpuJumpReach(vx = DASH) {
      const air = (2 * Math.abs(JUMP)) / Math.max(1, GRAVITY);
      return Math.abs(vx) * air * 0.72;
    }

    cpuNearestSafeX(fromX, preferY) {
      const spec = this.collisionSpec();
      let best = null;
      let bestScore = 1e9;
      spec.floors.concat(spec.platforms).forEach((r) => {
        const b = this.worldBox(r);
        const cx = Phaser.Math.Clamp(fromX, b.left + 28, b.right - 28);
        if (this.cpuKillPitAt(cx, b.top + 10)) return;
        const score = Math.abs(cx - fromX) + Math.abs(b.top - preferY) * 0.25;
        if (score < bestScore) {
          bestScore = score;
          best = cx;
        }
      });
      return best;
    }

    cpuSafeCrossLand(pit, fromX, fromY, dir, vx = DASH) {
      if (!pit) return null;
      const gap = pit.right - pit.left;
      const reach = this.cpuJumpReach(vx);
      if (gap > reach) return null;
      const land = this.cpuLandingPastPit(pit, dir, fromY);
      if (land == null) return null;
      if (Math.abs(land - fromX) > reach) return null;
      return land;
    }

    /** 前方是否有可踩面（壕沟底/台阶），可走过去而不是当杀坑发呆 */
    cpuCanDropOrStep(x, fromY) {
      const surf = this.cpuSurfaceAt(x);
      if (surf == null) return false;
      if (this.cpuKillPitAt(x, surf - 4)) return false;
      return Math.abs(surf - fromY) < 340;
    }

    cpuPitHasFloor(pit, fromY) {
      if (!pit) return false;
      const mid = (pit.left + pit.right) / 2;
      return this.cpuCanDropOrStep(mid, fromY) || this.cpuCanDropOrStep(mid - 40, fromY) || this.cpuCanDropOrStep(mid + 40, fromY);
    }

    cpuHoldNearLedge(d, pit, dir) {
      if (!pit) {
        d.sprite.setVelocityX(0);
        if (d.move !== "idle") d.startMove("idle", { busy: false });
        return;
      }
      const stand = dir > 0 ? pit.left - 64 : pit.right + 64;
      const x = d.sprite.x;
      const tooClose = dir > 0 ? x > pit.left - 44 : x < pit.right + 44;
      if (tooClose) {
        d.sprite.setVelocityX(-dir * WALK);
        if (d.move !== "walk") d.startMove("walk", { busy: false });
        return;
      }
      const dx = stand - x;
      if (Math.abs(dx) < 22) {
        d.sprite.setVelocityX(0);
        if (d.move !== "idle") d.startMove("idle", { busy: false });
        return;
      }
      d.facing = dx < 0 ? -1 : 1;
      d.syncFacingVisual();
      d.sprite.setVelocityX(Math.sign(dx) * WALK);
      if (d.move !== "walk") d.startMove("walk", { busy: false });
    }

    cpuSurfaceAt(x) {
      const spec = this.collisionSpec();
      let best = null;
      spec.floors.concat(spec.platforms).forEach((r) => {
        const b = this.worldBox(r);
        if (x < b.left + 10 || x > b.right - 10) return;
        if (best == null || b.top < best) best = b.top;
      });
      return best;
    }

    cpuPitBetween(x0, x1, feetY) {
      const lo = Math.min(x0, x1);
      const hi = Math.max(x0, x1);
      const spec = this.collisionSpec();
      let hit = null;
      spec.pits.forEach((r) => {
        if (r.kill === "none") return;
        const b = this.worldBox(r);
        if (b.right < lo || b.left > hi) return;
        const mid = (b.left + b.right) / 2;
        if (this.hasWalkable(mid, feetY)) return;
        if (!hit || b.right - b.left > hit.right - hit.left) hit = b;
      });
      return hit;
    }

    cpuBlockingPit(actor, dir, foe = null) {
      const x0 = actor.sprite.x;
      const y = actor.sprite.y;
      for (let step = 28; step <= 280; step += 20) {
        const x = x0 + dir * step;
        if (this.hasWalkable(x, y)) continue;
        // 壕沟/落差：底下有地板就继续追，不当杀坑
        if (this.cpuCanDropOrStep(x, y)) return null;
        const pit =
          this.cpuKillPitAt(x, y + 18) ||
          this.cpuKillPitAt(x, y + 70) ||
          this.cpuKillPitAt(x, y + 120);
        if (pit && !this.cpuPitHasFloor(pit, y)) return pit;
        const between = this.cpuPitBetween(x0, x, y);
        if (between && !this.cpuPitHasFloor(between, y)) return between;
        break;
      }
      const target = foe || (actor === this.p1 ? this.p2 : this.p1);
      if (!target || Math.sign(target.sprite.x - x0) !== dir) return null;
      const spanned = this.cpuPitBetween(x0, target.sprite.x, y);
      if (spanned && this.cpuPitHasFloor(spanned, y)) return null;
      return spanned;
    }

    cpuLandingPastPit(pit, dir, fromY) {
      const start = dir > 0 ? pit.right + 40 : pit.left - 40;
      for (let i = 0; i < 14; i++) {
        const x = start + dir * i * 26;
        if (x < 48 || x > this.worldW - 48) break;
        if (this.cpuKillPitAt(x, fromY + 40)) continue;
        const top = this.cpuSurfaceAt(x);
        if (top != null && Math.abs(top - fromY) < 260) return x;
      }
      return null;
    }

    cpuPlatformToward(actor, target) {
      const ay = actor.sprite.y;
      const ty = target.sprite.y;
      if (ty >= ay - 30) return null;
      const spec = this.collisionSpec();
      const ax = actor.sprite.x;
      const tx = target.sprite.x;
      let best = null;
      let bestScore = 1e9;
      spec.platforms.concat(spec.floors).forEach((r) => {
        const b = this.worldBox(r);
        if (b.top >= ay - 20) return;
        if (ay - b.top > 230) return;
        const cx = Phaser.Math.Clamp(tx, b.left + 28, b.right - 28);
        const score = Math.abs(cx - ax) + Math.abs(b.top - ty) * 0.35;
        if (score < bestScore) {
          bestScore = score;
          best = { x: cx, y: b.top };
        }
      });
      return best;
    }

    supportKind(actor) {
      if (!actor?.grounded()) return "";
      const spec = this.collisionSpec();
      const x = actor.sprite.x;
      const y = actor.sprite.y;
      for (const r of spec.platforms) {
        const b = this.worldBox(r);
        if (x >= b.left && x <= b.right && Math.abs(y - b.top) < 14) return "platform";
      }
      for (const r of spec.floors) {
        const b = this.worldBox(r);
        if (x >= b.left && x <= b.right && Math.abs(y - b.top) < 14) return "floor";
      }
      return "";
    }

    supportY(actor) {
      if (actor?.grounded()) return actor.sprite.y;
      return this.surfaceTop(actor.sprite.x, actor.sprite.y) ?? this.spawnFloorY(actor.sprite.x);
    }

    groundYAt(x) {
      return this.surfaceTop(x, this.scale.height) ?? this.spawnFloorY(x);
    }

    addStaticBox(left, top, right, bottom, { topOnly = false, sidesOnly = false } = {}) {
      const w = Math.max(12, right - left);
      const h = Math.max(12, bottom - top);
      const body = this.add.rectangle((left + right) / 2, top + h / 2, w, h, 0x000000, 0);
      body.setVisible(false);
      this.physics.add.existing(body, true);
      if (body.body) {
        if (topOnly) {
          // 可站立台面：只认顶面，避免受击嵌进厚矩形
          body.body.checkCollision.left = false;
          body.body.checkCollision.right = false;
          body.body.checkCollision.down = false;
          body.body.checkCollision.up = true;
        } else if (sidesOnly) {
          // 崖壁：只挡左右，可从上方穿过落到台面
          body.body.checkCollision.up = false;
          body.body.checkCollision.down = false;
          body.body.checkCollision.left = true;
          body.body.checkCollision.right = true;
        }
      }
      return body;
    }

    clearTerrain() {
      (this.terrainColliders || []).forEach((c) => c.destroy());
      this.terrainColliders = [];
      (this.floorBodies || []).forEach((b) => b.destroy());
      (this.platBodies || []).forEach((b) => b.destroy());
      (this.wallBodies || []).forEach((b) => b.destroy());
      this.floorBodies = [];
      this.platBodies = [];
      this.wallBodies = [];
    }

    buildTerrain() {
      this.clearTerrain();
      const spec = this.collisionSpec();
      const firstFloor = spec.floors[0];
      if (firstFloor) this.groundY = Math.round(firstFloor.y * this.scale.height);
      const minFloorThick = 36;
      const minPlatThick = 28;
      const seamPad = 4;
      // 绿地面：顶面可站；竖直方向一直实心到接近屏幕底。
      // 若只做薄板（~36px），从更低的一侧冲刺时水平穿透 > 垂直重叠，
      // Arcade 会按「最短分离」把人挤上台顶，表现为右→左能刷上高台。
      const floorSolidBottom = this.scale.height - 2;
      spec.floors.forEach((r) => {
        const b = this.worldBox(r);
        const bottom = Math.max(b.bottom, b.top + minFloorThick, floorSolidBottom);
        this.floorBodies.push(this.addStaticBox(b.left - seamPad, b.top, b.right + seamPad, bottom));
      });
      // 蓝高台：只认顶面（可从下方穿过）
      spec.platforms.forEach((r) => {
        const b = this.worldBox(r);
        const bottom = Math.max(b.bottom, b.top + minPlatThick);
        this.platBodies.push(
          this.addStaticBox(b.left - seamPad, b.top, b.right + seamPad, bottom, { topOnly: true })
        );
      });
      const catchY = this.scale.height - 6;
      this.floorBodies.push(this.addStaticBox(0, catchY, this.worldW, catchY + 32, { topOnly: true }));
      this.applyArenaBounds();
    }

    platTop(platform) {
      return platform.y - platform.displayHeight * 0.5;
    }

    /** 实心地面：始终碰撞（牵引穿透除外） */
    floorProcess(player, _floor) {
      const actor = player.getData?.("actor");
      if (!actor || actor.pitFalling) return false;
      if (actor.pullPhaseUntil && this.time.now < actor.pullPhaseUntil) return false;
      return true;
    }

    /** 单向高台：只从上方落脚 */
    platProcess(player, platform) {
      const actor = player.getData?.("actor");
      if (!actor || actor.pitFalling) return false;
      if (actor.pullPhaseUntil && this.time.now < actor.pullPhaseUntil) return false;
      const top = this.platTop(platform);
      const feet = player.body.bottom;
      const vy = player.body.velocity.y;
      if (vy < -40) return false;
      if (feet > top + 28) return false;
      return feet <= top + 18;
    }

    /**
     * 身体若已嵌进绿地面实心区，沿最短路径挤到矩形外
     *（上=站到顶面；左/右=贴侧面；一般不往下挤）
     * 向上挤出只允许「小台阶」高度，避免冲刺侧面撞崖时被刷到更高地面。
     */
    ejectFromTerrain(actor) {
      if (!actor || actor.ko || actor.pitFalling) return;
      if (actor.pullPhaseUntil && this.time.now < actor.pullPhaseUntil) return;
      const spr = actor.sprite;
      const body = spr?.body;
      if (!body) return;
      const pad = 2;
      const maxStepUp = 24;
      let moved = false;

      for (const box of this.floorBodies || []) {
        if (!box?.active || !box.body) continue;
        // 兜底薄板是 topOnly，不当实心墙挤
        if (box.body.checkCollision && box.body.checkCollision.left === false && box.body.checkCollision.right === false) {
          continue;
        }
        const top = box.y - box.displayHeight * 0.5;
        const bottom = box.y + box.displayHeight * 0.5;
        const left = box.x - box.displayWidth * 0.5;
        const right = box.x + box.displayWidth * 0.5;
        const bl = body.left;
        const br = body.right;
        const bt = body.top;
        const bb = body.bottom;
        // 包围盒与实心有实质重叠才处理
        const overlapX = Math.min(br, right) - Math.max(bl, left);
        const overlapY = Math.min(bb, bottom) - Math.max(bt, top);
        if (overlapX <= 1 || overlapY <= 1) continue;
        // 仅脚尖压在顶面（正常站立）→ 不算卡住
        if (bb <= top + 14 && bt < top && overlapY <= 14) continue;

        const pushLeft = br - left + pad; // 向左移这么多
        const pushRight = right - bl + pad;
        const pushUp = bb - top + pad; // 脚抬到顶面
        // 落差过大时只左右挤出（当墙），禁止「最短路径」瞬移上台
        const allowUp = pushUp <= maxStepUp;
        let bestDir = "left";
        let best = pushLeft;
        if (pushRight < best) {
          best = pushRight;
          bestDir = "right";
        }
        if (allowUp && pushUp < best) {
          best = pushUp;
          bestDir = "up";
        }
        if (bestDir === "left") {
          spr.x -= best;
          if (body.velocity.x > 0) spr.setVelocityX(0);
        } else if (bestDir === "right") {
          spr.x += best;
          if (body.velocity.x < 0) spr.setVelocityX(0);
        } else {
          spr.y -= best;
          if (body.velocity.y > 0) spr.setVelocityY(0);
          body.blocked.down = true;
          body.touching.down = true;
        }
        moved = true;
      }

      if (moved) {
        body.blocked.down = body.blocked.down || false;
      }
    }

    wireTerrainColliders() {
      (this.terrainColliders || []).forEach((c) => c.destroy());
      this.terrainColliders = [];
      this.fighters().forEach((a) => {
        (this.floorBodies || []).forEach((b) => {
          this.terrainColliders.push(
            this.physics.add.collider(a.sprite, b, null, (p, floor) => this.floorProcess(p, floor), this)
          );
        });
        (this.platBodies || []).forEach((b) => {
          this.terrainColliders.push(
            this.physics.add.collider(a.sprite, b, null, (p, plat) => this.platProcess(p, plat), this)
          );
        });
      });
    }

    overlapsPit(actor) {
      return false;
    }

    rescueToGround(actor) {
      if (!actor || actor.ko) return;
      const x = Phaser.Math.Clamp(
        actor.spawnX || actor.sprite.x || this.worldW * 0.5,
        64,
        this.worldW - 64
      );
      const y = this.spawnFloorY(x);
      actor.pitFalling = false;
      actor.busy = false;
      actor.stunUntil = 0;
      actor.downedUntil = 0;
      actor.willKnockdown = false;
      if (actor.sprite.body) {
        actor.sprite.body.checkCollision.none = false;
        actor.sprite.setCollideWorldBounds(true);
      }
      actor.sprite.setPosition(x, y);
      actor.sprite.setVelocity(0, 0);
      actor.invulnUntil = Math.max(actor.invulnUntil || 0, this.time.now + 500);
      if (!ATTACKS.has(actor.move) && actor.move !== "super") {
        actor.startMove("idle", { busy: false });
      }
    }

    beginPitFall(actor) {
      this.rescueToGround(actor);
    }

    finishPitFall(actor) {
      this.rescueToGround(actor);
    }

    tickPit(actor) {
      if (!actor || actor.ko) return;
      // 兜底：若仍异常掉到画面外，拉回安全地面（正常情况应被底边/兜底地板拦住）
      if (actor.pitFalling || actor.sprite.y > this.scale.height + 40) {
        this.rescueToGround(actor);
      }
    }

    mountStage(stageId) {
      if (this.stageRoot) this.stageRoot.destroy(true);
      const layout = buildStageLayout(this, stageId, this.pack.stages, this.scale.height);
      this.stageRoot = layout.root;
      this.worldW = layout.worldW;
      this._camZoomWant = 1;
      if (this.cameras?.main) {
        this.cameras.main.setZoom(1);
        this.cameras.main.scrollY = 0;
        this.cameras.main.setBounds(0, 0, this.worldW, this.scale.height);
      }
      this.buildTerrain();
      if (this.p1) this.wireTerrainColliders();
      this._mountedStageId = stageId;
      playStageBgm(this, stageId, this.pack?.stages);
    }

    fighters() {
      return this.p3 ? [this.p1, this.p2, this.p3] : [this.p1, this.p2];
    }

    myActor() {
      if (!this.pvp) return this.p1;
      if (this.seat === "host") return this.p1;
      if (this.seat === "guest2") return this.p3 || this.p2;
      return this.p2;
    }

    padForSeat(seat) {
      if (seat === "host") return this.readLocalPad();
      return this.remotePads[seat] || emptyPad();
    }

    bufForSeat(seat) {
      if (seat === "host") return this.hostBuf;
      if (seat === "guest2") return this.guest2Buf;
      return this.guestBuf;
    }

    faceNearestThreat(actor) {
      // 出招中不改朝向，否则朝左砍时判定会翻到背后
      if (ATTACKS.has(actor.move) && actor.busy) return;
      const foes = this.fighters().filter((f) => f !== actor && !f.ko);
      if (!foes.length) return;
      let best = foes[0];
      let bestD = Math.abs(best.sprite.x - actor.sprite.x);
      for (let i = 1; i < foes.length; i++) {
        const d = Math.abs(foes[i].sprite.x - actor.sprite.x);
        if (d < bestD) {
          best = foes[i];
          bestD = d;
        }
      }
      actor.facing = best.sprite.x >= actor.sprite.x ? 1 : -1;
      actor.syncFacingVisual();
    }

    nearestFoe(from) {
      const foes = this.fighters().filter((f) => f !== from && !f.ko);
      if (!foes.length) return null;
      let best = foes[0];
      let bestD = Math.abs(best.sprite.x - from.sprite.x);
      for (let i = 1; i < foes.length; i++) {
        const d = Math.abs(foes[i].sprite.x - from.sprite.x);
        if (d < bestD) {
          best = foes[i];
          bestD = d;
        }
      }
      return best;
    }

    foeAhead(from, range = 420) {
      const facing = from.facing || 1;
      let best = null;
      let bestD = range + 1;
      for (const foe of this.fighters()) {
        if (foe === from || foe.ko) continue;
        const dx = foe.sprite.x - from.sprite.x;
        if (dx * facing <= 18) continue;
        const d = Math.abs(dx);
        if (d < bestD) {
          best = foe;
          bestD = d;
        }
      }
      return best;
    }

    surfaceUnder(x, fromY) {
      const spec = this.collisionSpec();
      let best = null;
      spec.floors.concat(spec.platforms).forEach((r) => {
        const b = this.worldBox(r);
        if (x < b.left - 6 || x > b.right + 6) return;
        if (b.top < fromY - 10) return;
        if (best == null || b.top < best) best = b.top;
      });
      return best;
    }

    planeYAt(x, refY) {
      return this.surfaceUnder(x, refY) ?? this.surfaceTop(x, refY + 14) ?? this.groundYAt(x);
    }

    isJiangHero(fighter) {
      const id = fighter?.id || "";
      const name = fighter?.displayName || "";
      return id === JIANG_ID || name.includes("蒋介石");
    }

    isIeyasuHero(fighter) {
      const id = fighter?.id || "";
      const name = fighter?.displayName || "";
      return id === IEYASU_ID || name.includes("德川");
    }

    isNewtonHero(fighter) {
      const id = fighter?.id || "";
      const name = fighter?.displayName || "";
      return id === NEWTON_ID || name.includes("牛顿");
    }

    isHawkingHero(fighter) {
      const id = fighter?.id || "";
      const name = fighter?.displayName || "";
      return id === HAWKING_ID || name.includes("霍金");
    }

    isYearZeroHero(fighter) {
      const id = fighter?.id || "";
      const name = fighter?.displayName || "";
      return id === YEAR_ZERO_ID || name.includes("波尔布特");
    }

    isLuBuHero(fighter) {
      const id = fighter?.id || "";
      const name = fighter?.displayName || "";
      return id === LUBU_ID || name.includes("吕布");
    }

    actorBodyDisp(actor) {
      const idleH = Math.max(8, Number(actor?.idleH) || 200);
      const sc = Math.abs(Number(actor?.displayScale || actor?.baseScale) || 1);
      return Math.max(96, idleH * sc);
    }

    projFramePivot(proj, frame = 0) {
      const pivots = proj?._pivots;
      if (Array.isArray(pivots) && pivots.length) {
        const idx = Phaser.Math.Clamp(frame, 0, pivots.length - 1);
        if (pivots[idx]) return pivots[idx];
      }
      return { originX: 0.5, originY: 1, w: 64, h: 64 };
    }

    /** 按扫描到的墨迹脚点把特效钉在地面上（避免透明边距导致悬空） */
    pinProjFeetToGround(sprite, groundY, proj, frame) {
      if (!sprite?.active) return groundY;
      const frameIdx = frame ?? Number(sprite.frame?.name ?? sprite.frame?.index ?? 0);
      const pivot = this.projFramePivot(proj, frameIdx);
      sprite.setOrigin(pivot.originX ?? 0.5, pivot.originY ?? 1);
      sprite.y = groundY;
      return groundY;
    }

    isGroundFrontDown(fighter) {
      const id = fighter?.id || "";
      const name = fighter?.displayName || "";
      return this.isJiangHero(fighter) || id === HITLER_ID || name.includes("希特勒");
    }

    frontGroundPoint(attacker, dist = 230) {
      const facing = attacker.facing || 1;
      const feetY = this.surfaceUnder(attacker.sprite.x, attacker.sprite.y) ?? attacker.sprite.y;
      const pick = (d) => {
        const nx = attacker.sprite.x + facing * d;
        const ny = this.planeYAt(nx, feetY);
        return { x: nx, y: ny, ok: ny != null && Math.abs(ny - feetY) <= 36 };
      };
      let best = pick(dist);
      if (!best.ok) {
        for (let d = dist; d >= 72; d -= 18) {
          const hit = pick(d);
          if (hit.ok) {
            best = hit;
            break;
          }
        }
      }
      if (!best.ok) {
        const fallback = pick(90);
        return { x: fallback.x, y: fallback.y ?? feetY };
      }
      return { x: best.x, y: best.y };
    }

    resolveAllPush() {
      const list = this.fighters();
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          this.resolvePush(list[i], list[j]);
        }
      }
    }

    tryAllHits() {
      const list = this.fighters();
      for (const atk of list) {
        atk.ensureAttackAnimLive?.();
        for (const def of list) {
          if (atk !== def) this.tryHit(atk, def);
        }
      }
    }

    aliveFighters() {
      return this.fighters().filter((f) => !f.ko);
    }

    checkMatchOver() {
      const alive = this.aliveFighters();
      if (this.pvpThree) {
        if (alive.length <= 1) {
          this.beginEndCine();
          return true;
        }
        return false;
      }
      if (this.p1.ko || this.p2.ko) {
        this.beginEndCine();
        return true;
      }
      return false;
    }

    positionPlayerTags() {
      if (this.outcomeTags?.length) {
        this.playerTags?.forEach((t) => t.setAlpha(0));
        if (this.dummyTag) this.dummyTag.setAlpha(0);
        this.positionOutcomeTags();
        return;
      }
      if (this.pvp && this.playerTags?.length) {
        const actors = this.p3 ? [this.p1, this.p2, this.p3] : [this.p1, this.p2];
        actors.forEach((a, i) => {
          if (this.playerTags[i]) this.playerTags[i].setPosition(a.sprite.x, a.sprite.y - 200);
        });
        return;
      }
      if (this.cricket && this.playerTags?.length) {
        [this.p1, this.p2].forEach((a, i) => {
          if (this.playerTags[i]) this.playerTags[i].setPosition(a.sprite.x, a.sprite.y - 200);
        });
        return;
      }
      if (this.dummyTag) this.dummyTag.setPosition(this.p2.sprite.x, this.p2.sprite.y - 200);
    }

    inCountdown() {
      return this.time.now < this.roundAt;
    }

    tickCountdown() {
      if (!this.countText) return;
      if (this.time.now < (this.countAt || 0)) {
        this.countText.setAlpha(0);
        return;
      }
      const left = this.roundAt - this.time.now;
      if (left <= 0) {
        this.countText.setAlpha(0);
        return;
      }
      const label = left > 2800 ? "3" : left > 1800 ? "2" : left > 700 ? "1" : "开战";
      if (label !== this._countLabelPrev) {
        this._countLabelPrev = label;
        if (label === "开战") playUiSfx(this, UI_SFX.countGo, { volume: 0.72 });
        else {
          const detune = label === "3" ? -180 : label === "2" ? 0 : 160;
          playUiSfx(this, UI_SFX.countTick, { volume: 0.62, detune });
        }
        this.countText.setScale(label === "开战" ? 1.35 : 1.55);
        this.tweens.killTweensOf(this.countText);
        this.tweens.add({
          targets: this.countText,
          scale: 1,
          duration: label === "开战" ? 220 : 160,
          ease: "Back.easeOut",
        });
      }
      this.countText.setText(label).setAlpha(1);
    }

    plantAllFrames() {
      this.fighters().forEach((a) => a.plantFrame());
    }

    syncTitle() {
      const title = document.querySelector("header p");
      if (!title) return;
      const a = this.p1.fighter.displayName;
      const b = this.p2.fighter.displayName;
      const map = this.stageName();
      if (this.pvp) {
        const you = seatLabel(this.seat);
        if (this.pvpThree) {
          title.textContent = `${a} / ${b} / ${this.p3.fighter.displayName}（3 人混战 · ${you}）· ${map}`;
        } else {
          title.textContent = `${a} vs ${b}（局域网 ${you}）· ${map}`;
        }
      } else if (this.cricket) title.textContent = `${a} vs ${b}（电子斗蛐蛐）· ${map}`;
      else if (this.pve) title.textContent = `${a} vs ${b}（PVE · ${cpuDiffLabel(this.cpuDiff)}）· ${map}`;
      else title.textContent = this.pack.shareDummy ? `${a} vs ${a}（同人木桩）· ${map}` : `${a} vs ${b} · ${map}`;
    }

    actionCost(move) {
      if (move === "super") return COST.super;
      if (move === "skill" || move === "combo_up" || move === "combo_down") return COST.skill;
      if (move === "attack" || move === "air_attack" || move === "attack_up" || move === "attack_down") {
        return COST.attack;
      }
      return { mp: 0, sp: 0 };
    }

    canSpend(actor, move) {
      const cost = this.actionCost(move);
      if (cost.mp > 0 && actor?.mpBanned) return false;
      if (!this.skillCdReady(actor, move)) return false;
      // HUD 用 round 显示；31.6 会显示成 32，这里留半点容差避免「看着够却判不够」
      return actor.mp + 0.51 >= cost.mp && actor.sp + 0.51 >= cost.sp;
    }

    skillCdMs(move) {
      return MOVE_CD_MS[move] || 0;
    }

    skillCdReady(actor, move) {
      const cd = this.skillCdMs(move);
      if (!(cd > 0) || !actor) return true;
      return Date.now() >= (actor.moveCdUntil?.[move] || 0);
    }

    skillCdLeft(actor, move) {
      const until = actor?.moveCdUntil?.[move] || 0;
      return Math.max(0, until - Date.now());
    }

    /** 上/下+K 缺招时回落到地面技能，避免按键被吃掉。 */
    resolveSkillAnim(actor, preferred) {
      const want = preferred || "skill";
      if (actor?.has?.(want)) return want;
      if (want !== "skill" && actor?.has?.("skill")) return "skill";
      return want;
    }

    spend(actor, move) {
      const cost = this.actionCost(move);
      actor.mp = Math.max(0, actor.mp - cost.mp);
      actor.sp = Math.max(0, actor.sp - cost.sp);
      const cd = this.skillCdMs(move);
      if (cd > 0) {
        actor.moveCdUntil = actor.moveCdUntil || { skill: 0, combo_up: 0, combo_down: 0, super: 0 };
        actor.moveCdUntil[move] = Date.now() + cd;
      }
    }

    regenResources() {
      const dt = Math.min(0.05, this.game.loop.delta / 1000);
      this.fighters().forEach((p) => {
        if (p.ko) return;
        if (p.move === "guard") {
          p.sp = Phaser.Math.Clamp(p.sp + GUARD_SP_REGEN * dt, 0, p.maxSp);
          return;
        }
        let spRegen = 3.2;
        if (p.grounded() && !p.attacking() && p.move !== "dash") spRegen = 7.5;
        p.sp = Phaser.Math.Clamp(p.sp + spRegen * dt, 0, p.maxSp);
        if (p.mpBanned) {
          p.mp = 0;
          return;
        }
        // 全员缓慢回蓝；普攻命中另有 gainMpFromLight。人机与玩家同一套回复，否则技能 CD 形同虚设。
        let mpRegen = 3.2;
        if (this.pve && p === this.p2) mpRegen = this.cpuProfile().mpRegen;
        p.mp = Phaser.Math.Clamp(p.mp + mpRegen * dt, 0, p.maxMp);
      });
    }

    gainMp(actor, amount) {
      if (!actor || actor.ko || !amount || actor.mpBanned) return;
      actor.mp = Phaser.Math.Clamp(actor.mp + amount, 0, actor.maxMp);
    }

    gainMpFromLight(move, attacker, defender, hitAmt, chipAmt) {
      if (!isLightAttack(move)) return;
      this.gainMp(attacker, hitAmt);
      this.gainMp(defender, chipAmt);
    }

    buildHudChrome() {
      const actors = this.pvpThree ? [this.p1, this.p2, this.p3] : [this.p1, this.p2];
      this.hudFaces = actors.map((p) => {
        const sel = `${p.prefix}-select`;
        const idle = `${p.prefix}-idle`;
        const key = this.textures.exists(sel) ? sel : idle;
        const img = this.add.sprite(0, 0, key, 0).setScrollFactor(0).setDepth(21);
        img.setDisplaySize(46, 46);
        return { actor: p, img };
      });
      this.hudCdTexts = actors.map((p) => ({
        actor: p,
        texts: CD_SLOT_ORDER.map((slot) =>
          uiText(this, 0, 0, slot.label, {
            fontSize: 9,
            color: "#f2e6c4",
            stroke: "#1a1008",
            strokeThickness: 3,
          })
            .setScrollFactor(0)
            .setDepth(23)
            .setOrigin(0.5, 0.5)
        ),
      }));
    }

    paintFighterHud(g, originX, y, p, flip, barW, faceSize) {
      const gap = 8;
      const cdH = 15;
      const slotRow = 18;
      const panelH = Math.max(52, faceSize + 6 + slotRow);
      const innerW = barW + faceSize + gap;
      const panelW = innerW + 20;
      let faceX;
      let barX;
      let panelX;
      if (!flip) {
        panelX = originX - 10;
        faceX = originX;
        barX = originX + faceSize + gap;
      } else {
        panelX = originX - 10;
        barX = originX;
        faceX = originX + barW + gap;
      }
      paintValleyPanel(g, panelX, y - 8, panelW, panelH, {
        selected: true,
        radius: 10,
        inset: 4,
        accent: 0xd4b06a,
      });
      const bar = (x, by, hp, max, barFlip, bw, color, h = 12) => {
        const ratio = max > 0 ? Phaser.Math.Clamp(hp / max, 0, 1) : 0;
        const fill = Math.max(0, ratio * bw);
        g.fillStyle(0x2a1c12, 0.92);
        g.fillRect(x, by, bw, h);
        g.fillStyle(color, 1);
        if (barFlip) g.fillRect(x + (bw - fill), by, fill, h);
        else g.fillRect(x, by, fill, h);
        g.lineStyle(1, 0xf2d090, 0.85);
        g.strokeRect(x, by, bw, h);
      };
      const hpColor = p.infinite ? 0xd4a017 : p.hp > HP_PER_BAR * 2 ? 0xd4a017 : p.hp > HP_PER_BAR ? 0xd4862a : 0xc4473a;
      const hp = p.infinite ? p.maxHp : p.hp;
      bar(barX, y, hp, p.maxHp, flip, barW, hpColor, 10);
      bar(barX, y + 14, p.mp, p.maxMp, flip, barW, p.mpBanned ? 0x4a4a55 : 0x4b8dff, 8);
      bar(barX, y + 26, p.sp, p.maxSp, flip, barW, 0x58c77d, 8);
      g.fillStyle(0x1a120c, 0.95);
      g.fillRect(faceX - 1, y - 1, faceSize + 2, faceSize + 2);
      g.lineStyle(1, 0xf2d090, 0.9);
      g.strokeRect(faceX - 1, y - 1, faceSize + 2, faceSize + 2);
      const faceRec = this.hudFaces?.find((f) => f.actor === p);
      if (faceRec?.img) {
        faceRec.img.setVisible(true).setDisplaySize(faceSize, faceSize).setPosition(faceX + faceSize / 2, y + faceSize / 2);
      }
      const cdY = y + faceSize + 4;
      const boxW = Math.max(8, (faceSize - 3) / 4);
      const rec = this.hudCdTexts?.find((t) => t.actor === p);
      CD_SLOT_ORDER.forEach((slot, i) => {
        const bx = faceX + i * (boxW + 1);
        const has = !!p.has?.(slot.move);
        const left = this.skillCdLeft(p, slot.move);
        const total = Math.max(1, this.skillCdMs(slot.move));
        g.fillStyle(0x1c140c, 0.95);
        g.fillRect(bx, cdY, boxW, cdH);
        if (has) {
          const ready = Phaser.Math.Clamp(1 - left / total, 0, 1);
          g.fillStyle(slot.color, left <= 0 ? 1 : 0.38);
          g.fillRect(bx, cdY + cdH * (1 - ready), boxW, cdH * ready);
        }
        g.lineStyle(1, has && left <= 0 ? 0xf2d090 : 0x6a5a40, 0.85);
        g.strokeRect(bx, cdY, boxW, cdH);
        const txt = rec?.texts?.[i];
        if (txt) {
          txt.setVisible(true).setPosition(bx + boxW / 2, cdY + cdH / 2);
          txt.setAlpha(has ? (left <= 0 ? 1 : 0.5) : 0.22);
        }
      });
    }

    drawHp() {
      const g = this.hpGfx;
      const w = this.scale.width;
      g.clear();
      const mark = (p) =>
        p.ailment === "burn" && this.time.now < p.ailmentUntil
          ? "·燃"
          : p.ailment === "freeze" && this.time.now < p.ailmentUntil
            ? "·冻"
            : p.ailment === "poison" && this.time.now < p.ailmentUntil
              ? "·毒"
              : "";
      const info = (p) => {
        const hpBit = p.infinite ? "HP ∞" : `HP ${Math.round(p.hp)}/${p.maxHp}`;
        const mpBit = p.mpBanned ? "MP BAN" : `MP ${Math.round(p.mp)}`;
        return `${hpBit}  ${mpBit}  SP ${Math.round(p.sp)}`;
      };
      const face = this.pvpThree ? 40 : 46;
      if (this.pvpThree) {
        const bw = Math.min(300, Math.floor((w - 80) / 3) - 52);
        const gap = 18;
        const slotW = bw + face + 8;
        const total = slotW * 3 + gap * 2;
        let x = Math.floor((w - total) / 2);
        [this.p1, this.p2, this.p3].forEach((p) => {
          this.paintFighterHud(g, x, 12, p, false, bw, face);
          x += slotW + gap;
        });
        const seatTag = (p) => {
          if (p === this.p1) return this.seat === "host" ? "我" : "主机";
          if (p === this.p2) return this.seat === "guest" ? "我" : "客人1";
          return this.seat === "guest2" ? "我" : "客人2";
        };
        this.hud.setY(92);
        this.hud.setText(
          [this.p1, this.p2, this.p3]
            .map((p) => `${p.fighter.displayName}${mark(p)} ${seatTag(p)} ${info(p)}`)
            .join("    ")
        );
        return;
      }
      const barW = 360;
      this.paintFighterHud(g, 16, 12, this.p1, false, barW, face);
      const rightInner = barW + face + 8;
      this.paintFighterHud(g, w - 16 - rightInner, 12, this.p2, true, barW, face);
      const foe = this.pvp ? "P2" : this.pve ? "CPU" : this.cricket ? "人机" : "木桩";
      this.hud.setY(92);
      this.hud.setText(
        this.cricket
          ? `${this.p1.fighter.displayName}${mark(this.p1)}  甲 ${info(this.p1)}     ${this.p2.fighter.displayName}${mark(this.p2)}  乙 ${info(this.p2)}`
          : `${this.p1.fighter.displayName}${mark(this.p1)}  ${info(this.p1)}     ${this.p2.fighter.displayName}${mark(this.p2)}  ${foe} ${info(this.p2)}`
      );
    }

    resolvePush(a, b) {
      const ab = a.sprite.body;
      const bb = b.sprite.body;
      if (!ab || !bb) return;
      if (a.phasing() || b.phasing()) return;
      if (a.airborne() || b.airborne()) return;
      if (a.reacting() || b.reacting()) return;
      if (ab.bottom <= bb.top + 10 || bb.bottom <= ab.top + 10) return;
      const need = ab.halfWidth + bb.halfWidth + 2;
      const dx = bb.center.x - ab.center.x;
      const dist = Math.abs(dx);
      if (dist >= need || dist < 0.001) return;
      const overlap = need - dist;
      const sign = dx < 0 ? -1 : 1;
      const aPush = Math.abs(ab.velocity.x) > 50 && Math.sign(ab.velocity.x) === sign;
      const bPush = Math.abs(bb.velocity.x) > 50 && Math.sign(bb.velocity.x) === -sign;
      if (aPush && !bPush) {
        b.sprite.x += sign * overlap;
      } else if (bPush && !aPush) {
        a.sprite.x -= sign * overlap;
      } else {
        a.sprite.x -= sign * overlap * 0.5;
        b.sprite.x += sign * overlap * 0.5;
      }
    }

    canGuard(actor) {
      return Boolean(actor && !actor.ko && actor.grounded() && actor.has("guard"));
    }

    isGuarding(actor) {
      return actor?.move === "guard" && actor.grounded();
    }

    applyBlockedHit(target, attacker, move, rawDmg) {
      const taken = Math.max(1, Math.round((rawDmg || moveDamage(move)) * GUARD_DAMAGE));
      if (!target.infinite) target.hp = Math.max(0, target.hp - taken);
      this.gainMpFromLight(move, attacker, target, 5, 4);
      if (target.hp <= 0 && !target.infinite) {
        target.hp = 0;
        target.ko = true;
        target.startMove("defeat_cg", { voice: "defeat", busy: true });
        this.noteKo(target);
      }
    }

    impactAt(x, y, kind = "light") {
      if (kind) playHitSfx(this, kind);
      const flash = this.add.circle(x, y, 14, 0xfff1c2, 0.92).setDepth(8);
      this.tweens.add({
        targets: flash,
        scale: 2.1,
        alpha: 0,
        duration: 90,
        onComplete: () => flash.destroy(),
      });
    }

    /** 飘字回血提示（吸血等） */
    floatHeal(actor, amount) {
      if (!actor?.sprite || !(amount > 0)) return;
      const t = this.add
        .text(actor.sprite.x, actor.sprite.y - 110, `+${Math.round(amount)}`, {
          fontFamily: UI_FONT,
          fontSize: "28px",
          color: "#7dff9a",
          stroke: "#0a1a0c",
          strokeThickness: 5,
        })
        .setOrigin(0.5, 1)
        .setDepth(24);
      this.tweens.add({
        targets: t,
        y: t.y - 48,
        alpha: 0,
        duration: 700,
        ease: "Cubic.Out",
        onComplete: () => t.destroy(),
      });
    }

    /** 时停爆发等：飘字伤害 */
    floatDamage(actor, amount, opts) {
      if (!actor?.sprite || !(amount > 0)) return;
      const jx = (opts?.jx || 0) + Phaser.Math.Between(-18, 18);
      const jy = (opts?.jy || 0) + Phaser.Math.Between(-8, 8);
      const big = Boolean(opts?.big);
      const t = this.add
        .text(actor.sprite.x + jx, actor.sprite.y - 88 + jy, `${Math.round(amount)}`, {
          fontFamily: UI_FONT,
          fontSize: big ? "36px" : "26px",
          color: big ? "#ffe08a" : "#ffb4a0",
          stroke: "#2a0a08",
          strokeThickness: big ? 6 : 5,
        })
        .setOrigin(0.5, 1)
        .setDepth(24);
      this.tweens.add({
        targets: t,
        y: t.y - (big ? 64 : 44),
        alpha: 0,
        scale: big ? 1.15 : 1.05,
        duration: big ? 820 : 620,
        ease: "Cubic.Out",
        onComplete: () => t.destroy(),
      });
    }

    tryBreakout(p) {
      if (!p || p.ko) return false;
      const now = this.time.now;
      const cc =
        p.downed() ||
        p.willKnockdown ||
        p.airFalling ||
        p.frozen() ||
        p.immobilized() ||
        (p.stunUntil && p.stunUntil > now) ||
        p.comboLocked() ||
        (p.busy && FALL.has(p.move));
      if (!cc) return false;
      if (now < (p.breakoutAt || 0)) return false;
      if (p.sp < BREAKOUT_SP) return false;
      p.sp = Math.max(0, p.sp - BREAKOUT_SP);
      p.stunUntil = 0;
      p.rootedUntil = 0;
      p.downedUntil = 0;
      p.willKnockdown = false;
      p.airFalling = false;
      p.comboDmg = 0;
      p.comboUntil = 0;
      p.busy = false;
      p.clearAilment();
      p.invulnUntil = now + GET_UP_INVULN_MS;
      p.breakoutAt = now + BREAKOUT_CD;
      p.sprite.setTintFill(0xfff6c8);
      this.time.delayedCall(90, () => {
        p.sprite.clearTint();
        if (p.tint !== 0xffffff) p.sprite.setTint(p.tint);
      });
      p.startMove(p.has("dash") && !this.domainDashLocked(p) ? "dash" : "idle", { busy: false });
      p.sprite.setVelocity(-p.facing * 320, -160);
      return true;
    }

    /** 受击/连招锁中冲刺：清硬直并刷无敌帧脱战 */
    tryDashEscape(p, left, right) {
      if (!p || p.ko || !p.has("dash")) return false;
      if (this.domainDashLocked(p)) return false;
      const now = this.time.now;
      const locked =
        p.comboLocked() ||
        (p.stunUntil && p.stunUntil > now) ||
        (p.busy && FALL.has(p.move)) ||
        p.immobilized();
      if (!locked) return false;
      if (p.willKnockdown || p.airFalling || p.downed()) return false;
      if (p.sp < DASH_ESCAPE_SP) return false;
      p.sp = Math.max(0, p.sp - DASH_ESCAPE_SP);
      p.stunUntil = 0;
      p.rootedUntil = 0;
      p.comboDmg = 0;
      p.comboUntil = 0;
      p.busy = false;
      p.clearAilment();
      p.invulnUntil = Math.max(p.invulnUntil || 0, now + DASH_ESCAPE_IFRAMES_MS);
      let dir = p.facing || 1;
      if (left && !right) dir = -1;
      else if (right && !left) dir = 1;
      else dir = -p.facing;
      p.facing = dir;
      p.syncFacingVisual();
      p.startMove("dash", { busy: false });
      p.sprite.setVelocity(dir * DASH, -90);
      p.sprite.setTintFill(0xd8f0ff);
      this.time.delayedCall(90, () => {
        p.sprite.clearTint();
        if (p.tint !== 0xffffff) p.sprite.setTint(p.tint);
      });
      return true;
    }

    /** 打断奥义：结束特写并清除该角色奥义弹道 */
    interruptActorSuper(actor) {
      if (!actor) return;
      actor.domainNoDashUntil = 0;
      if (actor.luBuSuperHidden) {
        actor.luBuSuperHidden = false;
        actor.luBuChargePending = 0;
        actor.sprite?.setVisible(true);
      }
      if (this.cutinActive && this._cutinActor === actor) {
        this.endSuperCutin(actor);
      }
      const keep = [];
      for (const shot of this.projectiles || []) {
        if (shot?.owner === actor && shot.move === "super") {
          this.destroyShot(shot);
          continue;
        }
        keep.push(shot);
      }
      this.projectiles = keep;
    }

    /** 去城市化等领域：期间无法冲刺 */
    domainDashLocked(p) {
      if (!p || p.ko) return false;
      if (this.time.now < (p.domainNoDashUntil || 0)) return true;
      return (this.projectiles || []).some(
        (s) => s?.domainField && s.owner === p && s.sprite?.active
      );
    }

    /** 领域展开中（普攻吸血窗口） */
    domainAuraActive(actor) {
      if (!actor || actor.ko) return false;
      if (this.time.now < (actor.domainNoDashUntil || 0)) return true;
      return (this.projectiles || []).some(
        (s) => s?.domainField && s.owner === actor && s.sprite?.active
      );
    }

    applyDomainLightLifesteal(attacker, defender, dealt) {
      if (!this.domainAuraActive(attacker) || !(dealt > 0)) return;
      const heal = Math.max(1, Math.round(dealt * 0.6));
      if (!attacker.infinite) {
        attacker.hp = Math.min(attacker.maxHp, attacker.hp + heal);
      }
      this.floatHeal(attacker, heal);
    }

    /** 领域内敌人：蓝条清空并锁定 */
    refreshDomainMpBan() {
      const banned = new Set();
      for (const shot of this.projectiles || []) {
        if (!shot?.domainField || !shot.sprite?.active) continue;
        const box = this.projectileHitBox(shot);
        for (const target of this.fighters()) {
          if (!target || target === shot.owner || target.ko) continue;
          const hurt = target.worldHurt();
          Phaser.Geom.Rectangle.Inflate(hurt, 12, 10);
          if (!Phaser.Geom.Rectangle.Overlaps(box, hurt)) continue;
          banned.add(target);
          target.mp = 0;
        }
      }
      this.fighters().forEach((p) => {
        p.mpBanned = banned.has(p);
        if (p.mpBanned) p.mp = 0;
      });
    }

    /** 霍金时间凝滞：钉死坐标 */
    tickTimeLocks() {
      const now = this.time.now;
      this.fighters().forEach((p) => {
        if (!p || p.ko) return;
        if (!(p.timeLockBanking && now < (p.timeLockUntil || 0))) return;
        p.sprite.x = p.timeLockX;
        p.sprite.y = p.timeLockY;
        p.sprite.setVelocity(0, 0);
        p.rootedUntil = Math.max(p.rootedUntil || 0, p.timeLockUntil);
        p.stunUntil = 0;
        p.willKnockdown = false;
        p.airFalling = false;
      });
    }

    updateCamera() {
      if (this.cutinActive) return;
      const cam = this.cameras.main;
      const w = this.scale.width;
      const h = this.scale.height;
      const worldW = this.worldW || w;
      const follow = this.cine || this.over ? this.fighters() : this.aliveFighters();
      const xs = (follow.length ? follow : this.fighters()).map((a) => a.sprite.x);
      if (!xs.length) return;
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const mid = (minX + maxX) / 2;
      const span = maxX - minX;

      if (!this.cricket) {
        if (Math.abs(cam.zoom - 1) > 0.001) cam.setZoom(1);
        cam.scrollY = 0;
        this._camZoomWant = 1;
      } else {
        // 地图本身按高度铺满；这里只是镜头变焦。用滞回避免两人距离轻微变化就抖缩放
        const raw = Phaser.Math.Clamp(w / Math.max(1100, span + 640), 0.84, 1);
        if (!Number.isFinite(this._camZoomWant)) this._camZoomWant = 1;
        if (raw < this._camZoomWant - 0.045) this._camZoomWant = raw;
        else if (raw > this._camZoomWant + 0.07) this._camZoomWant = Math.min(1, raw);
        cam.setZoom(Phaser.Math.Linear(cam.zoom, this._camZoomWant, 0.045));
        if (Math.abs(cam.scrollY) > 0.5) cam.scrollY = Phaser.Math.Linear(cam.scrollY, 0, 0.2);
        else cam.scrollY = 0;
      }

      cam.setBounds(0, 0, worldW, h);
      const viewW = w / Math.max(0.5, cam.zoom);
      const want = Phaser.Math.Clamp(mid - viewW / 2, 0, Math.max(0, worldW - viewW));
      cam.scrollX = Phaser.Math.Linear(cam.scrollX, want, this.cricket ? 0.08 : 0.14);
    }

    noteKo(actor) {
      if (actor) this.lastKo = actor;
    }

    matchWinnersLosers() {
      const list = this.fighters();
      const winners = list.filter((f) => !f.ko);
      const losers = list.filter((f) => f.ko);
      return { winners, losers };
    }

    lockCamOn(actor, zoom, lerp) {
      if (!actor) {
        this.camLock = null;
        return;
      }
      this.camLock = { actor, zoom: zoom || 1.52, lerp: lerp || 0.16 };
    }

    superMoveName(actor) {
      const id = actor?.fighter?.id || this.pack?.[`${actor?.prefix}Id`];
      if (id && SUPER_TITLES[id]) return SUPER_TITLES[id];
      const kit = actor?.fighter?.kit?.super;
      if (kit && String(kit).length < 14) return kit;
      return actor?.fighter?.moves?.super?.label || kit || "奥义";
    }

    buildCurtains() {
      const w = this.scale.width;
      const h = this.scale.height;
      this.curtainTop = this.add
        .rectangle(w / 2, h / 2, w + 12, h + 8, 0x050506, 1)
        .setOrigin(0.5, 1)
        .setScrollFactor(0)
        .setDepth(50);
      this.curtainBot = this.add
        .rectangle(w / 2, h / 2, w + 12, h + 8, 0x050506, 1)
        .setOrigin(0.5, 0)
        .setScrollFactor(0)
        .setDepth(50);
    }

    curtainPair() {
      return [this.curtainTop, this.curtainBot].filter(Boolean);
    }

    onCurtainsOpened() {
      if (this._countdownArmed) return;
      this._countdownArmed = true;
      this._countLabelPrev = "";
      this.countAt = this.time.now + 220;
      this.roundAt = this.countAt + (this.countMs || 0);
    }

    openCurtains(ms) {
      const h = this.scale.height;
      const dur = ms || 1800;
      this.tweens.killTweensOf(this.curtainPair());
      this._openHold?.remove(false);
      this._countdownArmed = false;
      this.countAt = Number.MAX_SAFE_INTEGER;
      this.roundAt = Number.MAX_SAFE_INTEGER;
      this.curtainTop?.setY(h / 2);
      this.curtainBot?.setY(h / 2);
      this.tweens.add({
        targets: this.curtainTop,
        y: -4,
        duration: dur,
        ease: "Sine.easeInOut",
      });
      this.tweens.add({
        targets: this.curtainBot,
        y: h + 4,
        duration: dur,
        ease: "Sine.easeInOut",
      });
      // 用定时器武装倒计时，不依赖 tween onComplete（避免偶发不触发）
      this._openHold = this.time.delayedCall(dur + 60, () => this.onCurtainsOpened());
    }

    closeCurtains(ms, onDone) {
      const h = this.scale.height;
      const dur = ms || 1700;
      this.tweens.killTweensOf(this.curtainPair());
      this._openHold?.remove(false);
      this.tweens.add({
        targets: this.curtainTop,
        y: h / 2,
        duration: dur,
        ease: "Sine.easeInOut",
      });
      this.tweens.add({
        targets: this.curtainBot,
        y: h / 2,
        duration: dur,
        ease: "Sine.easeInOut",
        onComplete: onDone,
      });
    }

    spawnOutcomeTags(winners, losers) {
      this.clearOutcomeTags();
      const style = {
        fontFamily: UI_FONT,
        fontSize: 22,
        stroke: "#000",
        strokeThickness: 6,
      };
      winners.forEach((actor) => {
        const text = crispUi(
          this.add.text(actor.sprite.x, actor.sprite.y - 236, "胜者", { ...style, fontSize: 26, color: "#f2d36b" }).setOrigin(0.5, 1).setDepth(28)
        );
        this.outcomeTags.push({ text, actor });
      });
      losers.forEach((actor) => {
        const text = crispUi(
          this.add.text(actor.sprite.x, actor.sprite.y - 236, "败者", { ...style, fontSize: 26, color: "#d8d8d8" }).setOrigin(0.5, 1).setDepth(28)
        );
        this.outcomeTags.push({ text, actor });
      });
    }

    positionOutcomeTags() {
      this.outcomeTags?.forEach(({ text, actor }) => {
        if (!text || !actor?.sprite) return;
        text.setPosition(actor.sprite.x, actor.sprite.y - 236);
      });
    }

    clearOutcomeTags() {
      this.outcomeTags?.forEach(({ text }) => text?.destroy());
      this.outcomeTags = [];
    }

    beginSuperCutin(actor) {
      if (!actor || this.cutinActive || this.over || this.cine) return;
      const superKey = `${actor.prefix}-super`;
      const idleKey = `${actor.prefix}-idle`;
      const key = this.textures.exists(superKey) ? superKey : idleKey;
      this.cutinActive = true;
      this.hitstop = true;
      this.physics.world.pause();
      this.camLock = null;
      const cam = this.cameras.main;
      this._cutinSavedZoom = cam.zoom;
      cam.setZoom(1);
      cam.scrollY = 0;
      this.cutinPaused = this.fighters().filter((f) => {
        if (f.sprite.anims.isPlaying) {
          f.sprite.anims.pause();
          return true;
        }
        return f === actor;
      });
      actor.sprite.anims.pause();
      this._cutinHide = this.fighters().filter((f) => f?.sprite?.visible);
      this._cutinHide.forEach((f) => f.sprite.setVisible(false));
      if (this.isLuBuHero(actor.fighter)) {
        actor.luBuSuperHidden = true;
        actor.luBuChargePending = 0;
      }
      this.fighters().forEach((f) => f?.clearGhost?.());
      this.clearSuperCutinFx();

      const w = this.scale.width;
      const h = this.scale.height;
      const faceRight = (actor.facing || 1) >= 0;
      const charX = faceRight ? w * 0.2 : w * 0.8;
      const barH = Math.round(h * 0.26);
      const midH = h - barH * 2;
      const fx = this.add.container(0, 0).setDepth(90).setScrollFactor(0);
      const shake = (amp = 10, ms = 100) => cam.shake(ms, amp / 800);

      // 中间压暗更深 + 暗红罩，仍透地图
      const midDim = this.add
        .rectangle(w / 2, h / 2, w + 48, midH + 8, 0x0a0608, 0)
        .setScrollFactor(0);
      const midRed = this.add
        .rectangle(w / 2, h / 2, w + 48, midH + 8, 0x5a1010, 0)
        .setScrollFactor(0)
        .setBlendMode(Phaser.BlendModes.ADD);
      fx.add(midDim);
      fx.add(midRed);

      const barTop = this.add
        .rectangle(w / 2, -barH - 20, w + 48, barH + 4, 0x050506, 1)
        .setOrigin(0.5, 0)
        .setScrollFactor(0);
      const barBot = this.add
        .rectangle(w / 2, h + barH + 20, w + 48, barH + 4, 0x050506, 1)
        .setOrigin(0.5, 1)
        .setScrollFactor(0);
      fx.add(barTop);
      fx.add(barBot);
      this._cutinBars = { top: barTop, bot: barBot, h: barH };

      bakeCutinBurst(this);
      const burst = this.add
        .image(w / 2, h / 2, "ui-cutin-burst")
        .setDisplaySize(Math.max(w, h) * 1.15, Math.max(w, h) * 1.15)
        .setAlpha(0)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setScrollFactor(0);
      fx.add(burst);

      let portrait = null;
      let baseScale = 1;
      if (this.textures.exists(key)) {
        const spec = (key === superKey ? actor.fighter?.sprites?.super : actor.fighter?.sprites?.idle) || {};
        const fw = Math.max(8, spec.frameWidth || 280);
        const fh = Math.max(8, spec.frameHeight || 672);
        const startX = faceRight ? -w * 0.35 : w * 1.35;
        portrait = this.add.sprite(startX, h * 0.5, key, 0).setScrollFactor(0);
        portrait.setFlipX(!faceRight);
        portrait.setOrigin(0.5, 0.52);
        // 身形放大到当前约 2 倍（可大幅侵入黑边）
        baseScale = Math.min((w * 0.72) / fw, (midH * 1.38) / fh) * 2;
        portrait.setScale(baseScale * 0.92);
        // 慢放：看清每一帧动作（repeat:0 会停在末帧）
        if (this.anims.exists(key)) portrait.anims.play({ key, frameRate: 4, repeat: 0 });
        portrait.setAlpha(0);
        fx.add(portrait);
      }

      const moveName = this.superMoveName(actor);
      const tag = makeSekiroBrushKanji(this, "奥义", 118, {
        rot: faceRight ? -0.06 : 0.06,
        fill: "#7a1616",
        hot: "#b42222",
        tracking: 58,
      });
      tag.setPosition(w / 2, h * 0.38);
      tag.setScale(2.05);
      tag.setAlpha(0);

      const nameSize = moveName.length >= 6 ? 44 : moveName.length >= 4 ? 54 : 64;
      const nameTrack = moveName.length >= 6 ? 22 : moveName.length >= 4 ? 28 : 34;
      const name = makeSekiroBrushKanji(this, moveName, nameSize, {
        rot: faceRight ? -0.04 : 0.04,
        fill: "#6e1414",
        hot: "#a81e1e",
        tracking: nameTrack,
      });
      name.setPosition(w / 2, h * 0.58);
      name.setScale(1.7);
      name.setAlpha(0);

      const flash = this.add.rectangle(w / 2, h / 2, w + 48, midH, 0xfff4d8, 0).setScrollFactor(0);
      const flashRed = this.add.rectangle(w / 2, h / 2, w + 48, midH, 0xff3030, 0).setScrollFactor(0);
      fx.add(tag);
      fx.add(name);
      fx.add(flash);
      fx.add(flashRed);
      this.cutinFx = fx;

      // ① 瞬间压暗 + 暗红脉冲
      this.tweens.add({ targets: midDim, alpha: 0.42, duration: 40, ease: "Quad.easeOut" });
      this.tweens.add({
        targets: midRed,
        alpha: 0.22,
        duration: 40,
        yoyo: true,
        hold: 40,
        ease: "Quad.easeOut",
      });
      shake(8, 60);

      // ② 黑边狠砸（过冲再咬合）
      this.tweens.add({
        targets: barTop,
        y: 8,
        duration: 85,
        delay: 30,
        ease: "Cubic.easeIn",
        onComplete: () => {
          shake(16, 90);
          this.tweens.add({ targets: barTop, y: 0, duration: 55, ease: "Back.easeOut" });
        },
      });
      this.tweens.add({
        targets: barBot,
        y: h - 8,
        duration: 85,
        delay: 30,
        ease: "Cubic.easeIn",
        onComplete: () => {
          this.tweens.add({ targets: barBot, y: h, duration: 55, ease: "Back.easeOut" });
        },
      });

      // ③ 人物暴冲入场（稍慢，配合慢放动作）
      if (portrait) {
        const overshoot = faceRight ? charX + 48 : charX - 48;
        this.tweens.add({
          targets: portrait,
          alpha: 1,
          x: overshoot,
          scaleX: baseScale * 1.08,
          scaleY: baseScale * 1.08,
          duration: 180,
          delay: 70,
          ease: "Cubic.easeOut",
          onComplete: () => {
            shake(14, 75);
            flashRed.setAlpha(0.35);
            this.tweens.add({ targets: flashRed, alpha: 0, duration: 120, ease: "Quad.easeOut" });
            this.tweens.add({
              targets: portrait,
              x: charX,
              scaleX: baseScale,
              scaleY: baseScale,
              duration: 90,
              ease: "Back.easeOut",
            });
          },
        });
      }

      // ④「奥义」重砸 + 冲击波
      this.tweens.add({
        targets: tag,
        alpha: 1,
        scale: 0.96,
        duration: 110,
        delay: 280,
        ease: "Back.easeOut",
        onStart: () => {
          flash.setAlpha(0.75);
          burst.setAlpha(0.85);
          shake(20, 110);
        },
      });
      this.tweens.add({
        targets: tag,
        scale: 1.04,
        duration: 70,
        delay: 340,
        yoyo: true,
        ease: "Sine.easeInOut",
      });
      this.tweens.add({
        targets: flash,
        alpha: 0,
        duration: 180,
        delay: 280,
        ease: "Quad.easeOut",
      });
      this.tweens.add({
        targets: burst,
        alpha: 0,
        scaleX: burst.scaleX * 1.35,
        scaleY: burst.scaleY * 1.35,
        duration: 280,
        delay: 280,
        ease: "Cubic.easeOut",
      });

      // ⑤ 招名跟上再震一下
      this.tweens.add({
        targets: name,
        alpha: 1,
        scale: 1,
        duration: 120,
        delay: 420,
        ease: "Back.easeOut",
        onStart: () => shake(10, 70),
      });

      // ⑥ 硬停拉长，让慢放动作看完再撤
      this._cutinActor = actor;
      this._cutinStartedAt = this.time.now;
      this._cutinEndEvent?.remove(false);
      this._cutinEndEvent = this.time.delayedCall(2200, () => this.endSuperCutin(actor));
    }

    clearSuperCutinFx() {
      this._cutinBars = null;
      if (this.cutinFx) {
        this.cutinFx.destroy(true);
        this.cutinFx = null;
      }
    }

    endSuperCutin(actor) {
      if (!this.cutinActive && !this.cutinFx) return;
      this._cutinEndEvent?.remove(false);
      this._cutinEndEvent = null;
      const restoreCam = () => {
        if (Number.isFinite(this._cutinSavedZoom)) {
          this.cameras.main.setZoom(this._cutinSavedZoom);
          this._cutinSavedZoom = null;
        }
        (this._cutinHide || []).forEach((f) => {
          if (f?.luBuSuperHidden && (f.luBuChargePending || 0) > 0) return;
          if (f?.luBuSuperHidden) f.luBuSuperHidden = false;
          f?.sprite?.setVisible(true);
        });
        this._cutinHide = null;
      };
      this.fighters().forEach((f) => f?.clearGhost?.());
      if (this.cine || this.over || this.resultShown) {
        this.clearSuperCutinFx();
        this.cutinActive = false;
        this.hitstop = false;
        this.cutinPaused = null;
        this._cutinActor = null;
        restoreCam();
        return;
      }
      const resume = () => {
        this.cutinActive = false;
        this.hitstop = false;
        this.camLock = null;
        this._cutinActor = null;
        restoreCam();
        if (this.physics.world.isPaused) this.physics.world.resume();
        (this.cutinPaused || []).forEach((f) => {
          if (f?.sprite?.anims?.isPaused && ATTACKS.has(f.move)) f.sprite.anims.resume();
          else if (f?.sprite?.anims?.isPaused && LOOP.has(f.move)) f.sprite.anims.resume();
        });
        if (actor?.move === "super" && actor.sprite.anims.isPaused) actor.sprite.anims.resume();
        this.cutinPaused = null;
        // 特写期间禁出弹；结束后立刻补一次，避免跳过 spawnFrame 导致大招粒子消失
        if (actor?.move === "super" && !actor.projSpawned) {
          actor.maybeSpawnProjectile();
          // 若仍卡在 spawnFrame 之前，强制按大招出弹
          if (!actor.projSpawned) {
            const spec = moveSpec(actor.fighter, "super");
            if (spec?.projectile?.file) {
              actor.projSpawned = true;
              this.spawnProjectile(actor, "super", spec);
            }
          }
        }
      };

      const bars = this._cutinBars;
      const h = this.scale.height;
      if (this.cutinFx && bars?.top && bars?.bot) {
        // 黑边撤回后再淡出
        this.tweens.add({
          targets: bars.top,
          y: -bars.h,
          duration: 140,
          ease: "Cubic.easeIn",
        });
        this.tweens.add({
          targets: bars.bot,
          y: h + bars.h,
          duration: 140,
          ease: "Cubic.easeIn",
        });
        this.tweens.add({
          targets: this.cutinFx,
          alpha: 0,
          duration: 120,
          delay: 100,
          onComplete: () => {
            this.clearSuperCutinFx();
            resume();
          },
        });
      } else if (this.cutinFx) {
        this.tweens.add({
          targets: this.cutinFx,
          alpha: 0,
          duration: 140,
          onComplete: () => {
            this.clearSuperCutinFx();
            resume();
          },
        });
      } else resume();
    }

    beginEndCine() {
      if (this.cine || this.resultShown) return;
      this.over = true;
      this.camLock = null;
      this.cine = { phase: "clearFx", startedAt: this.time.now, closing: false };
      if (this.cutinActive) {
        this.clearSuperCutinFx();
        this.cutinActive = false;
        this.hitstop = false;
        (this._cutinHide || []).forEach((f) => {
          if (f?.luBuSuperHidden) f.luBuSuperHidden = false;
          f?.sprite?.setVisible(true);
        });
        this._cutinHide = null;
        if (Number.isFinite(this._cutinSavedZoom)) {
          this.cameras.main.setZoom(this._cutinSavedZoom);
          this._cutinSavedZoom = null;
        }
      }
      this.physics.world.pause();
      this.fighters().forEach((a) => {
        a.sprite.setVelocity(0, 0);
        if (a.sprite.anims?.isPlaying) a.sprite.anims.pause();
      });
      this.fadeCombatFx(() => this.beginEndPoses());
    }

    combatFxTargets() {
      const targets = [];
      (this.projectiles || []).forEach((shot) => {
        if (shot?.sprite?.active) targets.push(shot.sprite);
        (shot?.extras || []).forEach((spr) => {
          if (spr?.active) targets.push(spr);
        });
      });
      this.fighters().forEach((a) => {
        (a.statusBits || []).forEach((bit) => {
          if (bit?.active) targets.push(bit);
        });
      });
      return targets;
    }

    clearAllProjectiles() {
      (this.projectiles || []).forEach((shot) => this.destroyShot(shot));
      this.projectiles = [];
      this.fighters().forEach((a) => {
        (a.statusBits || []).forEach((bit) => {
          try {
            bit.destroy();
          } catch {
            /* ignore */
          }
        });
        a.statusBits = [];
      });
    }

    fadeCombatFx(onDone) {
      const finish = () => {
        if (!this.cine || this.cine.phase !== "clearFx") return;
        this.clearAllProjectiles();
        onDone();
      };
      const targets = this.combatFxTargets();
      if (!targets.length) {
        this.time.delayedCall(160, finish);
        return;
      }
      this.tweens.add({
        targets,
        alpha: 0,
        duration: 420,
        ease: "Quad.easeOut",
        onComplete: finish,
      });
      this.time.delayedCall(560, finish);
    }

    beginEndPoses() {
      if (!this.cine || this.cine.phase !== "clearFx" || this.resultShown) return;
      this.cine.phase = "poses";
      this.cine.startedAt = this.time.now;
      this.fighters().forEach((a) => {
        a.poseDone = false;
      });
      const { winners, losers } = this.matchWinnersLosers();
      losers.forEach((a) => {
        if (!a.startMove("defeat_cg", { voice: "defeat", busy: true })) a.poseDone = true;
      });
      winners.forEach((a) => {
        if (!a.startMove("win_cg", { voice: "win", busy: true })) a.poseDone = true;
      });
      this.spawnOutcomeTags(winners, losers);
      this.time.delayedCall(4200, () => this.onCinePoseDone());
    }

    cineActors() {
      const { winners, losers } = this.matchWinnersLosers();
      return [...winners, ...losers];
    }

    onCinePoseDone() {
      if (!this.cine || this.cine.closing || this.resultShown) return;
      const actors = this.cineActors();
      const timedOut = this.time.now - (this.cine.startedAt || 0) >= 4200;
      if (!timedOut && actors.some((a) => !a.poseDone)) return;
      this.cine.closing = true;
      this.cine.phase = "hold";
      this.time.delayedCall(900, () => {
        if (this.resultShown) return;
        this.cine.phase = "close";
        this.closeCurtains(1700, () => this.announceResult());
      });
    }

    freezeHit(ms, attacker) {
      if (!attacker?.sprite?.anims) return;
      const moveAtFreeze = attacker.move;
      attacker.sprite.anims.pause();
      this.time.delayedCall(ms, () => {
        if (!attacker?.sprite?.anims) return;
        // 已换招则不要误恢复旧动画
        if (attacker.move !== moveAtFreeze) return;
        if (!ATTACKS.has(attacker.move)) return;
        if (attacker.sprite.anims.isPaused) attacker.sprite.anims.resume();
      });
    }

    tryHit(attacker, defender) {
      if (!attacker.attacking() || defender.ko) return;
      const atkSpec = moveSpec(attacker.fighter, attacker.move);
      const projKey = `${attacker.prefix}-proj-${attacker.move}`;
      // 纯投射物招式走弹道；近战有附属特效贴图时仍要能打中
      const mec = mechanicSpec(atkSpec);
      if (atkSpec.projectile?.file && this.textures.exists(projKey) && mec.type !== "melee") return;
      // 奥义有弹道贴图时禁止拳脚判定，避免粒子没碰到人也挨打
      if (isSuperMove(attacker.move) && atkSpec.projectile?.file && this.textures.exists(projKey)) return;
      const box = attacker.attackBox();
      const hurt = defender.worldHurt();
      Phaser.Geom.Rectangle.Inflate(hurt, 14, 10);
      const body = defender.sprite.body;
      const bodyBox = new Phaser.Geom.Rectangle(body.x - 8, body.y - 8, body.width + 16, body.height + 16);
      if (!Phaser.Geom.Rectangle.Overlaps(box, hurt) && !Phaser.Geom.Rectangle.Overlaps(box, bodyBox)) return;
      // 无敌也给打击反馈（火花）+ 少量回蓝，避免“砍中没反馈/不回蓝”
      if (defender.invulnerable()) {
        attacker.hitThisMove = true;
        const x = Phaser.Math.Clamp(hurt.centerX, box.left, box.right);
        const y = Phaser.Math.Clamp(hurt.centerY, box.top, box.bottom);
        this.impactAt(x, y, "light");
        this.gainMpFromLight(attacker.move, attacker, defender, 5, 2);
        this.freezeHit(14, attacker);
        return;
      }
      attacker.hitThisMove = true;
      const x = Phaser.Math.Clamp(hurt.centerX, box.left, box.right);
      const y = Phaser.Math.Clamp(hurt.centerY, box.top, box.bottom);
      const nowHit = this.time.now;
      const timeLocked =
        defender.timeLockBanking && nowHit < (defender.timeLockUntil || 0);
      if (timeLocked) {
        const hpBefore = defender.hp;
        defender.takeHit(attacker.move, attacker.strikeFacing(), atkSpec);
        // 凝滞中仍给命中火花，伤害入账待爆发
        this.impactAt(x, y, "light");
        if (isLightAttack(attacker.move)) {
          // 凝滞中伤害入账，按记账量吸血
          const banked = Math.max(0, (defender.timeLockBank || 0) - (defender._timeLockBankSeen || 0));
          defender._timeLockBankSeen = defender.timeLockBank || 0;
          this.applyDomainLightLifesteal(attacker, defender, banked);
        }
        this.freezeHit(10, attacker);
        this.gainMpFromLight(attacker.move, attacker, defender, 8, 0);
        return;
      }
      const blocked = this.isGuarding(defender) && !isSuperMove(attacker.move);
      this.impactAt(x, y, hitSfxKind(attacker.move, blocked));
      if (blocked) {
        const strikeDir = attacker.strikeFacing();
        this.applyBlockedHit(defender, attacker, attacker.move, atkSpec.damage);
        defender.sprite.setVelocity(strikeDir * 70, 0);
        attacker.sprite.setVelocity(-strikeDir * 50, 0);
        defender.sprite.setTintFill(0x88b4ff);
        this.time.delayedCall(60, () => {
          defender.sprite.clearTint();
          if (defender.tint !== 0xffffff) defender.sprite.setTint(defender.tint);
        });
        this.freezeHit(18, attacker);
        return;
      }
      const hit = atkSpec.hit;
      const strikeDir = attacker.strikeFacing();
      this.cameras.main.shake(isSuperMove(attacker.move) ? 90 : 48, isSuperMove(attacker.move) ? 0.004 : 0.002);
      const hpBefore = defender.hp;
      defender.takeHit(attacker.move, strikeDir, atkSpec);
      if (isLightAttack(attacker.move)) {
        const lost = defender.infinite ? atkSpec.damage : Math.max(0, hpBefore - defender.hp);
        this.applyDomainLightLifesteal(attacker, defender, lost);
      }
      this.freezeHit(hit.stop || 32, attacker);
      this.gainMpFromLight(attacker.move, attacker, defender, 8, 5);
    }

    superStyle(fighter) {
      const id = fighter?.id || "";
      const name = fighter?.displayName || "";
      if (id === JIANG_ID || name.includes("蒋介石")) return "lockburst";
      if (id === ZHU_ID || name.includes("朱元璋")) return "dragon";
      if (id === NEWTON_ID || name.includes("牛顿")) return "meteors";
      if (id === YEAR_ZERO_ID || name.includes("波尔布特")) return "domain";
      if (id === HAWKING_ID || name.includes("霍金")) return "singularity";
      if (id === LUBU_ID || name.includes("吕布")) return "mounted_charge";
      if (/德川|甄嬛/.test(`${name} ${id}`)) return "personal";
      return "fullscreen";
    }

    spawnProjectile(attacker, move, moveFull) {
      if (this.over || this.cine || this.resultShown) return;
      const proj = moveFull?.projectile;
      if (!proj?.file) return;
      const key = `${attacker.prefix}-proj-${move}`;
      if (!this.textures.exists(key)) return;
      if (move === "super") {
        const style = this.superStyle(attacker.fighter);
        if (style === "fullscreen") {
          this.spawnFullscreenSuper(attacker, move, moveFull);
          return;
        }
        if (style === "lockburst") {
          this.spawnLockBurstSuper(attacker, move, moveFull);
          return;
        }
        if (style === "dragon") {
          this.spawnDragonSuper(attacker, move, moveFull);
          return;
        }
        if (style === "meteors") {
          this.spawnMeteorSuper(attacker, move, moveFull);
          return;
        }
        if (style === "domain") {
          this.spawnDomainSuper(attacker, move, moveFull);
          return;
        }
        if (style === "singularity") {
          this.spawnHawkingSuper(attacker, move, moveFull);
          return;
        }
        if (style === "mounted_charge") {
          this.spawnLuBuMountedSuper(attacker, move, moveFull);
          return;
        }
      }
      if (this.isLuBuHero(attacker.fighter)) {
        if (move === "combo_up") {
          this.spawnLuBuTornado(attacker, move, moveFull);
          return;
        }
        if (move === "combo_down") {
          this.spawnLuBuGroundWave(attacker, move, moveFull);
          return;
        }
      }
      if (this.isHawkingHero(attacker.fighter)) {
        if (move === "skill") {
          this.spawnHawkingSkillSwap(attacker, move, moveFull);
          return;
        }
        if (move === "combo_up") {
          this.spawnHawkingTimeLock(attacker, move, moveFull);
          return;
        }
        if (move === "combo_down") {
          this.spawnHawkingTraps(attacker, move, moveFull);
          return;
        }
      }
      if (move === "combo_down" && this.isYearZeroHero(attacker.fighter)) {
        this.spawnYearZeroWireBind(attacker, move, moveFull);
        return;
      }
      const mec = mechanicSpec(moveFull);
      // 德川上+小技能：两波忍者，落点锁在初次施放的同平面前方（不跟人挪）
      if (move === "combo_up" && this.isIeyasuHero(attacker.fighter)) {
        const waves = 2;
        const gap = 1050;
        const castPt = this.frontGroundPoint(attacker, 180);
        const castFacing = attacker.facing || 1;
        for (let i = 0; i < waves; i++) {
          this.time.delayedCall(i * gap, () => {
            if (!attacker || attacker.ko || this.over || this.cine) return;
            this.spawnShot(attacker, move, moveFull, {
              spreadX: 0,
              volley: 1,
              index: i,
              lockX: castPt.x,
              lockY: castPt.y,
              lockFacing: castFacing,
            });
          });
        }
        return;
      }
      if (mec.type === "barrage") {
        const n = mec.count || 3;
        const facing = attacker.facing || 1;
        for (let i = 0; i < n; i++) {
          const spreadX = facing * (i - (n - 1) / 2) * (mec.spread || 0);
          this.time.delayedCall(i * (mec.delay || 0), () => {
            if (!attacker || attacker.ko || this.over || this.cine) return;
            this.spawnShot(attacker, move, moveFull, { spreadX, volley: n, index: i });
          });
        }
        return;
      }
      this.spawnShot(attacker, move, moveFull, { spreadX: 0, volley: 1 });
    }

    fxSprite(attacker, move, x, y, opts) {
      const key = `${attacker.prefix}-proj-${move}`;
      const spr = this.add.sprite(x, y, key, 0).setDepth(opts.depth ?? 8);
      spr.setOrigin(opts.originX ?? 0.5, opts.originY ?? 0.5);
      spr.setFlipX((opts.facing ?? attacker.facing) < 0);
      if (opts.scale) spr.setScale(opts.scale);
      spr.setAlpha(1);
      if (opts.scrollFactor === 0) spr.setScrollFactor(0);
      if (opts.blend === "add") spr.setBlendMode(Phaser.BlendModes.ADD);
      else spr.setBlendMode(Phaser.BlendModes.NORMAL);
      if (this.anims.exists(key)) {
        spr.anims.play({ key, repeat: opts.repeat ?? -1, frameRate: opts.fps ?? 6 });
      }
      return spr;
    }

    shotPayload(attacker, move, moveFull, extra) {
      const proj = moveFull.projectile;
      return {
        owner: attacker,
        move,
        extras: [],
        lingerFall: false,
        hover: false,
        fullscreen: false,
        detonateOnLast: false,
        bombDrop: false,
        screenSpace: false,
        falling: false,
        lockBurst: false,
        hit: false,
        hitCd: {},
        damage: moveDamage(move),
        hitSpec: moveHit(move),
        effect: isSuperMove(move) ? "launch" : "none",
        effectStrength: isSuperMove(move) ? 1 : 0,
        ailment: "none",
        dmgBudget: isSuperMove(move) ? moveDamage("super") * 1.35 : moveDamage(move) * 2.2,
        ...extra,
      };
    }

    spawnFullscreenSuper(attacker, move, moveFull) {
      // 铁十字电网：3×2=6 格钉在地图世界坐标上（不跟镜头 UI 层晃）
      const proj = moveFull?.projectile;
      if (!proj?.file) return;
      const key = `${attacker.prefix}-proj-${move}`;
      if (!this.textures.exists(key)) return;
      const mec = mechanicSpec(moveFull);
      const motion = proj.motion || "forward";
      const visDef = mergeProjVisual(proj, mec, motion);
      const facing = attacker.facing || 1;
      const cam = this.cameras.main;
      const camW = this.scale.width;
      const camH = this.scale.height;
      const cols = 3;
      const rows = 2;
      const cellW = camW / cols;
      const cellH = camH / rows;
      const originX = cam.scrollX;
      const originY = cam.scrollY;
      const lifeMs = Math.max(visDef.life || 1400, 1600);
      const now = this.time.now;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const spr = this.add
            .sprite(originX + (c + 0.5) * cellW, originY + (r + 0.5) * cellH, key, 0)
            .setDepth(8)
            .setScrollFactor(1);
          spr.setOrigin(0.5, 0.5);
          const fit = Math.min(cellW / Math.max(8, spr.width), cellH / Math.max(8, spr.height)) * 0.88;
          spr.setScale(Math.max(0.12, Math.min(fit, visDef.maxScale || 1.4)));
          spr.setFlipX(facing < 0);
          if ((proj.blend || "add") === "add") spr.setBlendMode(Phaser.BlendModes.ADD);
          if (this.anims.exists(key)) {
            spr.anims.play({ key, repeat: -1, frameRate: visDef.fps, startFrame: (r * cols + c) % 4 });
          }
          this.projectiles.push(
            this.shotPayload(attacker, move, moveFull, {
              sprite: spr,
              facing,
              vx: 0,
              vy: 0,
              gravity: 0,
              motion: "field",
              kind: "zone",
              persist: true,
              pierce: true,
              homing: 0,
              ticksLeft: 5,
              pulseMs: 260,
              diesAt: now + lifeMs,
              hitW: Math.max(80, spr.displayWidth * 0.72),
              hitH: Math.max(80, spr.displayHeight * 0.72),
              screenSpace: false,
              fullscreen: false,
              trajectoryOnly: true,
              damage: Math.max(6, Math.round(moveDamage("super") / 6)),
              dmgBudget: Math.round((moveDamage("super") * 1.35) / 6),
            })
          );
        }
      }
    }

    /** 波尔布特·去城市化：周身柔边领域大屏（人物背后），跟随移动 */
    spawnDomainSuper(attacker, move, moveFull) {
      const proj = moveFull?.projectile;
      if (!proj?.file) return;
      if ((this.projectiles || []).some((s) => s?.owner === attacker && s.domainField && s.sprite?.active)) {
        return;
      }
      const key = `${attacker.prefix}-proj-${move}`;
      if (!this.textures.exists(key)) return;
      const ink = projInk(proj);
      const camH = this.scale.height;
      const scale = Phaser.Math.Clamp((camH * (Number(proj.screen) || 0.58)) / Math.max(24, ink.h), 0.55, 2.4);
      const now = this.time.now;
      const life = Math.max(10000, Number(proj.life) || 10000);
      attacker.domainNoDashUntil = now + life;
      const x = attacker.sprite.x;
      const y = attacker.sprite.y - 72;
      // 角色 sprite depth=2：领域必须更低，避免盖住人物
      const behind = Math.max(0, (attacker.sprite.depth || 2) - 1);
      bakeDomainSoftMask(this);
      const spr = this.fxSprite(attacker, move, x, y, {
        scale: scale * 0.86,
        blend: "normal",
        fps: Number(proj.frameRate) || 3,
        originX: 0.5,
        originY: 0.55,
        depth: behind,
        facing: 1,
      });
      spr.setAlpha(0);
      spr.setTint(0xffd0c4);
      const haze = this.add
        .ellipse(x, y, Math.max(80, spr.displayWidth * 1.02), Math.max(60, spr.displayHeight * 1.12), 0x3a0c0c, 0)
        .setDepth(behind - 0.15);
      const maskImg = this.add
        .image(x, y, "fx-domain-soft-mask")
        .setVisible(false)
        .setDepth(behind)
        .setScrollFactor(1);
      maskImg.setDisplaySize(spr.displayWidth * 1.12, spr.displayHeight * 1.28);
      try {
        spr.setMask(maskImg.createBitmapMask());
      } catch {
        /* ignore */
      }
      // 展开：淡入 + 略放大，半透明柔边
      this.tweens.add({
        targets: spr,
        alpha: 0.82,
        scaleX: scale,
        scaleY: scale,
        duration: 560,
        ease: "Cubic.Out",
        onUpdate: () => {
          maskImg.setDisplaySize(spr.displayWidth * 1.12, spr.displayHeight * 1.28);
          haze.setSize(Math.max(80, spr.displayWidth * 1.02), Math.max(60, spr.displayHeight * 1.12));
        },
      });
      this.tweens.add({
        targets: haze,
        alpha: 0.38,
        duration: 560,
        ease: "Cubic.Out",
      });
      this.tweens.add({
        targets: spr,
        alpha: { from: 0.74, to: 0.9 },
        duration: 1000,
        yoyo: true,
        repeat: -1,
        delay: 560,
        ease: "Sine.InOut",
      });
      const hitW = Math.max(Number(proj.hitW) || 0, spr.displayWidth * 0.78, camH * 0.48);
      const hitH = Math.max(Number(proj.hitH) || 0, spr.displayHeight * 0.82, camH * 0.52);
      this.projectiles.push(
        this.shotPayload(attacker, move, moveFull, {
          sprite: spr,
          extras: [haze, maskImg],
          softMask: maskImg,
          domainHaze: haze,
          facing: attacker.facing || 1,
          vx: 0,
          vy: 0,
          gravity: 0,
          motion: "field",
          kind: "zone",
          persist: true,
          pierce: true,
          domainField: true,
          domainHarmless: true,
          followOwner: true,
          followY: 72,
          homing: 0,
          ticksLeft: 0,
          pulseMs: life,
          diesAt: now + life,
          hitW,
          hitH,
          damage: 0,
          dmgBudget: null,
          lifesteal: 0,
          trajectoryOnly: true,
        })
      );
      this.cameras.main.shake(90, 0.0035);
    }

    /** 霍金 K：原位置出黑洞，与敌人换位，黑洞炸伤落在原点的敌人 */
    spawnHawkingSkillSwap(attacker, move, moveFull) {
      const proj = moveFull?.projectile;
      if (!proj?.file) return;
      const key = `${attacker.prefix}-proj-${move}`;
      if (!this.textures.exists(key)) return;
      const originX = attacker.sprite.x;
      const originY = attacker.sprite.y;
      const facing = attacker.facing || 1;
      const foe = this.foeAhead(attacker, 520) || this.nearestFoe(attacker);
      const ink = projInk(proj);
      const scale = Phaser.Math.Clamp((this.scale.height * 0.28) / Math.max(24, ink.h), 0.22, 1.2);
      const spr = this.fxSprite(attacker, move, originX, originY - 20, {
        scale,
        blend: "add",
        fps: Number(proj.frameRate) || 8,
        originX: 0.5,
        originY: 0.55,
        depth: 7,
        facing: 1,
        repeat: 0,
      });
      if (foe && !foe.ko) {
        const fx = foe.sprite.x;
        const fy = foe.sprite.y;
        attacker.sprite.x = fx;
        attacker.sprite.y = fy;
        foe.sprite.x = originX;
        foe.sprite.y = originY;
        attacker.facing = fx >= originX ? 1 : -1;
        foe.facing = originX >= fx ? 1 : -1;
        attacker.syncFacingVisual?.();
        foe.syncFacingVisual?.();
        this.ejectFromTerrain?.(attacker);
        this.ejectFromTerrain?.(foe);
      }
      const now = this.time.now;
      const dmg = Math.max(10, Number(moveFull.damage) || Number(proj.damage) || moveDamage(move));
      this.projectiles.push(
        this.shotPayload(attacker, move, moveFull, {
          sprite: spr,
          facing,
          vx: 0,
          vy: 0,
          gravity: 0,
          motion: "field",
          kind: "zone",
          persist: false,
          onceBurst: true,
          pierce: true,
          homing: 0,
          ticksLeft: 2,
          pulseMs: 80,
          diesAt: now + 900,
          hitW: Math.max(90, spr.displayWidth * 0.7),
          hitH: Math.max(90, spr.displayHeight * 0.7),
          damage: dmg,
          dmgBudget: dmg * 1.2,
          lockX: originX,
          lockY: originY,
          trajectoryOnly: true,
        })
      );
      this.cameras.main.shake(60, 0.003);
    }

    /** 霍金 上+K：世界坐标中央沙漏，敌人凝滞 1.5 秒，期间伤害静默记账，结束爆发 */
    spawnHawkingTimeLock(attacker, move, moveFull) {
      const proj = moveFull?.projectile;
      if (!proj?.file) return;
      const key = `${attacker.prefix}-proj-${move}`;
      if (!this.textures.exists(key)) return;
      const foe = this.foeAhead(attacker, 720) || this.nearestFoe(attacker);
      if (!foe || foe.ko) return;
      const cam = this.cameras.main;
      const ink = projInk(proj);
      const scale = Phaser.Math.Clamp((this.scale.height * 0.42) / Math.max(24, ink.h), 0.35, 1.6);
      // 钉在地图世界坐标（施放瞬间镜头中心 → 世界点），镜头移动时沙漏不跟着 UI 飘
      const worldX = cam.scrollX + this.scale.width / 2;
      const worldY = cam.scrollY + this.scale.height * 0.42;
      const spr = this.add
        .sprite(worldX, worldY, key, 0)
        .setDepth(18)
        .setOrigin(0.5, 0.5)
        .setScale(scale)
        .setAlpha(0.92);
      spr.setScrollFactor(1);
      if ((proj.blend || "add") === "add") spr.setBlendMode(Phaser.BlendModes.ADD);
      if (this.anims.exists(key)) spr.anims.play({ key, repeat: -1, frameRate: 5 });
      const lockMs = 1500;
      const now = this.time.now;
      foe.timeLockUntil = now + lockMs;
      foe.timeLockBanking = true;
      foe.timeLockBank = 0;
      foe._timeLockBankSeen = 0;
      foe.timeLockX = foe.sprite.x;
      foe.timeLockY = foe.sprite.y;
      foe.rootedUntil = foe.timeLockUntil;
      foe.stunUntil = 0;
      foe.busy = false;
      foe.sprite.setVelocity(0, 0);
      attacker._timeLockVictim = foe;
      // 「世界」式：以沙漏为圆心，银白滤镜圆形铺满全屏
      const veil = this.spawnHawkingWorldVeil(worldX, worldY, lockMs);
      this.projectiles.push(
        this.shotPayload(attacker, move, moveFull, {
          sprite: spr,
          facing: attacker.facing || 1,
          vx: 0,
          vy: 0,
          gravity: 0,
          motion: "field",
          kind: "zone",
          persist: true,
          screenSpace: false,
          domainHarmless: true,
          hawkingTimeLock: true,
          pierce: true,
          homing: 0,
          ticksLeft: 0,
          pulseMs: lockMs,
          diesAt: now + lockMs,
          hitW: 1,
          hitH: 1,
          damage: 0,
          dmgBudget: null,
          lockTarget: foe,
          lockX: worldX,
          lockY: worldY,
          worldVeil: veil,
          trajectoryOnly: true,
        })
      );
      this.time.delayedCall(lockMs, () => {
        this.releaseHawkingTimeLock(attacker, foe, spr, veil);
      });
      this.cameras.main.shake(40, 0.002);
    }

    /**
     * JOJO「世界」式时停铺开：以沙漏为圆心，银白金属滤镜圆形向外扩至全屏。
     * 返回可 fade/destroy 的句柄。
     */
    spawnHawkingWorldVeil(cx, cy, lifeMs) {
      const maxR = Math.hypot(this.scale.width, this.scale.height) * 1.2;
      const plate = this.add.graphics().setDepth(16).setScrollFactor(1);
      const rim = this.add.graphics().setDepth(17).setScrollFactor(1);
      const sheen = this.add.graphics().setDepth(16.5).setScrollFactor(1);
      const state = { r: 10, a: 0.88, pulse: 0 };
      const draw = () => {
        const r = Math.max(4, state.r);
        const a = state.a;
        plate.clear();
        // DIO「世界」：银白漂白场，不是灰片子
        plate.fillStyle(0xf4f7fb, a * 0.42);
        plate.fillCircle(cx, cy, r);
        plate.fillStyle(0xd8dee8, a * 0.28);
        plate.fillCircle(cx, cy, r);
        plate.fillStyle(0xffffff, a * 0.16);
        plate.fillCircle(cx, cy, Math.max(8, r * 0.45));
        // 金属高光带（斜向银白扫光）
        sheen.clear();
        sheen.fillStyle(0xffffff, a * 0.14);
        const band = Math.max(18, r * 0.12);
        sheen.fillEllipse(cx - r * 0.18, cy - r * 0.08, r * 1.55, band);
        sheen.fillStyle(0xe8eef6, a * 0.1);
        sheen.fillEllipse(cx + r * 0.12, cy + r * 0.1, r * 1.2, band * 0.7);
        // 稀疏银丝扫描线
        sheen.fillStyle(0xffffff, a * 0.06);
        const step = 14;
        const y0 = cy - r;
        const y1 = cy + r;
        for (let y = Math.floor(y0 / step) * step; y <= y1; y += step) {
          const dy = y - cy;
          if (Math.abs(dy) > r) continue;
          const half = Math.sqrt(Math.max(0, r * r - dy * dy));
          sheen.fillRect(cx - half, y, half * 2, 1);
        }
        rim.clear();
        // 外圈铬白波前
        rim.lineStyle(7, 0xffffff, Math.min(1, a * 1.0));
        rim.strokeCircle(cx, cy, r);
        rim.lineStyle(3, 0xc5ceda, a * 0.75);
        rim.strokeCircle(cx, cy, Math.max(0, r - 10));
        rim.lineStyle(2, 0xffffff, a * 0.45);
        rim.strokeCircle(cx, cy, Math.max(0, r - 22));
      };
      draw();
      this.tweens.add({
        targets: state,
        r: maxR,
        duration: 520,
        ease: "Cubic.Out",
        onUpdate: draw,
        onComplete: () => {
          draw();
          // 时停期间银白场轻脉动
          this.tweens.add({
            targets: state,
            a: 0.72,
            duration: 480,
            yoyo: true,
            repeat: Math.max(0, Math.floor((lifeMs - 560) / 960)),
            onUpdate: draw,
          });
        },
      });
      const handle = {
        plate,
        rim,
        sheen,
        state,
        draw,
        fade(scene, ms = 280) {
          if (!plate?.active) return;
          scene.tweens.killTweensOf(state);
          scene.tweens.add({
            targets: state,
            a: 0,
            duration: ms,
            ease: "Quad.In",
            onUpdate: draw,
            onComplete: () => {
              try {
                plate.destroy();
                rim.destroy();
                sheen.destroy();
              } catch {
                /* ignore */
              }
            },
          });
        },
        destroy() {
          try {
            plate.destroy();
            rim.destroy();
            sheen.destroy();
          } catch {
            /* ignore */
          }
        },
      };
      return handle;
    }

    releaseHawkingTimeLock(attacker, victim, hourglassSpr, veil) {
      if (!victim) return;
      const bank = Math.max(0, Math.round(victim.timeLockBank || 0));
      victim.timeLockBanking = false;
      victim.timeLockUntil = 0;
      victim.timeLockBank = 0;
      if (veil?.fade) veil.fade(this, 260);
      else if (veil?.destroy) veil.destroy();
      if (hourglassSpr?.active) {
        try {
          hourglassSpr.anims?.stop();
          this.tweens.add({
            targets: hourglassSpr,
            alpha: 0,
            scale: (hourglassSpr.scale || 1) * 1.35,
            duration: 220,
            onComplete: () => {
              try {
                hourglassSpr.destroy();
              } catch {
                /* ignore */
              }
            },
          });
        } catch {
          /* ignore */
        }
      }
      // 清掉还挂着的时间锁弹道壳（沙漏由本函数负责销毁）
      (this.projectiles || []).forEach((s) => {
        if (s?.hawkingTimeLock && s.lockTarget === victim) {
          if (s.worldVeil && s.worldVeil !== veil) s.worldVeil.destroy?.();
          s.sprite = null;
          s.diesAt = 0;
        }
      });
      if (bank <= 0 || victim.ko) {
        victim.rootedUntil = 0;
        return;
      }
      // 累积伤害逐段砸上身：中段钉死位姿，末段才击飞（避免 combo 阈值提前打断观感）
      let n = Math.min(14, Math.max(5, Math.round(bank / 3)));
      if (n > bank) n = Math.max(1, bank);
      const gap = 105;
      const pinX = victim.timeLockX || victim.sprite.x;
      const pinY = victim.timeLockY || victim.sprite.y;
      const burstEnd = this.time.now + (n - 1) * gap + 80;
      victim.rootedUntil = burstEnd;
      victim.timeLockX = pinX;
      victim.timeLockY = pinY;
      let left = bank;
      const dir = attacker && !attacker.ko ? attacker.strikeFacing?.() || attacker.facing || 1 : 1;
      for (let i = 0; i < n; i++) {
        const last = i === n - 1;
        const chunk = last ? left : Math.max(1, Math.floor(bank / n));
        left -= chunk;
        this.time.delayedCall(i * gap, () => {
          if (!victim || victim.ko) return;
          if (!last) {
            victim.sprite.x = pinX;
            victim.sprite.y = pinY;
            victim.sprite.setVelocity(0, 0);
            victim.willKnockdown = false;
            victim.airFalling = false;
          }
          const ox = Phaser.Math.Between(-28, 28);
          const oy = Phaser.Math.Between(-62, -24);
          this.impactAt(victim.sprite.x + ox, victim.sprite.y + oy, last ? "skill" : "light");
          // 额外一圈冲击，强化「旧伤一并兑现」
          const spark = this.add
            .circle(victim.sprite.x + ox * 0.4, victim.sprite.y + oy * 0.5, last ? 22 : 12, last ? 0xffe6a0 : 0xfff1c2, 0.85)
            .setDepth(9);
          this.tweens.add({
            targets: spark,
            scale: last ? 3.2 : 2.2,
            alpha: 0,
            duration: last ? 160 : 110,
            onComplete: () => spark.destroy(),
          });
          this.floatDamage(victim, chunk, { big: last, jx: ox * 0.5, jy: oy * 0.2 });
          this.cameras.main.shake(last ? 110 : 36, last ? 0.007 : 0.0028);
          victim.takeHit("attack", dir, {
            damage: chunk,
            timeLockBurst: true,
            forceLaunch: last,
            hit: {
              knock: last ? 400 : 28,
              lift: last ? -580 : -12,
              stun: last ? 0 : 160,
              knockdown: last,
              stop: last ? 48 : 12,
            },
          });
          if (!last) {
            victim.sprite.x = pinX;
            victim.sprite.y = pinY;
            victim.sprite.setVelocity(0, 0);
            victim.willKnockdown = false;
            victim.airFalling = false;
            victim.rootedUntil = Math.max(victim.rootedUntil || 0, this.time.now + gap + 40);
            try {
              victim.sprite.setTintFill(0xffffff);
              this.time.delayedCall(50, () => victim.refreshAilmentTint?.());
            } catch {
              /* ignore */
            }
          }
        });
      }
    }

    /** 脚是否踩在铁丝网所在地表（腾空不算） */
    feetOnWireGround(target, landY) {
      if (!target || target.ko) return false;
      if (!target.grounded()) return false;
      if (!Number.isFinite(landY)) return true;
      return Math.abs(target.sprite.y - landY) <= 14;
    }

    /** 波尔布特 下+K：荆棘铁丝网从脚下地表钻出禁锢（腾空只铺地，落地踩中才困） */
    spawnYearZeroWireBind(attacker, move, moveFull) {
      const proj = moveFull?.projectile;
      if (!proj?.file) return;
      const key = `${attacker.prefix}-proj-${move}`;
      if (!this.textures.exists(key)) return;
      const facing = attacker.facing || 1;
      const foe =
        this.foeAhead(attacker, 540) ||
        (() => {
          const n = this.nearestFoe(attacker);
          if (!n || n.ko) return null;
          return Math.abs(n.sprite.x - attacker.sprite.x) <= 620 ? n : null;
        })();
      // 素材下方有大块透明垫：必须用墨水底边 origin，不能硬写 0.95（否则整坨悬空）
      const ink = projInk(proj);
      const feet = scanFrame(this, key, Math.min(2, Math.max(0, (proj.frames || 4) - 1)));
      const inkH = Math.max(48, feet.h || ink.h || 200);
      const originY = Phaser.Math.Clamp(feet.originY || ink.originY || 0.64, 0.4, 0.98);
      const originX = feet.originX || ink.originX || 0.5;
      let x;
      let landY;
      if (foe && !foe.ko) {
        x = foe.sprite.x;
        landY =
          this.surfaceUnder(x, foe.sprite.y - 4) ??
          this.planeYAt(x, foe.sprite.y) ??
          foe.sprite.y;
      } else {
        const pt = this.frontGroundPoint(attacker, 210);
        x = pt.x;
        landY = pt.y;
      }
      // setScale 作用于整帧；按墨水实际高度缩到约角色下半身
      let scale = Phaser.Math.Clamp((this.scale.height * (proj.screen || 0.18)) / inkH, 0.12, 0.7);
      if (foe?.worldHurt) {
        const hurt = foe.worldHurt();
        const bodyH = Math.max(80, (hurt.bottom || foe.sprite.y) - (hurt.top || foe.sprite.y - 120));
        scale = Phaser.Math.Clamp((bodyH * 0.58) / inkH, 0.12, 0.75);
      }
      const spr = this.add.sprite(x, landY, key, 0).setDepth(7);
      spr.setOrigin(originX, originY);
      spr.setFlipX(facing < 0);
      spr.setScale(scale);
      spr.setAlpha(0.98);
      spr.setBlendMode(Phaser.BlendModes.NORMAL);
      spr.y = landY;
      if (this.anims.exists(key)) {
        spr.anims.play({ key, repeat: 0, frameRate: Math.max(5, proj.frameRate || 7) });
        spr.once?.(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
          if (!spr.active) return;
          try {
            const last = Math.max(0, (spr.anims?.currentAnim?.frames?.length || 4) - 1);
            spr.setFrame(last);
            // 末帧墨水底边可能略有偏移，再贴一次地
            const endFeet = scanFrame(this, key, last);
            if (endFeet?.originY > 0.2) {
              spr.setOrigin(endFeet.originX || originX, endFeet.originY);
              spr.y = landY;
            }
          } catch {
            /* ignore */
          }
        });
      }
      const rootMs = Math.max(1800, Number(proj.rootMs) || Number(proj.life) || 2800);
      const now = this.time.now;
      const dmg = Math.max(4, Number(proj.damage) || moveDamage(move) || 10);
      const hitW = Math.max(56, (feet.w || spr.displayWidth) * scale * 0.55);
      const hitH = Math.max(48, inkH * scale * 0.95);
      const shot = this.shotPayload(attacker, move, moveFull, {
        sprite: spr,
        facing,
        vx: 0,
        vy: 0,
        gravity: 0,
        motion: "field",
        kind: "zone",
        persist: true,
        pierce: true,
        homing: 0,
        ticksLeft: 0,
        pulseMs: rootMs,
        diesAt: now + rootMs + 120,
        hitW,
        hitH,
        damage: dmg,
        dmgBudget: null,
        landY,
        yearZeroBind: true,
        domainHarmless: true,
        trajectoryOnly: true,
        lockTarget: null,
        lockX: x,
        lockY: landY,
        bindApplied: false,
      });
      this.projectiles.push(shot);
      if (foe && !foe.ko && this.feetOnWireGround(foe, landY)) {
        this.applyYearZeroWireRoot(shot, foe, dmg);
      }
      this.cameras.main.shake(36, 0.002);
    }

    applyYearZeroWireRoot(shot, target, dmg) {
      if (!shot || !target || target.ko || shot.bindApplied) return;
      if (!this.feetOnWireGround(target, shot.landY)) return;
      const now = this.time.now;
      const rootMs = Math.max(400, (shot.diesAt || now + 2800) - now);
      const pinX = Number.isFinite(shot.lockX) ? shot.lockX : target.sprite.x;
      const pinY = Number.isFinite(shot.landY) ? shot.landY : target.sprite.y;
      shot.bindApplied = true;
      shot.lockTarget = target;
      shot.lockX = pinX;
      shot.lockY = pinY;
      shot.landY = pinY;
      target.wireBindShot = shot;
      target.willKnockdown = false;
      target.airFalling = false;
      target.sprite.x = pinX;
      target.sprite.y = pinY;
      target.sprite.setVelocity(0, 0);
      const facing = shot.facing || shot.owner?.facing || 1;
      const dealt = Math.max(1, Math.round(dmg || shot.damage || 10));
      target.takeHit(shot.move || "combo_down", facing, {
        damage: dealt,
        hit: { knock: 0, lift: 0, stun: 220, knockdown: false, stop: 6 },
        effect: "none",
        effectStrength: 0,
        ailment: "none",
      });
      // 受击后钉死在铁丝网落点，避免被冲出
      target.sprite.x = pinX;
      target.sprite.y = pinY;
      target.sprite.setVelocity(0, 0);
      target.rootedUntil = Math.max(target.rootedUntil || 0, now + rootMs);
      target.stunUntil = Math.min(target.stunUntil || 0, now + 180);
      this.impactAt(target.sprite.x, target.sprite.y - 28, "skill");
      if (shot.sprite?.active) {
        shot.sprite.x = pinX;
        shot.sprite.y = pinY;
      }
    }

    /** 吕布 上+K：大号龙卷风绕自身旋转，伤周边与上方敌人 */
    spawnLuBuTornado(attacker, move, moveFull) {
      const proj = moveFull?.projectile;
      if (!proj?.file) return;
      const key = `${attacker.prefix}-proj-${move}`;
      if (!this.textures.exists(key)) return;
      const ink = projInk(proj);
      const bodyDisp = this.actorBodyDisp(attacker);
      const scale = Phaser.Math.Clamp((bodyDisp * 1.42) / Math.max(24, ink.h), 0.42, 2.4);
      const spr = this.fxSprite(attacker, move, attacker.sprite.x, attacker.sprite.y - bodyDisp * 0.5, {
        scale,
        blend: "normal",
        fps: Number(proj.frameRate) || 9,
        originX: 0.5,
        originY: 0.5,
        depth: 6,
        facing: 1,
        repeat: -1,
      });
      const now = this.time.now;
      const life = Math.max(1600, Number(proj.life) || 1900);
      this.projectiles.push(
        this.shotPayload(attacker, move, moveFull, {
          sprite: spr,
          facing: attacker.facing || 1,
          vx: 0,
          vy: 0,
          gravity: 0,
          motion: "field",
          kind: "zone",
          persist: true,
          pierce: true,
          luBuOrbit: true,
          orbitAngle: 0,
          orbitSpeed: 4.6,
          orbitRadius: bodyDisp * 0.62,
          homing: 0,
          ticksLeft: 10,
          pulseMs: 180,
          diesAt: now + life,
          hitW: bodyDisp * 1.85,
          hitH: bodyDisp * 1.75,
          damage: Math.max(10, Number(moveFull.damage) || moveDamage(move)),
          dmgBudget: Math.round((Number(moveFull.damage) || moveDamage(move)) * 2.4),
          effect: "launch",
          effectStrength: 0.55,
          trajectoryOnly: true,
        })
      );
      this.cameras.main.shake(48, 0.0025);
    }

    /** 吕布 K 命中：只补打击火花，不再复制整段戟粒子（避免像第二发弹道） */
    spawnLuBuSkillHitFx(shot, target) {
      if (!target?.sprite) return;
      const x = Phaser.Math.Clamp(target.sprite.x, (shot?.sprite?.x ?? target.sprite.x) - 48, (shot?.sprite?.x ?? target.sprite.x) + 48);
      const y = target.sprite.y - Math.max(28, this.actorBodyDisp(target) * 0.12);
      this.impactAt(x, y - 18, "skill");
    }

    /** 吕布 下+K：脚下向前延伸大片地裂粒子，接触者击飞 */
    spawnLuBuGroundWave(attacker, move, moveFull) {
      const proj = moveFull?.projectile;
      if (!proj?.file) return;
      const key = `${attacker.prefix}-proj-${move}`;
      if (!this.textures.exists(key)) return;
      const facing = attacker.facing || 1;
      const refFeetY = this.supportY(attacker);
      const bodyDisp = this.actorBodyDisp(attacker);
      const ink = projInk(proj);
      const scale = Phaser.Math.Clamp((bodyDisp * 0.92) / Math.max(24, ink.h), 0.35, 2.0);
      const extent = bodyDisp * 3.6;
      const cx = attacker.sprite.x + facing * (extent * 0.44);
      const groundY = this.planeYAt(cx, refFeetY) ?? this.groundYAt(cx);
      const spr = this.fxSprite(attacker, move, cx, groundY, {
        scale,
        blend: "normal",
        fps: Number(proj.frameRate) || 10,
        depth: 5,
        facing: facing > 0 ? 1 : -1,
        repeat: 0,
      });
      const wantW = extent;
      const wantH = bodyDisp * 0.78;
      spr.setDisplaySize(Math.max(wantW, spr.displayWidth * 1.05), Math.max(wantH, spr.displayHeight * 0.9));
      this.pinProjFeetToGround(spr, groundY, proj);
      const now = this.time.now;
      const life = Math.max(900, Number(proj.life) || 1100);
      this.projectiles.push(
        this.shotPayload(attacker, move, moveFull, {
          sprite: spr,
          facing,
          vx: 0,
          vy: 0,
          gravity: 0,
          motion: "field",
          kind: "zone",
          persist: true,
          pierce: true,
          luBuGroundWave: true,
          feetProj: proj,
          waveNearX: attacker.sprite.x,
          homing: 0,
          ticksLeft: 5,
          pulseMs: 160,
          diesAt: now + life,
          hitW: wantW,
          hitH: wantH,
          landY: groundY,
          damage: Math.max(14, Number(moveFull.damage) || moveDamage(move)),
          dmgBudget: Math.round((Number(moveFull.damage) || moveDamage(move)) * 1.8),
          effect: "launch",
          effectStrength: 1.25,
          trajectoryOnly: true,
        })
      );
      this.cameras.main.shake(64, 0.0035);
    }

    finishLuBuSuperVanish(attacker) {
      if (!attacker || attacker.ko) return;
      attacker.luBuSuperHidden = false;
      attacker.luBuChargePending = 0;
      if (attacker.sprite) {
        attacker.sprite.setVisible(true);
        attacker.sprite.y = this.groundYAt(attacker.sprite.x) ?? attacker.sprite.y;
      }
      if (attacker.move === "super") {
        attacker.busy = false;
        attacker.projSpawned = false;
        attacker.startMove("idle", { busy: false });
      }
    }

    noteLuBuChargeEnded(attacker) {
      if (!attacker?.luBuSuperHidden) return;
      attacker.luBuChargePending = Math.max(0, (attacker.luBuChargePending || 0) - 1);
      if (attacker.luBuChargePending <= 0) this.finishLuBuSuperVanish(attacker);
    }

    /** 吕布奥义：本人消失，骑马贴地横穿整张地图再折返 */
    spawnLuBuMountedSuper(attacker, move, moveFull) {
      const proj = moveFull?.projectile;
      if (!proj?.file) return;
      if ((this.projectiles || []).some((s) => s?.owner === attacker && s.move === "super" && s.sprite?.active)) {
        return;
      }
      const key = `${attacker.prefix}-proj-${move}`;
      if (!this.textures.exists(key)) return;
      const ink = projInk(proj);
      const bodyDisp = this.actorBodyDisp(attacker);
      const mountScale = Phaser.Math.Clamp((bodyDisp * 1.85) / Math.max(24, ink.h), 0.55, 2.6);
      const bounds = this.physics.world.bounds;
      const margin = 64;
      const leftX = bounds.x + margin;
      const rightX = bounds.x + bounds.width - margin;
      const speed = Math.max(720, Number(proj.speed) || 880);
      const dist = Math.max(320, rightX - leftX);
      const passMs = Math.ceil((dist / speed) * 1000) + 280;
      attacker.luBuSuperHidden = true;
      attacker.sprite?.setVisible(false);
      attacker.luBuChargePending = 2;
      const passes = [
        { delay: 0, startX: leftX, endX: rightX, facing: 1 },
        { delay: passMs, startX: rightX, endX: leftX, facing: -1 },
      ];
      passes.forEach((pass) => {
        this.time.delayedCall(pass.delay, () => {
          if (!attacker || attacker.ko || this.over || this.cine) {
            this.noteLuBuChargeEnded(attacker);
            return;
          }
          const startY = this.spawnFloorY(pass.startX) ?? this.groundYAt(pass.startX) ?? attacker.sprite.y;
          const spr = this.fxSprite(attacker, move, pass.startX, startY, {
            scale: mountScale,
            blend: "normal",
            fps: Number(proj.frameRate) || 10,
            depth: 7,
            facing: pass.facing > 0 ? 1 : -1,
            repeat: -1,
          });
          spr.setScrollFactor(1);
          this.pinProjFeetToGround(spr, startY, proj);
          const now = this.time.now;
          this.projectiles.push(
            this.shotPayload(attacker, move, moveFull, {
              sprite: spr,
              facing: pass.facing,
              vx: pass.facing * speed,
              vy: 0,
              gravity: 0,
              motion: "forward",
              kind: "bolt",
              persist: true,
              pierce: true,
              luBuCharge: true,
              feetProj: proj,
              chargeEndX: pass.endX,
              homing: 0,
              ticksLeft: 16,
              pulseMs: 100,
              diesAt: now + passMs,
              landY: startY,
              hitW: bodyDisp * 1.2,
              hitH: bodyDisp * 0.88,
              damage: Math.max(16, Math.round((Number(moveFull.damage) || moveDamage("super")) * 0.52)),
              dmgBudget: Math.round((Number(moveFull.damage) || moveDamage("super")) * 0.72),
              effect: "launch",
              effectStrength: 1.15,
              trajectoryOnly: true,
            })
          );
        });
      });
      this.cameras.main.shake(120, 0.005);
    }

    /** 荆棘禁锢：已缠住时钉死在落点 */
    tickYearZeroWireBinds() {
      const now = this.time.now;
      for (const shot of this.projectiles || []) {
        if (!shot?.yearZeroBind || !shot.sprite?.active || !shot.bindApplied) continue;
        const foe = shot.lockTarget;
        if (!foe || foe.ko) {
          if (foe?.wireBindShot === shot) foe.wireBindShot = null;
          continue;
        }
        if (!(now < (foe.rootedUntil || 0))) continue;
        if (Number.isFinite(shot.lockX) && Number.isFinite(shot.lockY)) {
          foe.sprite.x = shot.lockX;
          foe.sprite.y = shot.lockY;
          foe.sprite.setVelocity(0, 0);
          foe.willKnockdown = false;
          foe.airFalling = false;
        }
        shot.sprite.x = shot.lockX;
        shot.sprite.y = shot.lockY;
      }
    }

    /** 霍金 下+K：在面前同层地表布置小黑洞陷阱（贴地，不悬浮） */
    spawnHawkingTraps(attacker, move, moveFull) {
      const proj = moveFull?.projectile;
      if (!proj?.file) return;
      const key = `${attacker.prefix}-proj-${move}`;
      if (!this.textures.exists(key)) return;
      const ink = projInk(proj);
      const facing = attacker.facing || 1;
      const n = 4;
      const scale = Phaser.Math.Clamp((this.scale.height * 0.16) / Math.max(24, ink.h), 0.12, 0.55);
      const now = this.time.now;
      const feetY = this.surfaceUnder(attacker.sprite.x, attacker.sprite.y) ?? attacker.sprite.y;
      for (let i = 0; i < n; i++) {
        this.time.delayedCall(i * 55, () => {
          if (!attacker || attacker.ko || this.over || this.cine) return;
          const dist = 70 + i * 72;
          const pt = this.frontGroundPoint(attacker, dist);
          // 强制同层：相对霍金脚下找面前地表，避免落到别的层或悬空
          const x = pt.ok ? pt.x : attacker.sprite.x + facing * dist;
          const landY = this.planeYAt(x, feetY) ?? pt.y ?? feetY;
          const spr = this.fxSprite(attacker, move, x, landY, {
            scale,
            blend: "add",
            fps: 6,
            originX: 0.5,
            originY: 0.9,
            depth: 6,
            facing: 1,
            repeat: 0,
          });
          spr.anims?.pause();
          spr.setFrame(0);
          this.projectiles.push(
            this.shotPayload(attacker, move, moveFull, {
              sprite: spr,
              facing,
              vx: 0,
              vy: 0,
              gravity: 0,
              motion: "field",
              kind: "trap",
              falling: false,
              hawkingTrap: true,
              trapArmed: true,
              trapExploding: false,
              trapExpireAt: now + i * 55 + 3000,
              persist: true,
              pierce: false,
              homing: 0,
              ticksLeft: 1,
              pulseMs: 0,
              diesAt: now + 8000,
              landY,
              hitW: Math.max(48, spr.displayWidth * 0.7),
              hitH: Math.max(40, spr.displayHeight * 0.45),
              damage: Math.max(8, Number(moveFull.damage) || moveDamage(move)),
              dmgBudget: Math.max(8, Number(moveFull.damage) || moveDamage(move)),
              trajectoryOnly: true,
            })
          );
        });
      }
    }

    /** 霍金奥义：脸前巨大黑洞向前冲击，只伤面前 */
    spawnHawkingSuper(attacker, move, moveFull) {
      const proj = moveFull?.projectile;
      if (!proj?.file) return;
      if ((this.projectiles || []).some((s) => s?.owner === attacker && s.move === "super" && s.sprite?.active)) {
        return;
      }
      const key = `${attacker.prefix}-proj-${move}`;
      if (!this.textures.exists(key)) return;
      const facing = attacker.facing || 1;
      const ink = projInk(proj);
      const scale = Phaser.Math.Clamp((this.scale.height * 0.48) / Math.max(24, ink.h), 0.4, 1.8);
      const vis = attacker.worldHurt?.() || { top: attacker.sprite.y - 80 };
      const x = attacker.sprite.x + facing * 70;
      const y = (vis.top + attacker.sprite.y) / 2;
      const spr = this.fxSprite(attacker, move, x, y, {
        scale,
        blend: (proj.blend || "add") === "add" ? "add" : "normal",
        fps: Number(proj.frameRate) || 6,
        originX: facing > 0 ? 0.2 : 0.8,
        originY: 0.5,
        depth: 9,
        facing,
      });
      const now = this.time.now;
      const life = Math.max(1400, Number(proj.life) || 1600);
      const speed = Math.max(280, Number(proj.speed) || 320);
      this.projectiles.push(
        this.shotPayload(attacker, move, moveFull, {
          sprite: spr,
          facing,
          vx: facing * speed,
          vy: 0,
          gravity: 0,
          motion: "forward",
          kind: "bolt",
          persist: true,
          pierce: true,
          forwardOnly: true,
          hawkingSuper: true,
          homing: 0,
          ticksLeft: 6,
          pulseMs: 160,
          diesAt: now + life,
          hitW: Math.max(96, spr.displayWidth * 0.58),
          hitH: Math.max(88, spr.displayHeight * 0.62),
          hitScale: 1,
          damage: Math.max(18, Number(moveFull.damage) || moveDamage("super")),
          dmgBudget: Math.round((Number(moveFull.damage) || moveDamage("super")) * 1.4),
          trajectoryOnly: true,
        })
      );
      this.cameras.main.shake(100, 0.0045);
    }

    spawnLockBurstSuper(attacker, move, moveFull) {
      const proj = moveFull?.projectile;
      if (!proj?.file) return;
      const visDef = mergeProjVisual(proj, mechanicSpec(moveFull), proj.motion || "hover");
      const ink = projInk(proj);
      const target = this.foeAhead(attacker, 640) || this.nearestFoe(attacker);
      const facing = attacker.facing;
      const x = target ? target.sprite.x : attacker.sprite.x + facing * 180;
      const y = target ? target.sprite.y - 52 : attacker.sprite.y - 52;
      const scale = Phaser.Math.Clamp((this.scale.height * 0.42) / Math.max(24, ink.h), 0.18, 1.15);
      const spr = this.fxSprite(attacker, move, x, y, {
        scale,
        blend: "normal",
        fps: visDef.fps,
        originX: 0.5,
        originY: 0.55,
      });
      const now = this.time.now;
      this.projectiles.push(
        this.shotPayload(attacker, move, moveFull, {
          sprite: spr,
          facing,
          vx: 0,
          vy: 0,
          gravity: 0,
          motion: "hover",
          kind: "homing",
          persist: false,
          lockBurst: true,
          lockTarget: target,
          lockExplodeAt: now + 520,
          pierce: true,
          homing: 0,
          ticksLeft: 3,
          pulseMs: 90,
          diesAt: now + 1100,
          hitW: Math.max(140, spr.displayWidth * 0.7),
          hitH: Math.max(140, spr.displayHeight * 0.7),
        })
      );
    }

    spawnDragonSuper(attacker, move, moveFull) {
      const proj = moveFull?.projectile;
      if (!proj?.file) return;
      if ((this.projectiles || []).some((s) => s?.owner === attacker && s.move === "super" && s.sprite?.active)) {
        return;
      }
      const visDef = mergeProjVisual(proj, mechanicSpec(moveFull), "fall");
      const facing = attacker.strikeFacing?.() || attacker.facing || 1;
      const cam = this.cameras.main;
      const camW = this.scale.width;
      const camH = this.scale.height;
      const colW = camW * 0.25;
      const colH = camH;
      const startX = attacker.sprite.x + facing * (colW * 0.52 + 48);
      const now = this.time.now;
      const life = Math.max(1300, Number(proj.life) || 1400);
      const layers = 3;
      for (let i = 0; i < layers; i++) {
        this.time.delayedCall(i * 70, () => {
          if (!attacker || attacker.ko || this.over || this.cine) return;
          const x = startX + facing * (i - 1) * (colW * 0.16);
          const spr = this.fxSprite(attacker, move, x, cam.scrollY, {
            blend: (proj.blend || "add") === "add" ? "add" : "normal",
            fps: (visDef.fps || 8) + i,
            originX: 0.5,
            originY: 0,
            depth: 10 + i * 0.1,
            facing: 1,
          });
          spr.setScrollFactor(1);
          spr.setFlipX(facing < 0);
          spr.setRotation(0);
          spr.setAlpha(i === 0 ? 1 : 0.55 - i * 0.08);
          spr.setDisplaySize(colW * (1 - i * 0.06), colH * 1.65);
          if (this.anims.exists(`${attacker.prefix}-proj-${move}`)) {
            spr.anims.play({
              key: `${attacker.prefix}-proj-${move}`,
              repeat: -1,
              frameRate: (visDef.fps || 8) + i,
              startFrame: i % 4,
            });
          }
          this.projectiles.push(
            this.shotPayload(attacker, move, moveFull, {
              sprite: spr,
              facing,
              vx: facing * (28 + i * 18),
              vy: 0,
              gravity: 0,
              motion: "field",
              kind: "zone",
              persist: true,
              pierce: true,
              homing: 0,
              rainCurtain: true,
              rainColW: colW,
              ticksLeft: 5,
              pulseMs: 150,
              diesAt: now + life + i * 90,
              hitW: colW * 0.92,
              hitH: colH,
              hitScale: 1,
              damage: Math.max(12, Math.round((moveFull.damage || moveDamage("super")) * (i === 0 ? 1 : 0.45))),
              dmgBudget: Math.round((moveFull.damage || moveDamage("super")) * (i === 0 ? 1.2 : 0.5)),
              trajectoryOnly: true,
            })
          );
        });
      }
    }

    spawnMeteorSuper(attacker, move, moveFull) {
      const proj = moveFull?.projectile;
      if (!proj?.file) return;
      const visDef = mergeProjVisual(proj, mechanicSpec(moveFull), "fall");
      const ink = projInk(proj);
      const facing = attacker.facing;
      const cam = this.cameras.main;
      const camW = this.scale.width;
      const camH = this.scale.height;
      const n = 3;
      // 视觉与判定都略收，方便从缝隙躲开
      const scale = Phaser.Math.Clamp((camH * 0.34) / Math.max(24, ink.h), 0.22, 0.95);
      for (let i = 0; i < n; i++) {
        this.time.delayedCall(i * 170, () => {
          if (!attacker || attacker.ko || this.over || this.cine) return;
          const startX = cam.scrollX + (facing > 0 ? -80 + i * 70 : camW + 80 - i * 70);
          const startY = cam.scrollY - 50 + i * 36;
          const endX = cam.scrollX + (facing > 0 ? camW + 120 : -120);
          const endY = cam.scrollY + camH + 90;
          const dx = endX - startX;
          const dy = endY - startY;
          const dist = Math.max(1, Math.hypot(dx, dy));
          const speed = 780;
          const spr = this.fxSprite(attacker, move, startX, startY, {
            scale,
            blend: "normal",
            fps: visDef.fps,
            originX: 0.5,
            originY: 0.5,
            depth: 10,
            facing: 1,
          });
          spr.setScrollFactor(1);
          alignTravelSprite(spr, dx, dy);
          this.projectiles.push(
            this.shotPayload(attacker, move, moveFull, {
              sprite: spr,
              facing,
              vx: (dx / dist) * speed,
              vy: (dy / dist) * speed,
              gravity: 0,
              motion: "fall",
              kind: "drop",
              persist: true,
              pierce: true,
              screenSpace: false,
              travelAlign: true,
              homing: 0,
              ticksLeft: 5,
              pulseMs: 180,
              diesAt: this.time.now + 1600,
              hitW: Math.max(70, spr.displayWidth * 0.42),
              hitH: Math.max(70, spr.displayHeight * 0.42),
              hitScale: 1,
              damage: Math.max(8, Math.round(moveDamage("super") * 0.45)),
              dmgBudget: Math.round(moveDamage("super") * 0.55),
              trajectoryOnly: true,
            })
          );
        });
      }
    }

    spawnShot(attacker, move, moveFull, opts) {
      if (this.over || this.cine || this.resultShown) return;
      const proj = moveFull?.projectile;
      if (!proj?.file) return;
      const key = `${attacker.prefix}-proj-${move}`;
      if (!this.textures.exists(key)) return;
      const mec = mechanicSpec(moveFull);
      const motion = proj.motion || "forward";
      let origin = proj.origin || "hand";
      const groundFront = move === "combo_down" && this.isGroundFrontDown(attacker.fighter);
      const dropping = move === "combo_down" && !groundFront;
      if (dropping) origin = "hand";
      if (groundFront) origin = "ahead";
      const visDef = mergeProjVisual(proj, mec, dropping ? "fall" : motion);
      let facing = attacker.strikeFacing?.() || (attacker.facing < 0 ? -1 : 1);
      if (Number.isFinite(opts?.lockFacing)) facing = opts.lockFacing < 0 ? -1 : 1;
      const jiangStrafe = move === "combo_up" && this.isJiangHero(attacker.fighter);
      const ieyasuNinjas = move === "combo_up" && this.isIeyasuHero(attacker.fighter);
      const newtonPull = move === "combo_up" && this.isNewtonHero(attacker.fighter);
      // 忍者 / 牛顿引力光环：同平面正前方（不是脚下、也不是前上方）
      if (ieyasuNinjas || newtonPull) origin = "ahead";
      const ink = projInk(proj);
      let scale = Phaser.Math.Clamp(
        (this.scale.height * visDef.screen) / Math.max(24, ink.h),
        0.08,
        visDef.maxScale
      );
      // 波尔布特 K：扔出的叉子跟手里同级（按角色当前身长对齐，不被小弹道默认压扁）
      if (move === "skill" && this.isYearZeroHero(attacker.fighter)) {
        const bodyDisp = Math.max(
          96,
          (attacker.idleH || 200) * Math.abs(attacker.displayScale || attacker.baseScale || 1)
        );
        const wantLen = bodyDisp * 1.08;
        scale = Phaser.Math.Clamp(wantLen / Math.max(24, ink.h), 0.35, 1.55);
      }
      if (move === "skill" && this.isLuBuHero(attacker.fighter)) {
        const bodyDisp = this.actorBodyDisp(attacker);
        const atkReach = Number(attacker.fighter?.moves?.attack?.reach) || REACH.attack || 72;
        const weaponLen = Math.max(bodyDisp * 0.98, atkReach * Math.abs(attacker.displayScale || attacker.baseScale || 1) * 1.12);
        scale = Phaser.Math.Clamp(weaponLen / Math.max(24, ink.h), 0.48, 2.35);
      }
      const spreadX = opts?.spreadX || 0;
      const aheadX = attacker.sprite.x + facing * 210;
      const dropTarget = dropping ? this.foeAhead(attacker, 420) : null;
      const lockOn = mec.homing > 0 && move !== "super";
      const target = dropTarget || (lockOn ? this.nearestFoe(attacker) : null);
      const aimX = target && !target.ko ? target.sprite.x : aheadX;
      const spawn = attacker.emitPoint(origin, origin === "sky" || origin === "air" || move === "super" ? aheadX : aimX);
      let x = spawn.x + spreadX;
      let y = spawn.y;
      let landY = null;
      if (ieyasuNinjas) {
        if (Number.isFinite(opts?.lockX) && Number.isFinite(opts?.lockY)) {
          x = opts.lockX + spreadX;
          landY = opts.lockY;
          y = landY;
        } else {
          const pt = this.frontGroundPoint(attacker, 180);
          x = pt.x + spreadX;
          landY = pt.y;
          y = landY;
        }
      } else if (newtonPull) {
        const pt = this.frontGroundPoint(attacker, 170);
        x = pt.x + spreadX;
        landY = pt.y;
        y = landY;
      } else if (groundFront) {
        const pt = this.frontGroundPoint(attacker, 240);
        x = pt.x + spreadX;
        landY = pt.y;
        y = landY;
      } else if (dropping) {
        x = (target ? target.sprite.x : attacker.sprite.x + facing * 170) + spreadX;
        const refY = attacker.sprite.y;
        landY = this.planeYAt(x, refY);
        const cam = this.cameras.main;
        const rise = Math.min(this.scale.height * 0.32, 230);
        y = Phaser.Math.Clamp(landY - rise, cam.scrollY + 56, landY - 70);
      }
      const spr = this.add.sprite(x, y, key, 0).setDepth(5);
      const angled = origin === "front_up" || origin === "front_down";
      const onGroundProp =
        groundFront ||
        ieyasuNinjas ||
        newtonPull ||
        (!dropping && !angled && (motion === "field" || origin === "feet" || origin === "ahead"));
      const hover = !dropping && !groundFront && !ieyasuNinjas && !newtonPull && (motion === "hover" || origin === "air");
      if (mec.type === "beam") {
        spr.setOrigin(facing > 0 ? 0 : 1, 0.5);
      } else if (ieyasuNinjas) {
        spr.setOrigin(0.5, 0.92);
      } else if (newtonPull) {
        spr.setOrigin(0.5, 0.88);
      } else if (groundFront) {
        spr.setOrigin(ink.originX || 0.5, ink.originY > 0.2 ? ink.originY : 0.92);
      } else if (dropping) {
        spr.setOrigin(0.5, 0.82);
      } else if (origin === "front_up") {
        spr.setOrigin(facing > 0 ? 0.18 : 0.82, 0.55);
      } else if (origin === "front_down") {
        spr.setOrigin(facing > 0 ? 0.12 : 0.88, 0.18);
      } else if (onGroundProp) {
        spr.setOrigin(0.5, ink.originY || 0.92);
      } else if (hover) {
        spr.setOrigin(0.5, 0.72);
      } else if (motion === "fall") {
        spr.setOrigin(0.5, 0.12);
      } else if (motion === "forward" || motion === "up") {
        spr.setOrigin(facing > 0 ? 0.06 : 0.94, 0.5);
      } else {
        spr.setOrigin(ink.originX || 0.5, 0.5);
      }
      const travelAlign = motion === "fall" && !dropping && mec.type === "barrage";
      if (travelAlign) spr.setOrigin(0.5, 0.5);
      if ((ieyasuNinjas || newtonPull) && landY != null) spr.y = landY;
      else if (groundFront && landY != null) spr.y = landY;
      else if (onGroundProp) spr.y = this.groundYAt(x);
      if (origin === "sky" && !jiangStrafe) spr.y = -Math.max(24, spr.displayHeight * 0.42);
      if (travelAlign) spr.setFlipX(false);
      else spr.setFlipX(facing < 0);
      spr.setScale(scale);
      spr.setAlpha(1);
      if (groundFront) {
        const inkH = Math.max(48, ink.h || spr.height * 0.4);
        const fit = Phaser.Math.Clamp((this.scale.height * 0.26) / inkH, 0.18, 1.15);
        spr.setScale(fit);
        if (landY != null) spr.y = landY;
      }
      if (origin === "sky" && !jiangStrafe) spr.y = -Math.max(24, spr.displayHeight * 0.42);
      if (jiangStrafe) {
        const vis = attacker.worldHurt();
        const cam = this.cameras.main;
        spr.x = attacker.sprite.x + facing * 12;
        spr.y = Phaser.Math.Clamp(
          vis.top - Math.max(52, spr.displayHeight * 0.3),
          cam.scrollY + 36,
          vis.top - 8
        );
        const slot = (opts?.index ?? 0) - ((opts?.volley || 1) - 1) / 2;
        spr.y += slot * 26;
      }
      if ((ieyasuNinjas || newtonPull) && landY != null) {
        spr.y = landY;
      }
      if (mec.type === "beam") {
        const len = Math.max(this.scale.width * 0.4, (visDef.hitW || 240) * Math.max(scale, 0.8));
        spr.setDisplaySize(len, Math.max(28, spr.displayHeight * 0.85));
      }
      const solidShot = move === "combo_up" || dropping;
      let useAdd =
        (proj.blend || "add") === "add" &&
        !solidShot &&
        !onGroundProp &&
        !hover &&
        mec.type !== "trap" &&
        mec.type !== "zone";
      if (move === "skill" && this.isLuBuHero(attacker.fighter)) useAdd = false;
      if (useAdd) spr.setBlendMode(Phaser.BlendModes.ADD);
      else spr.setBlendMode(Phaser.BlendModes.NORMAL);
      if (this.anims.exists(key)) {
        // 德川忍者：略慢一档播完即停；寿命对齐动画，避免末帧僵住
        const ninjaFps = ieyasuNinjas ? Math.min(4.2, visDef.fps || 4) : visDef.fps;
        spr.anims.play({ key, repeat: hover || ieyasuNinjas ? 0 : -1, frameRate: ninjaFps });
      }
      const speed = visDef.speed;
      let vx = 0;
      let vy = 0;
      const parkedField =
        groundFront ||
        ieyasuNinjas ||
        (!dropping &&
          (mec.type === "beam" || hover || motion === "field" || mec.type === "zone" || mec.type === "trap"));
      if (parkedField) {
        vx = 0;
        vy = 0;
      } else if (jiangStrafe) {
        vx = facing * Math.max(560, speed);
        vy = 0;
      } else if (dropping) {
        vx = target ? Phaser.Math.Clamp((target.sprite.x - x) * 1.6, -220, 220) : facing * 40;
        vy = Math.max(240, speed * 0.85);
      } else if (motion === "up") {
        vx = facing * speed * 0.12;
        vy = -speed;
      } else if (motion === "fall") {
        vx = facing * Math.max(220, speed * 1.05);
        vy = Math.max(180, speed * 0.72);
      } else {
        vx = facing * speed;
      }
      if (travelAlign) alignTravelSprite(spr, vx, vy);
      const lingerFall = false;
      const persist =
        !ieyasuNinjas &&
        (dropping ||
          mec.type === "zone" ||
          mec.type === "trap" ||
          mec.type === "beam" ||
          motion === "field" ||
          hover ||
          (motion === "fall" && visDef.screen >= 0.24));
      const pulseMs = persist
        ? newtonPull
          ? 70
          : dropping
            ? 280
            : 420
        : 0;
      const lifeMs = dropping
        ? Math.max(visDef.life || 1400, 1800)
        : hover
          ? Math.max(visDef.life, 1400)
          : mec.type === "beam"
            ? Math.min(proj.life || 420, 480)
            : jiangStrafe
              ? Math.max(visDef.life || 1400, 2600)
              : ieyasuNinjas
                ? Math.round((4 / 4.2) * 1000) + 50
                : newtonPull
                  ? Math.max(500, visDef.life || 800)
                  : visDef.life;
      const ticks = persist ? Math.max(mec.ticks || 1, Math.ceil(lifeMs / Math.max(280, pulseMs || 420))) : mec.ticks || 1;
      const hitScale = persist && mec.type !== "beam" ? 1 : scale;
      const fieldW = Math.max(this.scale.width * 0.42, visDef.hitW || 280);
      const fieldH = Math.max(this.scale.height * 0.38, visDef.hitH || 220);
      const volley = Math.max(1, opts?.volley || 1);
      const rawDmg = newtonPull ? 0 : moveDamage(move);
      const damage = newtonPull ? 0 : volley > 1 ? Math.max(3, Math.round((rawDmg * 1.05) / volley)) : rawDmg;
      const isSmall = visDef.screen <= 0.14;
      let hitW;
      let hitH;
      if (mec.type === "beam") {
        hitW = spr.displayWidth;
        hitH = Math.max(36, spr.displayHeight * 0.7);
      } else if (hover) {
        hitW = Math.max(90, spr.displayWidth * 0.7);
        hitH = Math.max(90, spr.displayHeight * 0.7);
      } else if (dropping) {
        hitW = Math.max(80, spr.displayWidth * 0.62);
        hitH = Math.max(70, spr.displayHeight * 0.55);
      } else if (motion === "field") {
        hitW = newtonPull ? this.scale.width * 1.25 : fieldW;
        hitH = newtonPull ? this.scale.height * 1.15 : fieldH;
      } else if (motion === "fall") {
        hitW = Math.max(visDef.hitW || 72, spr.displayWidth * 0.92);
        hitH = Math.max(visDef.hitH || 56, spr.displayHeight * 0.82);
      } else if (isSmall) {
        hitW = Math.max(24, visDef.hitW * Math.max(0.55, hitScale));
        hitH = Math.max(20, visDef.hitH * Math.max(0.55, hitScale));
      } else {
        hitW = Math.max(72, visDef.hitW * hitScale);
        hitH = Math.max(56, visDef.hitH * hitScale);
      }
      if (move === "skill" && this.isLuBuHero(attacker.fighter)) {
        const bodyDisp = this.actorBodyDisp(attacker);
        const atkReach = Number(attacker.fighter?.moves?.attack?.reach) || REACH.attack || 72;
        const weaponLen = Math.max(bodyDisp * 0.98, atkReach * Math.abs(attacker.displayScale || attacker.baseScale || 1) * 1.12);
        hitW = Math.max(weaponLen * 0.86, spr.displayWidth * 0.9);
        hitH = Math.max(bodyDisp * 0.34, spr.displayHeight * 0.74);
      }
      const lubuSkill = move === "skill" && this.isLuBuHero(attacker.fighter);
      const jiangFrontLine = move === "combo_down" && this.isJiangHero(attacker.fighter);
      this.projectiles.push({
        sprite: spr,
        owner: attacker,
        move,
        facing,
        vx,
        vy,
        gravity: dropping
          ? Math.max(420, visDef.gravity || 560)
          : hover || groundFront || motion === "field" || mec.type === "beam" || jiangStrafe || ieyasuNinjas
            ? 0
            : visDef.gravity || (motion === "fall" ? 280 : 0),
        motion: dropping ? "fall" : groundFront || ieyasuNinjas ? "field" : motion,
        kind: mec.type,
        persist,
        lingerFall,
        hover,
        extras: [],
        fullscreen: false,
        screenSpace: false,
        falling: dropping,
        travelAlign,
        strafe: jiangStrafe,
        onceBurst: ieyasuNinjas,
        _burstSeenPlay: false,
        landY,
        homeTarget: dropTarget,
        detonateOnLast: hover,
        bombDrop: false,
        pierce: lubuSkill || jiangFrontLine ? true : dropping || mec.pierce || mec.type === "beam" || persist,
        luBuSkillPierce: lubuSkill,
        jiangFrontLine,
        forwardOnly: lubuSkill,
        homing: dropping ? 7 : move === "super" ? 0 : mec.homing || 0,
        ticksLeft: lubuSkill ? 99 : ticks,
        pulseMs,
        hitCd: {},
        diesAt: this.time.now + lifeMs,
        hit: false,
        damage,
        hitSpec: moveHit(move),
        effect: newtonPull ? "pull" : isSuperMove(move) ? "launch" : "none",
        effectStrength: newtonPull ? 1.4 : isSuperMove(move) ? 1 : 0,
        pullField: newtonPull,
        ailment: "none",
        dmgBudget: lubuSkill ? damage * 12 : newtonPull ? 0 : persist ? (isSuperMove(move) ? moveDamage("super") * 1.35 : moveDamage(move) * 2.2) : damage,
        hitW,
        hitH,
      });
    }

    projectileHitBox(shot) {
      const spr = shot.sprite;
      if (shot.rainCurtain) {
        const cam = this.cameras.main;
        const w = Math.max(40, shot.hitW || this.scale.width * 0.23);
        const h = this.scale.height;
        return new Phaser.Geom.Rectangle(spr.x - w / 2, cam.scrollY, w, h);
      }
      // 奥义：粒子墨迹碰到人才受伤。空白帧不打；不要用工坊 hitW(霍金 44px)把盒子收没。
      if (isSuperMove(shot.move)) {
        let box = spriteInkWorldRect(this, spr, 8, 26);
        if (shot.screenSpace || spr.scrollFactorX === 0) {
          const cam = this.cameras.main;
          box = new Phaser.Geom.Rectangle(box.x + cam.scrollX, box.y + cam.scrollY, box.width, box.height);
        }
        const cellW = Math.max(8, Math.abs(spr.displayWidth) || box.width);
        const cellH = Math.max(8, Math.abs(spr.displayHeight) || box.height);
        // 扫描失败/整格不透明时，收到贴图几何中心，避免再扫到远处空白
        if (box.width >= cellW * 0.88 && box.height >= cellH * 0.88) {
          const face = (shot.facing || 1) >= 0 ? 1 : -1;
          const cx = spr.x + face * (0.5 - (spr.originX ?? 0.5)) * cellW;
          const cy = spr.y + (0.5 - (spr.originY ?? 0.5)) * cellH;
          const w = cellW * 0.58;
          const h = cellH * 0.62;
          box = new Phaser.Geom.Rectangle(cx - w / 2, cy - h / 2, w, h);
        }
        return box;
      }
      if (shot.screenSpace) {
        const cam = this.cameras.main;
        const wx = cam.scrollX + spr.x;
        const wy = cam.scrollY + spr.y;
        return new Phaser.Geom.Rectangle(wx - shot.hitW / 2, wy - shot.hitH / 2, shot.hitW, shot.hitH);
      }
      if (shot.kind === "beam") {
        const face = (shot.facing || 1) >= 0 ? 1 : -1;
        const w = Math.max(shot.hitW || 0, spr.displayWidth || 0, 120);
        const h = Math.max(48, shot.hitH || 36, spr.displayHeight * 0.55);
        const left = face > 0 ? spr.x : spr.x - w;
        return new Phaser.Geom.Rectangle(left, spr.y - h / 2, w, h);
      }
      const visW = Math.max(shot.hitW, spr.displayWidth * (shot.motion === "fall" ? 0.95 : 0.8));
      const visH = Math.max(shot.hitH, spr.displayHeight * (shot.motion === "fall" ? 0.88 : 0.75));
      if (shot.move === "combo_up") {
        if (shot.pullField) {
          // 牛顿上+K：全屏判定
          const cam = this.cameras.main;
          return new Phaser.Geom.Rectangle(
            cam.scrollX - 80,
            cam.scrollY - 80,
            this.scale.width + 160,
            this.scale.height + 160
          );
        }
        if (shot.luBuOrbit && shot.owner) {
          const bodyDisp = this.actorBodyDisp(shot.owner);
          const cx = shot.owner.sprite.x;
          const cy = shot.owner.sprite.y - bodyDisp * 0.44;
          const w = Math.max(shot.hitW || 0, bodyDisp * 1.85);
          const h = Math.max(shot.hitH || 0, bodyDisp * 1.75);
          return new Phaser.Geom.Rectangle(cx - w / 2, cy - h * 0.78, w, h);
        }
        const w = Math.max(90, visW * 0.7);
        const h = Math.max(90, visH * 0.75);
        return new Phaser.Geom.Rectangle(spr.x - w / 2, spr.y - h * 0.72, w, h);
      }
      if (shot.move === "combo_down") {
        if (shot.jiangFrontLine) {
          const face = (shot.facing || 1) >= 0 ? 1 : -1;
          const lineY = shot.landY ?? spr.y;
          const h = Math.max(64, shot.hitH || 88);
          const worldRight = (this.worldW || this.scale.width) + 80;
          const reach = Math.max(this.scale.width * 0.92, worldRight - spr.x, spr.x + 80);
          const w = reach;
          const left = face > 0 ? spr.x : spr.x - w;
          return new Phaser.Geom.Rectangle(left, lineY - h, w, h + 18);
        }
        if (shot.luBuGroundWave) {
          const extent = Math.max(shot.hitW || 48, spr.displayWidth * 0.92);
          const h = Math.max(shot.hitH || 28, spr.displayHeight * 0.72);
          const y = shot.landY ?? spr.y;
          const face = (shot.facing || 1) >= 0 ? 1 : -1;
          const nearX = shot.waveNearX ?? spr.x;
          const pad = Math.max(28, extent * 0.1);
          const left = face > 0 ? nearX - pad : nearX - extent - pad;
          const w = extent + pad * 2;
          return new Phaser.Geom.Rectangle(left, y - h, w, h + 14);
        }
        const w = Math.max(80, visW * 0.62);
        const h = Math.max(70, visH * 0.55);
        if (shot.falling) {
          return new Phaser.Geom.Rectangle(spr.x - w / 2, spr.y - h * 0.85, w, h);
        }
        const floorY = shot.landY ?? this.groundYAt(spr.x);
        return new Phaser.Geom.Rectangle(spr.x - w / 2, floorY - h, w, h + 18);
      }
      if (shot.hover && !shot.bombDrop) {
        return new Phaser.Geom.Rectangle(spr.x - visW / 2, spr.y - visH * 0.85, visW, visH);
      }
      if (shot.motion === "field" || shot.kind === "zone" || shot.kind === "trap") {
        const w = Math.max(visW, spr.displayWidth * 0.85);
        const h = Math.max(shot.hitH * 0.55, Math.min(this.scale.height * 0.42, spr.displayHeight * 0.7));
        const floorY = shot.landY ?? this.groundYAt(spr.x);
        return new Phaser.Geom.Rectangle(spr.x - w / 2, floorY - h, w, h + 24);
      }
      const left = spr.x - visW * (spr.originX ?? 0.5);
      const top = spr.y - visH * (spr.originY ?? 0.5);
      if (shot.luBuCharge) {
        const w = Math.max(shot.hitW || 120, spr.displayWidth * 0.82);
        const h = Math.max(shot.hitH || 90, spr.displayHeight * 0.72);
        return new Phaser.Geom.Rectangle(spr.x - w / 2, spr.y - h * 0.88, w, h);
      }
      if (shot.luBuSkillPierce) {
        const w = Math.max(shot.hitW || 72, spr.displayWidth * 0.92);
        const h = Math.max(shot.hitH || 56, spr.displayHeight * 0.82);
        const prevX = shot._segPrev?.x ?? spr.x;
        const prevY = shot._segPrev?.y ?? spr.y;
        const face = (shot.facing || 1) >= 0 ? 1 : -1;
        const padX = Math.max(36, w * 0.18);
        const minX = Math.min(prevX, spr.x) - padX;
        const maxX = Math.max(prevX, spr.x) + padX + (face > 0 ? w * 0.08 : w * 0.08);
        const minY = Math.min(prevY, spr.y) - h / 2;
        const maxY = Math.max(prevY, spr.y) + h / 2;
        return new Phaser.Geom.Rectangle(minX, minY, Math.max(w, maxX - minX), Math.max(h, maxY - minY));
      }
      return new Phaser.Geom.Rectangle(left, top, visW, visH);
    }

    destroyShot(shot) {
      if (shot?.yearZeroBind && shot.lockTarget) {
        const t = shot.lockTarget;
        if (t.wireBindShot === shot) {
          t.wireBindShot = null;
          if (this.time.now < (t.rootedUntil || 0)) t.rootedUntil = this.time.now;
        }
      }
      if (shot?.domainField && shot.owner) {
        shot.owner.domainNoDashUntil = 0;
      }
      if (shot?.luBuCharge && shot.owner && !shot._luBuChargeCounted) {
        shot._luBuChargeCounted = true;
        this.noteLuBuChargeEnded(shot.owner);
      }
      if (shot?.sprite) {
        try {
          this.tweens.killTweensOf(shot.sprite);
          shot.sprite.clearMask?.(true);
        } catch {
          /* ignore */
        }
      }
      if (shot?.domainHaze) {
        try {
          this.tweens.killTweensOf(shot.domainHaze);
        } catch {
          /* ignore */
        }
      }
      try {
        shot?.sprite?.destroy();
      } catch {
        /* ignore */
      }
      (shot?.extras || []).forEach((spr) => {
        try {
          spr.destroy();
        } catch {
          /* ignore */
        }
      });
      if (shot) shot.extras = [];
    }

    /** 冲刺穿背躲大招：正对来招时按下冲刺，且下一帧会到施术者背后 */
    canDashBehindSuper(attacker, defender) {
      if (!attacker || !defender || defender.ko) return false;
      if (this.superStyle(attacker.fighter) === "lockburst") return false;
      if (this.superStyle(attacker.fighter) === "domain") return false;
      if (defender.move !== "dash") return false;
      const ax = attacker.sprite.x;
      const dx = defender.sprite.x;
      const face = attacker.facing || 1;
      // 当前仍在施术者面前（被面朝的一侧）
      if ((dx - ax) * face <= 12) return false;
      const dt = Math.max(1 / 60, this.game.loop.delta / 1000);
      const nextX = dx + defender.sprite.body.velocity.x * dt;
      // 下一帧到背后
      return (nextX - ax) * face < -8;
    }

    applyGravityPull(shot, target) {
      if (!target || target.ko || target.invulnerable()) return;
      const owner = shot.owner;
      if (!owner || owner.ko) return;
      const now = this.time.now;
      target.pitFalling = false;
      target.willKnockdown = false;
      target.airFalling = false;
      target.downedUntil = 0;
      const body = target.sprite.body;
      if (body) {
        body.checkCollision.none = true;
        body.setAllowGravity(false);
        body.blocked.down = false;
        body.touching.down = false;
      }
      target.pullPhaseUntil = now + 160;
      const tx = owner.sprite.x;
      const ty = owner.sprite.y - 18;
      const dx = tx - target.sprite.x;
      const dy = ty - target.sprite.y;
      const dist = Math.hypot(dx, dy) || 1;
      const nx = dx / dist;
      const ny = dy / dist;
      // 无视高台/深坑：直接拽位移 + 速度，穿地形吸到牛顿身边
      const step = Math.min(42, Math.max(14, dist * 0.22));
      target.sprite.x += nx * step;
      target.sprite.y += ny * step;
      const pullSp = dist > 280 ? 980 : 720;
      target.sprite.setVelocity(nx * pullSp, ny * pullSp);
      target.stunUntil = Math.max(target.stunUntil || 0, now + 280);
      target.busy = true;
      target.displayScale = target.baseScale;
      target.syncFacingVisual(target.baseScale);
      // 吸附也要播受击，避免“拽过来没反馈”
      {
        const pose = target.has("air_hurt") && Math.abs(dy) > 40 ? "air_hurt" : "hurt";
        if (target.has(pose)) {
          target.startMove(pose, { busy: true });
          target.displayScale = target.baseScale;
          target.syncFacingVisual(target.baseScale);
          target.sprite.anims.pause();
        }
      }
      if (dist < 56) {
        target.sprite.x = Phaser.Math.Linear(target.sprite.x, tx, 0.35);
        target.sprite.y = Phaser.Math.Linear(target.sprite.y, ty, 0.35);
        target.sprite.setVelocity(nx * 120, Math.min(-40, ny * 80));
      }
    }

    applyShotHit(shot, target, repeat) {
      if (!target || target.ko || target.invulnerable()) return;
      if (
        isSuperMove(shot.move) &&
        !shot.lockBurst &&
        !shot.domainField &&
        this.canDashBehindSuper(shot.owner, target)
      ) {
        target.invulnUntil = Math.max(target.invulnUntil || 0, this.time.now + 420);
        return;
      }
      if (shot.pullField || (shot.effect === "pull" && !(shot.damage > 0))) {
        this.applyGravityPull(shot, target);
        return;
      }
      const base = moveDamage(shot.move);
      let dmg = repeat ? Math.max(2, Math.round(base * 0.2)) : shot.damage || base;
      if (shot.dmgBudget != null) {
        if (shot.dmgBudget <= 0) return;
        dmg = Math.min(dmg, shot.dmgBudget);
        shot.dmgBudget -= dmg;
      }
      const baseHit = moveHit(shot.move);
      const launchHit = shot.luBuGroundWave
        ? { knock: 340, lift: -680, stun: 0, knockdown: true, stop: 42 }
        : repeat
          ? { ...baseHit, knockdown: false, lift: Math.max(-40, baseHit.lift), knock: 120, stun: Math.max(220, baseHit.stun || 0) }
          : { ...baseHit, stun: Math.max(340, baseHit.stun || 0) };
      const fromSpec = {
        damage: dmg,
        hit: launchHit,
        effect: shot.luBuGroundWave ? "launch" : isSuperMove(shot.move) ? "launch" : "none",
        effectStrength: shot.luBuGroundWave ? 1.2 : isSuperMove(shot.move) ? 1 : 0,
        ailment: "none",
      };
      const blocked = this.isGuarding(target) && !isSuperMove(shot.move);
      this.impactAt(target.sprite.x, target.sprite.y - 40, hitSfxKind(shot.move, blocked));
      if (blocked) {
        this.applyBlockedHit(target, shot.owner, shot.move, dmg);
        return;
      }
      if (!repeat) this.cameras.main.shake(isSuperMove(shot.move) ? 80 : 40, 0.003);
      const hitDir =
        (Number.isFinite(shot.facing) && shot.facing !== 0 ? Math.sign(shot.facing) : 0) ||
        shot.owner?.strikeFacing?.() ||
        1;
      const hpBefore = target.hp;
      target.takeHit(shot.move, hitDir, fromSpec);
      const steal = Number(shot.lifesteal) || 0;
      if (steal > 0 && shot.owner && !shot.owner.ko) {
        // 木桩无限血时仍按本次伤害结算吸血；实战按实际掉血
        const lost = target.infinite ? dmg : Math.max(0, hpBefore - target.hp);
        if (lost > 0) {
          const heal = Math.max(1, Math.round(lost * steal));
          if (!shot.owner.infinite) {
            shot.owner.hp = Math.min(shot.owner.maxHp, shot.owner.hp + heal);
          }
          this.floatHeal(shot.owner, heal);
        }
      }
      this.gainMpFromLight(shot.move, shot.owner, target, repeat ? 0 : 10, repeat ? 0 : 8);
    }

    updateProjectiles() {
      const now = this.time.now;
      const dt = this.game.loop.delta / 1000;
      const survivors = [];
      for (const shot of this.projectiles || []) {
        if (!shot.sprite || !shot.sprite.active) {
          this.destroyShot(shot);
          continue;
        }
        shot._segPrev = { x: shot.sprite.x, y: shot.sprite.y };
        const homingTarget =
          shot.homeTarget && !shot.homeTarget.ko
            ? shot.homeTarget
            : (shot.hover && !shot.bombDrop) ||
                shot.move === "super" ||
                shot.fullscreen ||
                shot.lockBurst ||
                shot.screenSpace
              ? null
              : this.nearestFoe(shot.owner);
        if ((shot.homing > 0 || shot.bombDrop) && homingTarget) {
          const dx = homingTarget.sprite.x - shot.sprite.x;
          const dy = homingTarget.sprite.y - 36 - shot.sprite.y;
          if (shot.bombDrop) {
            const ang = Math.atan2(dy, dx);
            const sp = Math.max(220, Math.hypot(shot.vx, shot.vy) || 280);
            const t = Math.min(1, 8 * dt);
            shot.vx += (Math.cos(ang) * sp - shot.vx) * t;
            shot.vy += (Math.sin(ang) * Math.max(sp, 260) - shot.vy) * t;
          } else if (shot.motion === "fall" || shot.falling) {
            shot.vx += dx * Math.min(1, shot.homing * 0.25 * dt);
            shot.vx = Phaser.Math.Clamp(shot.vx, -260, 260);
          } else {
            const ang = Math.atan2(dy, dx);
            const sp = Math.max(80, Math.hypot(shot.vx, shot.vy) || 400);
            const t = Math.min(1, shot.homing * dt);
            shot.vx += (Math.cos(ang) * sp - shot.vx) * t;
            shot.vy += (Math.sin(ang) * sp - shot.vy) * t;
          }
        }
        if (shot.lockBurst) {
          const tgt = shot.lockTarget && !shot.lockTarget.ko ? shot.lockTarget : this.nearestFoe(shot.owner);
          shot.lockTarget = tgt;
          if (tgt) {
            const k = Math.min(1, 14 * dt);
            shot.sprite.x += (tgt.sprite.x - shot.sprite.x) * k;
            shot.sprite.y += (tgt.sprite.y - 52 - shot.sprite.y) * k;
          }
          if (!shot.lockExploded && now >= shot.lockExplodeAt) {
            shot.lockExploded = true;
            shot.persist = true;
            shot.pulseMs = 80;
            shot.ticksLeft = 3;
            shot.hitW = Math.max(220, shot.sprite.displayWidth * 1.05);
            shot.hitH = Math.max(220, shot.sprite.displayHeight * 1.05);
            shot.diesAt = now + 420;
          }
        }
        if (shot.luBuOrbit && shot.owner) {
          if (shot.owner.ko) {
            this.destroyShot(shot);
            continue;
          }
          shot.orbitAngle = (shot.orbitAngle || 0) + (shot.orbitSpeed || 4.6) * dt;
          const bodyDisp = this.actorBodyDisp(shot.owner);
          const r = shot.orbitRadius || bodyDisp * 0.62;
          const cx = shot.owner.sprite.x;
          const cy = shot.owner.sprite.y - bodyDisp * 0.48;
          shot.sprite.x = cx + Math.cos(shot.orbitAngle) * r;
          shot.sprite.y = cy + Math.sin(shot.orbitAngle) * r * 0.52 - bodyDisp * 0.06;
          shot.facing = shot.owner.facing || shot.facing || 1;
          shot.sprite.setFlipX((shot.facing || 1) < 0);
        }
        if (shot.rainCurtain && shot.sprite?.active) {
          const cam = this.cameras.main;
          const viewH = this.scale.height;
          const colW = shot.rainColW || this.scale.width * 0.25;
          const sheetH = viewH * 1.65;
          shot.sprite.setOrigin(0.5, 0);
          shot.sprite.setDisplaySize(colW, sheetH);
          shot.hitW = colW * 0.92;
          shot.hitH = viewH;
          shot.rainScroll = (shot.rainScroll || 0) + dt * 680;
          const loop = viewH * 0.62;
          const fall = shot.rainScroll % loop;
          shot.sprite.y = cam.scrollY - viewH * 0.55 + fall;
          if (shot.vx) shot.sprite.x += shot.vx * dt;
        }
        if (shot.followOwner && shot.owner) {
          if (shot.owner.ko) {
            this.destroyShot(shot);
            continue;
          }
          const fx = shot.owner.sprite.x;
          const fy = shot.owner.sprite.y - (shot.followY || 72);
          shot.sprite.x = fx;
          shot.sprite.y = fy;
          shot.facing = shot.owner.facing || shot.facing || 1;
          if (shot.softMask?.active) {
            shot.softMask.x = fx;
            shot.softMask.y = fy;
          }
          if (shot.domainHaze?.active) {
            shot.domainHaze.x = fx;
            shot.domainHaze.y = fy;
          }
        }
        if (shot.onceBurst) {
          const playing = !!shot.sprite.anims?.isPlaying;
          if (playing) shot._burstSeenPlay = true;
          else if (shot._burstSeenPlay) {
            this.destroyShot(shot);
            continue;
          }
        }
        const parked =
          shot.fullscreen ||
          shot.lockBurst ||
          shot.onceBurst ||
          (shot.hover && !shot.bombDrop) ||
          shot.kind === "beam" ||
          (!shot.falling && (shot.motion === "field" || shot.kind === "zone" || shot.kind === "trap"));
        if (!parked) {
          shot.vy += (shot.gravity || 0) * dt;
          shot.sprite.x += shot.vx * dt;
          shot.sprite.y += shot.vy * dt;
        }
        if (shot.luBuCharge) {
          const groundY = this.spawnFloorY(shot.sprite.x) ?? this.groundYAt(shot.sprite.x);
          this.pinProjFeetToGround(shot.sprite, groundY, shot.feetProj);
          shot.landY = groundY;
          if (
            (shot.facing > 0 && shot.sprite.x >= (shot.chargeEndX || 0)) ||
            (shot.facing < 0 && shot.sprite.x <= (shot.chargeEndX || 0))
          ) {
            this.destroyShot(shot);
            continue;
          }
        }
        if (shot.travelAlign && (shot.vx || shot.vy) && !shot.fullscreen && !shot.falling) {
          alignTravelSprite(shot.sprite, shot.vx, shot.vy);
        }
        if (shot.screenSpace) {
          const camW = this.scale.width;
          const camH = this.scale.height;
          if (shot.sprite.x < -240 || shot.sprite.x > camW + 240 || shot.sprite.y > camH + 200) {
            this.destroyShot(shot);
            continue;
          }
        } else if (shot.strafe) {
          const cam = this.cameras.main;
          const camW = this.scale.width;
          if (shot.sprite.x < cam.scrollX - 280 || shot.sprite.x > cam.scrollX + camW + 280) {
            this.destroyShot(shot);
            continue;
          }
        }
        const floorY = shot.landY ?? this.groundYAt(shot.sprite.x);
        if (
          !shot.fullscreen &&
          !shot.screenSpace &&
          !shot.lockBurst &&
          !shot.travelAlign &&
          !shot.hawkingTrap &&
          (shot.motion === "fall" || shot.bombDrop || shot.falling) &&
          shot.sprite.y >= floorY
        ) {
          shot.sprite.y = floorY;
          shot.vx = 0;
          shot.vy = 0;
          shot.gravity = 0;
          shot.sprite.setRotation(0);
          if (shot.falling) {
            shot.falling = false;
            shot.motion = "field";
            shot.persist = true;
            shot.pulseMs = 420;
            shot.ticksLeft = Math.max(shot.ticksLeft || 1, 4);
            shot.diesAt = now + 1400;
            shot.sprite.setOrigin(0.5, 0.92);
          } else {
            if (!shot.landedAt) shot.landedAt = now;
            if (shot.bombDrop) shot.armedBomb = true;
            if (!shot.persist && now - shot.landedAt > (shot.bombDrop ? 180 : 360)) {
              this.destroyShot(shot);
              continue;
            }
          }
        }
        if (
          !shot.fullscreen &&
          !shot.screenSpace &&
          !shot.persist &&
          !shot.hover &&
          !shot.bombDrop &&
          !shot.falling &&
          !shot.lockBurst &&
          !shot.hawkingTrap &&
          shot.sprite.y > floorY + 36
        ) {
          this.destroyShot(shot);
          continue;
        }
        if (now >= shot.diesAt) {
          this.destroyShot(shot);
          continue;
        }
        // 吕布脚下地裂波：贴地延伸，接触击飞
        if (shot.luBuGroundWave) {
          if (shot.sprite?.active && Number.isFinite(shot.landY)) {
            shot.sprite.y = shot.landY;
          }
        }
        // 霍金小黑洞陷阱
        if (shot.hawkingTrap) {
          const floorY = shot.landY ?? this.groundYAt(shot.sprite.x);
          if (shot.falling && shot.sprite.y >= floorY) {
            shot.sprite.y = floorY;
            shot.vx = 0;
            shot.vy = 0;
            shot.gravity = 0;
            shot.falling = false;
            shot.trapArmed = true;
            shot.trapExpireAt = now + 3000;
            try {
              shot.sprite.anims?.pause();
              shot.sprite.setFrame(0);
            } catch {
              /* ignore */
            }
          }
          if (shot.trapExploding) {
            const playing = !!shot.sprite.anims?.isPlaying;
            if (!playing || now >= (shot.trapBoomAt || 0)) {
              this.destroyShot(shot);
              continue;
            }
            survivors.push(shot);
            continue;
          }
          if (shot.trapArmed) {
            if (now >= (shot.trapExpireAt || 0)) {
              if (!shot.trapFlickerStarted) {
                shot.trapFlickerStarted = true;
                shot.trapFlickerDoneAt = now + 850;
                try {
                  shot.sprite.setFrame(0);
                  this.tweens.add({
                    targets: shot.sprite,
                    alpha: 0.15,
                    duration: 140,
                    yoyo: true,
                    repeat: 4,
                  });
                } catch {
                  /* ignore */
                }
              }
              if (now >= (shot.trapFlickerDoneAt || 0)) {
                this.destroyShot(shot);
                continue;
              }
              survivors.push(shot);
              continue;
            }
            const box = this.projectileHitBox(shot);
            for (const target of this.fighters()) {
              if (target === shot.owner || target.ko) continue;
              const hurt = target.worldHurt();
              Phaser.Geom.Rectangle.Inflate(hurt, 10, 8);
              if (!Phaser.Geom.Rectangle.Overlaps(box, hurt)) continue;
              shot.trapExploding = true;
              shot.trapBoomAt = now + 480;
              const key = shot.sprite.texture?.key;
              try {
                if (key && this.anims.exists(key)) {
                  shot.sprite.anims.play({ key, repeat: 0, frameRate: 12 });
                }
              } catch {
                /* ignore */
              }
              this.applyShotHit(shot, target, false);
              break;
            }
            survivors.push(shot);
            continue;
          }
          // still falling
          shot.vy += (shot.gravity || 0) * dt;
          shot.sprite.x += shot.vx * dt;
          shot.sprite.y += shot.vy * dt;
          survivors.push(shot);
          continue;
        }
        // 波尔布特荆棘铁丝网：固定在地表；仅脚踩到该层才缠绕禁锢
        if (shot.yearZeroBind) {
          if (shot.sprite?.active && Number.isFinite(shot.landY)) {
            shot.sprite.y = shot.landY;
            shot.sprite.x = shot.lockX ?? shot.sprite.x;
          }
          if (!shot.bindApplied) {
            const box = this.projectileHitBox(shot);
            for (const target of this.fighters()) {
              if (target === shot.owner || target.ko) continue;
              if (!this.feetOnWireGround(target, shot.landY)) continue;
              const hurt = target.worldHurt();
              Phaser.Geom.Rectangle.Inflate(hurt, 10, 6);
              if (!Phaser.Geom.Rectangle.Overlaps(box, hurt)) continue;
              this.applyYearZeroWireRoot(shot, target, shot.damage || 10);
              break;
            }
          }
          survivors.push(shot);
          continue;
        }
        // 去城市化等领域：只占位/禁蓝，不造成弹道伤害
        if (shot.domainHarmless || shot.domainField) {
          survivors.push(shot);
          continue;
        }
        if (shot.lockBurst && !shot.lockExploded) {
          survivors.push(shot);
          continue;
        }
        let armed = true;
        if (shot.detonateOnLast) {
          const anim = shot.sprite.anims;
          const total = anim?.currentAnim?.frames?.length || 4;
          const idx = anim?.currentFrame?.index ?? 0;
          const last = !anim.isPlaying || idx >= total - 1;
          if (last) {
            if (anim.isPlaying) anim.pause();
            armed = true;
          } else {
            armed = false;
          }
        }
        if (!armed) {
          survivors.push(shot);
          continue;
        }
        if (shot.detonateOnLast && shot.burstDone) {
          survivors.push(shot);
          continue;
        }
        const pulsing = !!shot.persist && !shot.detonateOnLast && !shot.bombDrop;
        if (!pulsing && shot.hit && !shot.bombDrop) {
          survivors.push(shot);
          continue;
        }
        const box = this.projectileHitBox(shot);
        let consumed = false;
        let burstHit = false;
        for (const target of this.fighters()) {
          if (target === shot.owner || target.ko) continue;
          if (shot.jiangFrontLine) {
            const face = shot.facing || 1;
            const lineY = shot.landY ?? shot.sprite.y;
            if ((target.sprite.x - shot.sprite.x) * face <= 8) continue;
            if (Math.abs((target.sprite.y || 0) - lineY) > 56) continue;
          }
          if (shot.forwardOnly && shot.owner) {
            const face = shot.facing || shot.owner.facing || 1;
            const fromX = shot.hawkingSuper ? shot.sprite.x : shot.owner.sprite.x;
            const behind = shot.hawkingSuper ? -36 : 12;
            if ((target.sprite.x - fromX) * face <= behind) continue;
          }
          const hurt = target.worldHurt();
          const padX = isSuperMove(shot.move) ? 6 : 18;
          const padY = isSuperMove(shot.move) ? 6 : 12;
          if (padX || padY) Phaser.Geom.Rectangle.Inflate(hurt, padX, padY);
          if (!Phaser.Geom.Rectangle.Overlaps(box, hurt)) continue;
          if (shot.luBuSkillPierce) {
            if (shot.hitCd?.[target.prefix]) continue;
            shot.hitCd[target.prefix] = now;
            this.applyShotHit(shot, target, false);
            this.spawnLuBuSkillHitFx(shot, target);
            continue;
          }
          if (shot.detonateOnLast) {
            this.applyShotHit(shot, target, false);
            burstHit = true;
            continue;
          }
          if (shot.bombDrop) {
            this.applyShotHit(shot, target, false);
            shot.hit = true;
            this.destroyShot(shot);
            consumed = true;
            break;
          }
          if (pulsing) {
            const last = shot.hitCd?.[target.prefix];
            // 未命中过时 last 为 undefined；勿用 0，否则 now-0 < pulseMs 会在整场前几秒误跳过
            if (last != null && now - last < (shot.pulseMs || 420)) continue;
            shot.hitCd[target.prefix] = now;
            this.applyShotHit(shot, target, last != null);
            continue;
          }
          this.applyShotHit(shot, target, false);
          shot.ticksLeft = (shot.ticksLeft || 1) - 1;
          // 德川忍者：命中后仍播完残影/粒子，不立刻销毁
          if (shot.onceBurst) {
            shot.hit = true;
            break;
          }
          if (!shot.pierce || shot.ticksLeft <= 0) {
            shot.hit = true;
            this.destroyShot(shot);
            consumed = true;
            break;
          }
        }
        if (shot.detonateOnLast) {
          if (burstHit) {
            shot.burstDone = true;
            shot.diesAt = Math.min(shot.diesAt, now + 220);
          } else if (!shot.bombDrop) {
            shot.bombDrop = true;
            shot.hover = false;
            shot.detonateOnLast = false;
            shot.gravity = 980;
            shot.vy = 120;
            shot.vx = shot.facing * 40;
            shot.diesAt = now + 1600;
            shot.sprite.setRotation(0);
          }
        }
        if (consumed || !shot.sprite || !shot.sprite.active) continue;
        survivors.push(shot);
      }
      this.projectiles = survivors;
      this.refreshDomainMpBan();
    }

    fitResultTitle(label, mood) {
      const w = this.scale.width;
      const maxW = w * 0.9;
      const maxH = this.scale.height * 0.28;
      const win = mood === "win";
      const lose = mood === "lose";
      const fill = win ? "#f3e6c0" : lose ? "#f2d8d0" : "#e0e0e0";
      const stroke = win ? "#3a2a10" : lose ? "#3a0c0c" : "#1a1a1a";
      let size = label.includes("\n") ? 132 : 196;
      const minSize = 56;
      this.result.setFontFamily(BRUSH_FONT).setColor(fill).setStroke(stroke, 6).setAlign("center").setLineSpacing(10);
      do {
        this.result.setFontSize(size).setText(label);
        const strokeW = Math.max(3, Math.round(size / 28));
        this.result.setStroke(stroke, strokeW);
      } while ((this.result.width > maxW || this.result.height > maxH) && (size -= 8) >= minSize);
      const padW = Math.min(w * 0.94, Math.max(420, this.result.width + 96));
      const padH = Math.max(180, this.result.height + 72);
      return { padW, padH };
    }

    paintResultTitle(label, mood) {
      const w = this.scale.width;
      const h = this.scale.height;
      this.resultWash?.clear();
      if (mood === "info") {
        this.result.setFontFamily(UI_FONT).setFontSize(52).setColor("#f2e6c4").setStroke("#000", 8);
        this.result.setText(label).setAlpha(1).setScale(1);
        this.resultWash?.setAlpha(0);
        return;
      }
      const win = mood === "win";
      const lose = mood === "lose";
      const fill = win ? 0xc4a050 : lose ? 0x8a1820 : 0x6a6a70;
      const { padW, padH } = this.fitResultTitle(label, mood);
      this.resultWash.fillStyle(fill, 0.22);
      this.resultWash.fillEllipse(w / 2, h * 0.46, padW, padH);
      this.resultWash.fillStyle(fill, 0.1);
      this.resultWash.fillEllipse(w / 2 + Math.min(80, padW * 0.12), h * 0.5, padW * 0.42, padH * 0.42);
      this.resultWash.setAlpha(1);
      this.result.setAlpha(0).setScale(0.86);
      if (this.result.texture?.setFilter) this.result.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
      this.tweens.add({
        targets: this.result,
        alpha: 1,
        scale: 1,
        duration: 640,
        ease: "Cubic.easeOut",
      });
    }

    announceResult() {
      if (this.resultShown || !this.result) return;
      this.resultShown = true;
      const mine = this.myActor();
      let winMine = false;
      let loseMine = false;
      if (this.cricket) {
        const winner = !this.p1.ko && this.p2.ko ? this.p1 : !this.p2.ko && this.p1.ko ? this.p2 : null;
        this.paintResultTitle(winner ? `${winner.fighter.displayName}\n胜利` : "双倒", winner ? "win" : "draw");
        if (winner) playUiSfx(this, UI_SFX.resultWin, { volume: 0.78 });
        else playUiSfx(this, UI_SFX.resultLose, { volume: 0.45, rate: 0.92 });
      } else {
        if (this.pvpThree) {
          const alive = this.aliveFighters();
          winMine = alive.length === 1 && alive[0] === mine;
          loseMine = mine.ko && !winMine;
        } else if (this.pvp) {
          winMine =
            this.seat === "host" ? this.p2.ko && !this.p1.ko : this.p1.ko && !this.p2.ko;
          loseMine =
            this.seat === "host" ? this.p1.ko && !this.p2.ko : this.p2.ko && !this.p1.ko;
        } else {
          winMine = this.p2.ko && !this.p1.ko;
          loseMine = this.p1.ko && !this.p2.ko;
        }
        this.paintResultTitle(winMine ? "胜利" : loseMine ? "败北" : "双倒", winMine ? "win" : loseMine ? "lose" : "draw");
        if (winMine) playUiSfx(this, UI_SFX.resultWin, { volume: 0.78 });
        else if (loseMine) playUiSfx(this, UI_SFX.resultLose, { volume: 0.62 });
        else playUiSfx(this, UI_SFX.resultLose, { volume: 0.45, rate: 0.92 });
      }
      this.resultHint.setText(
        this.pvp
          ? "J / Enter 再战（同人同图）　　任一方 Esc 全员回房间"
          : this.cricket
            ? "J / Enter 再看一场　　Esc 重选英灵"
            : "J / Enter 再战　　Esc 重选英灵"
      ).setAlpha(1);
    }

    returnToPvpLobby(fromPeer) {
      if (!this.sys?.isActive()) return;
      // 已离开过但仍停在对局：再按 Esc 强制切走（防偶发卡死）
      if (this._leavingFight) {
        try {
          killStageBgm(this);
          this.registry.set("pvpResume", { refreshStage: true, pullPeers: true });
          this.scene.start("select");
        } catch {
          /* ignore */
        }
        return;
      }
      this._leavingFight = true;
      clearNetLobbyPings(this.net);
      if (this.net) this.net._fightGen = this.fightGen || 0;
      if (this.net?.connected) {
        if (this.isHost) {
          const payload = {
            type: "state",
            stageId: this.pack.stageId,
            over: true,
            p1: this.packActor(this.p1),
            p2: this.packActor(this.p2),
          };
          if (this.p3) payload.p3 = this.packActor(this.p3);
          this.net.send(payload);
        }
        if (!fromPeer) {
          const net = this.net;
          const gen = this.fightGen || net._fightGen || 0;
          const ping = () => {
            try {
              if (net?.connected) net.send({ type: "lobby_return", gen });
            } catch {
              /* ignore */
            }
          };
          ping();
          queueNetLobbyPings(net, [140, 360]);
        }
      }
      this.net?.discard?.(["start", "map_draw", "ready", "state", "lobby_return"]);
      this.net?.swallow?.(["start", "map_draw", "input"]);
      this.registry.set("pvpResume", { refreshStage: true, pullPeers: true });
      killStageBgm(this);
      this.scene.start("select");
    }

    onFightEsc() {
      if (!this.sys?.isActive()) return;
      if (this.pvp) this.returnToPvpLobby(false);
      else {
        killStageBgm(this);
        this.scene.start("select");
      }
    }

    wireNet() {
      const net = this.net;
      if (!net) return;
      clearNetLobbyPings(net);
      net._fightGen = this.fightGen || net._fightGen || 0;
      // 丢掉上一局 inbox 里的 state/lobby_return，否则抽完图进战会立刻被弹回选人
      net.discard?.(["state", "lobby_return", "start", "map_draw"]);
      net.swallow?.(["pick", "start", "map_draw", "ready", "nick", "lobby_state", "roster", "stage_pick"]);
      net.on("input", (msg) => {
        if (!this.isHost) return;
        const from = msg._from;
        if (from !== "guest" && from !== "guest2") return;
        const next = padFromMsg(msg);
        const prev = this.remotePads[from] || emptyPad();
        // 硬直/特写期间后续包会把 just* 冲掉，边沿一直保持到 driveActor 吃掉
        next.justUp = next.justUp || prev.justUp;
        next.justDown = next.justDown || prev.justDown;
        next.justJ = next.justJ || prev.justJ;
        next.justK = next.justK || prev.justK;
        next.justL = next.justL || prev.justL;
        next.justShift = next.justShift || prev.justShift;
        this.remotePads[from] = next;
      });
      net.on("state", (msg) => {
        if (this.isHost) return;
        this.pendingState = msg;
      });
      net.on("rematch", () => {
        if (this.isHost) return;
        killStageBgm(this);
        this.scene.start("loader", this.pack);
      });
      net.on("rematch_request", () => {
        if (!this.isHost || !this.over || !this.resultShown) return;
        this.net?.send({ type: "rematch" });
        killStageBgm(this);
        this.scene.start("loader", this.pack);
      });
      net.on("lobby_return", (msg) => {
        const gen = Number(msg?.gen);
        const mine = Number(this.fightGen);
        if (Number.isFinite(gen) && Number.isFinite(mine) && gen !== mine) return;
        this.returnToPvpLobby(true);
      });
      net.on("peer", (msg) => {
        if (msg.event === "left") {
          this.over = true;
          if (this.result) {
            const who = msg.seat ? seatLabel(msg.seat) : "有人";
            this.paintResultTitle(`${who} 离线`, "info");
            this.resultHint.setText("Esc 返回英灵选择").setAlpha(1);
          }
        }
      });
    }

    packActor(a) {
      const now = Date.now();
      const cdLeft = (move) => Math.max(0, (a.moveCdUntil?.[move] || 0) - now);
      return {
        x: a.sprite.x,
        y: a.sprite.y,
        vx: a.sprite.body.velocity.x,
        vy: a.sprite.body.velocity.y,
        hp: a.hp,
        mp: a.mp,
        sp: a.sp,
        move: a.move,
        facing: a.facing,
        busy: a.busy,
        ko: a.ko,
        frame: a.textureIndex(),
        stunUntil: a.stunUntil,
        downedUntil: a.downedUntil,
        willKnockdown: a.willKnockdown,
        airFalling: a.airFalling,
        invulnUntil: a.invulnUntil,
        breakoutAt: a.breakoutAt,
        pitFalling: a.pitFalling,
        ailment: a.ailment,
        ailmentUntil: a.ailmentUntil,
        cd: {
          skill: cdLeft("skill"),
          combo_up: cdLeft("combo_up"),
          combo_down: cdLeft("combo_down"),
          super: cdLeft("super"),
        },
      };
    }

    applyActor(a, data) {
      if (!data) return;
      a.sprite.x = data.x;
      a.sprite.y = data.y;
      a.sprite.setVelocity(data.vx || 0, data.vy || 0);
      a.hp = data.hp;
      if (Number.isFinite(data.mp)) a.mp = data.mp;
      if (Number.isFinite(data.sp)) a.sp = data.sp;
      a.facing = data.facing;
      a.syncFacingVisual();
      a.busy = !!data.busy;
      a.ko = !!data.ko;
      a.stunUntil = data.stunUntil || 0;
      a.downedUntil = data.downedUntil || 0;
      a.willKnockdown = !!data.willKnockdown;
      a.airFalling = !!data.airFalling;
      a.hitThisMove = !!data.hitThisMove;
      a.invulnUntil = data.invulnUntil || 0;
      a.breakoutAt = data.breakoutAt || 0;
      a.pitFalling = !!data.pitFalling;
      if (data.ailment && data.ailment !== a.ailment) {
        if (data.ailment === "none") a.clearAilment();
        else a.applyAilment(data.ailment, 1);
      }
      if (Number.isFinite(data.ailmentUntil)) a.ailmentUntil = data.ailmentUntil;
      if (data.cd && typeof data.cd === "object") {
        const now = Date.now();
        a.moveCdUntil = a.moveCdUntil || { skill: 0, combo_up: 0, combo_down: 0, super: 0 };
        CD_SLOT_ORDER.forEach(({ move }) => {
          if (Number.isFinite(data.cd[move])) a.moveCdUntil[move] = now + Math.max(0, data.cd[move]);
        });
      }
      if (data.move && data.move !== a.move) {
        const prev = a.move;
        const next = data.move;
        // 客人端靠状态包换招，必须重置，否则小技能/奥义特效只生成一次后永久失效
        a.projSpawned = false;
        a.hitThisMove = false;
        if (prev === "super" && next !== "super") this.interruptActorSuper(a);
        a.move = next;
        const key = `${a.prefix}-${data.move}`;
        if (a.scene.anims.exists(key)) {
          a.sprite.anims.play(
            { key, startFrame: 0, skipMissedFrames: false },
            LOOP.has(data.move)
          );
          if (typeof data.frame === "number") a.applyMoveFrame(data.move, data.frame);
        }
        if (next === "super") this.beginSuperCutin(a);
        // 网络跳帧时动画 update 可能赶不上出弹点，换招后立刻补一次
        a.maybeSpawnProjectile();
      } else if (typeof data.frame === "number" && a.move === data.move && a.textureIndex() !== data.frame) {
        a.applyMoveFrame(a.move, data.frame);
        a.maybeSpawnProjectile();
      } else {
        a.plantFrame(true);
      }
    }

    sendState() {
      if (!this.isHost || !this.net?.connected) return;
      const payload = {
        type: "state",
        stageId: this.pack.stageId,
        over: this.over,
        p1: this.packActor(this.p1),
        p2: this.packActor(this.p2),
      };
      if (this.p3) payload.p3 = this.packActor(this.p3);
      this.net.send(payload);
    }

    applyPendingState() {
      const msg = this.pendingState;
      if (!msg) return;
      this.pendingState = null;
      if (msg.stageId && msg.stageId !== this.pack.stageId) {
        const idx = this.stageIds.indexOf(msg.stageId);
        if (idx >= 0) {
          this.stageIndex = idx;
          this.pack.stageId = msg.stageId;
          const key = `stage-${msg.stageId}`;
          if (this.textures.exists(key)) {
            this.mountStage(msg.stageId);
            this.syncTitle();
          }
        }
      }
      this.applyActor(this.p1, msg.p1);
      this.applyActor(this.p2, msg.p2);
      if (this.p3 && msg.p3) this.applyActor(this.p3, msg.p3);
      if (msg.over && !this.over) {
        this.beginEndCine();
      }
    }

    readLocalPad() {
      const pad = emptyPad();
      pad.left = this.keys.A.isDown;
      pad.right = this.keys.D.isDown;
      pad.up = this.keys.W.isDown;
      pad.down = this.keys.S.isDown;
      pad.shift = this.keys.SHIFT.isDown;
      pad.guard = this.keys.S.isDown;
      pad.justUp = this._edgeUp || Phaser.Input.Keyboard.JustDown(this.keys.W);
      pad.justDown = this._edgeDown || Phaser.Input.Keyboard.JustDown(this.keys.S);
      pad.justJ = this._edgeJ || Phaser.Input.Keyboard.JustDown(this.keys.J);
      pad.justK = this._edgeK || Phaser.Input.Keyboard.JustDown(this.keys.K);
      pad.justL = this._edgeL || Phaser.Input.Keyboard.JustDown(this.keys.L);
      pad.justShift = this._edgeShift || Phaser.Input.Keyboard.JustDown(this.keys.SHIFT);
      return pad;
    }

    /** 每帧最先收边沿；hitstop/倒计时提前 return 也不会把 JustDown 吃掉。 */
    harvestFightEdges() {
      const now = this.time.now;
      this._edgeUp = Phaser.Input.Keyboard.JustDown(this.keys.W);
      this._edgeDown = Phaser.Input.Keyboard.JustDown(this.keys.S);
      this._edgeJ = Phaser.Input.Keyboard.JustDown(this.keys.J);
      this._edgeK = Phaser.Input.Keyboard.JustDown(this.keys.K);
      this._edgeL = Phaser.Input.Keyboard.JustDown(this.keys.L);
      this._edgeShift = Phaser.Input.Keyboard.JustDown(this.keys.SHIFT);
      if (this._edgeJ) {
        this.pendingJAt = now;
        if (this.hostBuf) this.hostBuf.pendingJAt = now;
      }
      if (this._edgeK) {
        this.pendingKAt = now;
        if (this.hostBuf) this.hostBuf.pendingKAt = now;
      }
      if (this._edgeL) {
        this.pendingLAt = now;
        if (this.hostBuf) this.hostBuf.pendingLAt = now;
      }
    }

    sendLocalInput() {
      if (this.isHost || !this.net?.connected) return;
      const pad = this.readLocalPad();
      this.net.send({ type: "input", ...pad });
    }

    vertFromPad(pad, buf, now, onGround = true) {
      if (pad.justUp) {
        buf.lastUpAt = now;
        // 刚点上时清掉过期的下方向记忆，避免上+K 被吃成下+K
        if (!pad.down && !pad.guard) buf.lastDownAt = 0;
        if (onGround) buf.pendingJumpAt = now;
      }
      if (pad.justDown) buf.lastDownAt = now;
      const upHeld = !!pad.up;
      const downHeld = !!(pad.down || pad.guard);
      const upTap = now - (buf.lastUpAt || 0) <= DIR_WINDOW;
      const downTap = now - (buf.lastDownAt || 0) <= DIR_WINDOW;
      // 当前按住优先；上下同时按时取更晚按下的一侧
      if (upHeld && !downHeld) return "up";
      if (downHeld && !upHeld) return "down";
      if (upHeld && downHeld) return (buf.lastUpAt || 0) >= (buf.lastDownAt || 0) ? "up" : "down";
      if (upTap && downTap) return (buf.lastUpAt || 0) >= (buf.lastDownAt || 0) ? "up" : "down";
      if (upTap) return "up";
      if (downTap) return "down";
      return "";
    }

    /** 仅当前按住的上下（技能用，不受点按缓冲干扰） */
    vertHeldFromPad(pad) {
      const upHeld = !!pad.up;
      const downHeld = !!(pad.down || pad.guard);
      if (upHeld && !downHeld) return "up";
      if (downHeld && !upHeld) return "down";
      if (upHeld && downHeld) return "up";
      return "";
    }

    vertHeld() {
      const upHeld = this.keys.W.isDown;
      const downHeld = this.keys.S.isDown;
      if (upHeld && !downHeld) return "up";
      if (downHeld && !upHeld) return "down";
      if (upHeld && downHeld) return "up";
      return "";
    }

    steerVelocityX(p, left, right, shift) {
      const air = !p.grounded();
      if (this.domainDashLocked(p)) shift = false;
      const dashOn = shift && p.sp > 8;
      if (dashOn) p.sp = Math.max(0, p.sp - (air ? 5 : 9) * (this.game.loop.delta / 1000));
      const speed = dashOn ? DASH : air ? AIR : WALK;
      if (left) {
        p.facing = -1;
        return -speed;
      }
      if (right) {
        p.facing = 1;
        return speed;
      }
      if (air && dashOn) return p.facing * DASH;
      if (air) return p.sprite.body.velocity.x;
      return 0;
    }

    jumpSpeedX(p, left, right, shift) {
      if (this.domainDashLocked(p)) shift = false;
      const dashOn = (shift && p.sp > 8) || Math.abs(p.sprite.body.velocity.x) >= DASH * 0.8;
      const speed = dashOn ? DASH : AIR;
      if (left) {
        p.facing = -1;
        return -speed;
      }
      if (right) {
        p.facing = 1;
        return speed;
      }
      if (Math.abs(p.sprite.body.velocity.x) > 40) {
        return Math.sign(p.sprite.body.velocity.x) * speed;
      }
      if (dashOn) return p.facing * speed;
      return p.sprite.body.velocity.x;
    }

    beginJumpFor(p, pad) {
      if (!p || (p.jumpsLeft || 0) <= 0) return false;
      const s = p.sprite;
      const body = s.body;
      const fromGround = p.grounded();
      const alreadyAirJump = !fromGround && p.move === "jump";
      body.blocked.down = false;
      body.touching.down = false;
      if (fromGround) s.y = Math.min(s.y, this.supportY(p)) - 10;
      const vx = this.jumpSpeedX(p, pad.left, pad.right, pad.shift);
      p.syncFacingVisual();
      p.jumpsLeft = Math.max(0, (p.jumpsLeft || 1) - 1);
      p._wasGrounded = false;
      s.setVelocity(vx, fromGround ? JUMP : DOUBLE_JUMP);
      // 二段跳只加速度，不重开 jump 动画（避免缩放/帧重置缩身）
      if (alreadyAirJump) {
        p.busy = false;
      } else {
        p.startMove("jump", { busy: false });
      }
      return true;
    }

    pickAttackPad(onGround, vdir) {
      if (vdir === "down") return "attack_down";
      if (vdir === "up") return onGround ? "attack_up" : "air_attack";
      if (!onGround) return "air_attack";
      return "attack";
    }

    pickSkillPad(onGround, vdir) {
      // 上/下+K 必须按住方向；裸 K = skill（含短暂离地，避免误吃成下+K）
      if (vdir === "up") return "combo_up";
      if (vdir === "down") return "combo_down";
      return "skill";
    }

    driveActor(p, pad, buf) {
      if (p.ko) return;
      const s = p.sprite;
      const onGround = p.grounded();
      const now = this.time.now;
      // 必须在任何 early-return 之前记下边沿，否则硬直中按 K 会被整帧吃掉
      if (pad.justJ) buf.pendingJAt = now;
      if (pad.justK) buf.pendingKAt = now;
      if (pad.justL) buf.pendingLAt = now;
      const vdir = this.vertFromPad(pad, buf, now, onGround);
      const vdirSkill = this.vertHeldFromPad(pad);
      p.tickGetUp();
      if (pad.justL && this.tryBreakout(p)) return;
      if (pad.justShift && this.tryDashEscape(p, pad.left, pad.right)) return;
      if (!p.canAct()) {
        if (p.immobilized()) s.setVelocityX(0);
        else if (p.busy && p.grounded() && !ATTACKS.has(p.move) && !HIT[p.move]?.knockdown) {
          s.setVelocityX(s.body.velocity.x * 0.86);
        }
        if (p.busy || p.immobilized() || p.stunUntil > now || p.comboLocked()) return;
      }
      if (p.busy) {
        if (onGround && !ATTACKS.has(p.move)) s.setVelocityX(0);
        return;
      }
      const wantL = pad.justL || (buf.pendingLAt && now - buf.pendingLAt <= ACTION_BUF_MS);
      const wantK = pad.justK || (buf.pendingKAt && now - buf.pendingKAt <= ACTION_BUF_MS);
      const wantJ = pad.justJ || (buf.pendingJAt && now - buf.pendingJAt <= ACTION_BUF_MS);
      if (wantL) {
        if (this.canSpend(p, "super") && p.startMove("super", moveVoiceOpts("super"))) {
          this.spend(p, "super");
          buf.pendingLAt = 0;
          s.setVelocityX(p.facing * moveSpec(p.fighter, "super").lunge);
          return;
        }
        if (!this.canSpend(p, "super")) buf.pendingLAt = 0;
      }
      if (wantK) {
        const anim = this.resolveSkillAnim(p, this.pickSkillPad(onGround, vdirSkill));
        if (this.canSpend(p, anim) && p.startMove(anim, moveVoiceOpts(anim))) {
          this.spend(p, anim);
          buf.pendingKAt = 0;
          buf.pendingJumpAt = 0;
          if (anim === "attack_up" || anim === "combo_up") {
            s.setVelocityY(0);
            if (onGround) s.y = Math.min(s.y, this.supportY(p));
          }
          if (
            anim === "combo_down" &&
            onGround &&
            !this.isGroundFrontDown(p.fighter) &&
            !this.isHawkingHero(p.fighter) &&
            !this.isYearZeroHero(p.fighter)
          ) {
            s.setVelocityY(-360);
          }
          s.setVelocityX(p.facing * moveSpec(p.fighter, anim).lunge);
          return;
        }
        // 蓝/耐不足或没有该招：清缓冲，避免稍后突然放出来
        if (!this.canSpend(p, anim) || !p.has(anim)) buf.pendingKAt = 0;
      }
      if (wantJ) {
        const anim = this.pickAttackPad(onGround, vdir);
        if (this.canSpend(p, anim) && p.startMove(anim, moveVoiceOpts(anim))) {
          this.spend(p, anim);
          buf.pendingJAt = 0;
          buf.pendingJumpAt = 0;
          if (anim === "attack_up" || anim === "combo_up") {
            s.setVelocityY(0);
            if (onGround) s.y = Math.min(s.y, this.supportY(p));
          }
          if (anim === "attack_down" && onGround) s.setVelocityY(-360);
          s.setVelocityX(p.facing * moveSpec(p.fighter, anim).lunge);
          return;
        }
        if (!this.canSpend(p, anim) || !p.has(anim)) buf.pendingJAt = 0;
      }
      if (pad.guard && onGround && this.canGuard(p)) {
        s.setVelocityX(0);
        p.startMove("guard", { busy: false });
        buf.pendingJumpAt = 0;
        return;
      }
      // 空中二段跳：点跳立刻起跳
      if (!onGround && pad.justUp && p.jumpsLeft > 0) {
        buf.pendingJumpAt = 0;
        this.beginJumpFor(p, pad);
        return;
      }
      if (onGround && buf.pendingJumpAt && now - buf.pendingJumpAt >= JUMP_DELAY) {
        buf.pendingJumpAt = 0;
        this.beginJumpFor(p, pad);
        return;
      }
      let vx = this.steerVelocityX(p, pad.left, pad.right, pad.shift);
      p.syncFacingVisual();
      s.setVelocityX(vx);
      p.plantFrame();
      if (p.move === "jump" && s.body.velocity.y < 0) return;
      if (!p.grounded()) {
        if (p.move !== "jump" && s.body.velocity.y < -40 && !ATTACKS.has(p.move)) p.startMove("jump", { busy: false });
      } else if (vx !== 0) {
        const canDash = pad.shift && p.sp > 8 && !this.domainDashLocked(p);
        p.startMove(canDash ? "dash" : "walk", { busy: false });
      } else if (p.move !== "idle") {
        p.startMove("idle", { busy: false });
      }
    }

    stampDirBuffer() {
      const now = this.time.now;
      this.pressedUp = this._edgeUp || Phaser.Input.Keyboard.JustDown(this.keys.W);
      this.pressedDown = this._edgeDown || Phaser.Input.Keyboard.JustDown(this.keys.S);
      if (this.pressedUp) {
        this.lastUpAt = now;
        if (!this.keys.S.isDown) this.lastDownAt = 0;
        if (this.p1.canAct()) {
          if (this.p1.grounded()) this.pendingJumpAt = now;
          else this._p1AirJumpQueued = true;
        }
      }
      if (this.pressedDown) this.lastDownAt = now;
    }

    vertDir() {
      const now = this.time.now;
      const upHeld = this.keys.W.isDown;
      const downHeld = this.keys.S.isDown;
      const upTap = now - (this.lastUpAt || 0) <= DIR_WINDOW;
      const downTap = now - (this.lastDownAt || 0) <= DIR_WINDOW;
      if (upHeld && !downHeld) return "up";
      if (downHeld && !upHeld) return "down";
      if (upHeld && downHeld) return (this.lastUpAt || 0) >= (this.lastDownAt || 0) ? "up" : "down";
      if (upTap && downTap) return (this.lastUpAt || 0) >= (this.lastDownAt || 0) ? "up" : "down";
      if (upTap) return "up";
      if (downTap) return "down";
      return "";
    }

    beginJump() {
      const p = this.p1;
      const pad = {
        left: this.keys.A.isDown,
        right: this.keys.D.isDown,
        shift: this.keys.SHIFT.isDown,
      };
      this.upJumpAt = this.time.now;
      return this.beginJumpFor(p, pad);
    }

    pickAttack(onGround) {
      const vdir = this.vertDir();
      if (vdir === "down") return "attack_down";
      if (vdir === "up") return onGround ? "attack_up" : "air_attack";
      if (!onGround) return "air_attack";
      return "attack";
    }

    pickSkill(onGround) {
      const vdir = this.vertHeld();
      if (vdir === "up") return "combo_up";
      if (vdir === "down") return "combo_down";
      return "skill";
    }

    controlPlayer() {
      if (this.pvp) return;
      const p = this.p1;
      const s = p.sprite;
      const justL = this._edgeL;
      const justK = this._edgeK;
      const justJ = this._edgeJ;
      const left = this.keys.A.isDown;
      const right = this.keys.D.isDown;
      const shift = this.keys.SHIFT.isDown;
      const justShift = this._edgeShift;
      const onGround = p.grounded();
      const now = this.time.now;
      this.stampDirBuffer();
      // 硬直提前 return 前先吃边沿，否则 JustDown 当帧作废
      if (justJ) this.pendingJAt = now;
      if (justK) this.pendingKAt = now;
      if (justL) this.pendingLAt = now;

      if (!this.pve) {
        if (Phaser.Input.Keyboard.JustDown(this.keys.I)) p.startMove("opening_cg");
        if (Phaser.Input.Keyboard.JustDown(this.keys.O)) p.startMove("win_cg", { voice: "win" });
        if (Phaser.Input.Keyboard.JustDown(this.keys.P)) p.startMove("defeat_cg", { voice: "defeat" });
        if (Phaser.Input.Keyboard.JustDown(this.keys.H)) p.startMove(onGround ? "hurt" : "air_hurt", { voice: "hurt" });
        if (Phaser.Input.Keyboard.JustDown(this.keys.N)) p.startMove("knockdown");
      }

      p.tickGetUp();
      if (justL && this.tryBreakout(p)) return;
      if (justShift && this.tryDashEscape(p, left, right)) return;
      if (!p.canAct()) {
        if (p.immobilized()) s.setVelocityX(0);
        else if (p.busy && p.grounded() && !ATTACKS.has(p.move) && !HIT[p.move]?.knockdown) {
          s.setVelocityX(s.body.velocity.x * 0.86);
        }
        if (p.busy || p.immobilized() || p.stunUntil > now || p.comboLocked()) return;
      }
      if (p.busy) {
        if (onGround && !ATTACKS.has(p.move)) s.setVelocityX(0);
        return;
      }

      const wantL = justL || (this.pendingLAt && now - this.pendingLAt <= ACTION_BUF_MS);
      const wantK = justK || (this.pendingKAt && now - this.pendingKAt <= ACTION_BUF_MS);
      const wantJ = justJ || (this.pendingJAt && now - this.pendingJAt <= ACTION_BUF_MS);

      if (wantL) {
        if (this.canSpend(p, "super") && p.startMove("super", moveVoiceOpts("super"))) {
          this.spend(p, "super");
          this.pendingLAt = 0;
          s.setVelocityX(p.facing * moveSpec(p.fighter, "super").lunge);
          return;
        }
        if (!this.canSpend(p, "super")) this.pendingLAt = 0;
      }
      if (wantK) {
        const anim = this.resolveSkillAnim(p, this.pickSkill(onGround));
        if (this.canSpend(p, anim) && p.startMove(anim, moveVoiceOpts(anim))) {
          this.spend(p, anim);
          this.pendingKAt = 0;
          this.pendingJumpAt = 0;
          this._p1AirJumpQueued = false;
          if (anim === "attack_up" || anim === "combo_up") {
            s.setVelocityY(0);
            if (onGround) s.y = Math.min(s.y, this.supportY(p));
          }
          if (
            anim === "combo_down" &&
            onGround &&
            !this.isGroundFrontDown(p.fighter) &&
            !this.isHawkingHero(p.fighter) &&
            !this.isYearZeroHero(p.fighter)
          ) {
            s.setVelocityY(-360);
          }
          s.setVelocityX(p.facing * moveSpec(p.fighter, anim).lunge);
          this.upJumpAt = 0;
          return;
        }
        if (!this.canSpend(p, anim) || !p.has(anim)) this.pendingKAt = 0;
      }
      if (wantJ) {
        const anim = this.pickAttack(onGround);
        if (this.canSpend(p, anim) && p.startMove(anim, moveVoiceOpts(anim))) {
          this.spend(p, anim);
          this.pendingJAt = 0;
          this.pendingJumpAt = 0;
          this._p1AirJumpQueued = false;
          if (anim === "attack_up" || anim === "combo_up") {
            s.setVelocityY(0);
            if (onGround) s.y = Math.min(s.y, this.supportY(p));
          }
          if (anim === "attack_down" && onGround) s.setVelocityY(-360);
          s.setVelocityX(p.facing * moveSpec(p.fighter, anim).lunge);
          this.upJumpAt = 0;
          return;
        }
        if (!this.canSpend(p, anim) || !p.has(anim)) this.pendingJAt = 0;
      }
      if (this.keys.S.isDown && onGround && this.canGuard(p)) {
        s.setVelocityX(0);
        p.startMove("guard", { busy: false });
        this.pendingJumpAt = 0;
        this._p1AirJumpQueued = false;
        return;
      }
      if (!onGround && this._p1AirJumpQueued && p.jumpsLeft > 0) {
        this._p1AirJumpQueued = false;
        this.pendingJumpAt = 0;
        this.beginJump();
        return;
      }
      this._p1AirJumpQueued = false;
      if (onGround && this.pendingJumpAt && now - this.pendingJumpAt >= JUMP_DELAY) {
        this.pendingJumpAt = 0;
        this.beginJump();
        return;
      }

      const vx = this.steerVelocityX(p, left, right, shift);
      p.syncFacingVisual();
      s.setVelocityX(vx);
      p.plantFrame();

      if (p.move === "jump" && s.body.velocity.y < 0) return;
      if (!p.grounded()) {
        if (p.move !== "jump" && s.body.velocity.y < -40 && !ATTACKS.has(p.move)) p.startMove("jump", { busy: false });
      } else if (vx !== 0) {
        const canDash = shift && p.sp > 8 && !this.domainDashLocked(p);
        p.startMove(canDash ? "dash" : "walk", { busy: false });
      } else if (p.move !== "idle") {
        p.startMove("idle", { busy: false });
      }
    }

    controlDummy() {
      const d = this.p2;
      if (d.ko) return;
      d.tickGetUp();
      if (!d.canAct()) return;
      d.facing = this.p1.sprite.x < d.sprite.x ? -1 : 1;
      d.syncFacingVisual();
      if (Math.abs(d.sprite.body.velocity.x) < 30) d.sprite.setVelocityX(0);
      if (d.move !== "idle" && d.move !== "guard") d.startMove("idle", { busy: false });
      else d.plantFrame();
    }

    cpuBrain(d) {
      if (!this.cpuMap) this.cpuMap = {};
      const k = d?.prefix || "cpu";
      if (!this.cpuMap[k]) {
        this.cpuMap[k] = {
          nextAt: 0,
          skillAt: 0,
          superAt: 0,
          jumpAt: 0,
          landX: null,
          used: [],
          lastKind: "",
          retreatUntil: 0,
        };
      }
      return this.cpuMap[k];
    }

    cpuStrike(d, anim) {
      if (!d.has(anim)) anim = d.has("attack") ? "attack" : "";
      if (!anim) return false;
      if (!this.canSpend(d, anim)) {
        if (anim !== "attack" && d.has("attack") && this.canSpend(d, "attack")) anim = "attack";
        else return false;
      }
      const s = d.sprite;
      const onGround = d.grounded();
      if (!d.startMove(anim, moveVoiceOpts(anim))) return false;
      this.spend(d, anim);
      if ((anim === "attack_up" || anim === "combo_up") && onGround) {
        s.setVelocityY(0);
        s.y = Math.min(s.y, this.supportY(d));
      }
      if (
        anim === "combo_down" &&
        onGround &&
        !this.isGroundFrontDown(d.fighter) &&
        !this.isHawkingHero(d.fighter) &&
        !this.isYearZeroHero(d.fighter)
      ) {
        s.setVelocityY(-360);
      }
      if (anim === "attack_down" && onGround) s.setVelocityY(-360);
      s.setVelocityX(d.facing * moveSpec(d.fighter, anim).lunge);
      return true;
    }

    cpuStartJump(d, vx) {
      const now = this.time.now;
      const brain = this.cpuBrain(d);
      if ((d.jumpsLeft || 0) <= 0 || now < (brain.jumpAt || 0)) return false;
      const fromGround = d.grounded();
      const alreadyAirJump = !fromGround && d.move === "jump";
      brain.jumpAt = now + (fromGround ? 380 : 220);
      const s = d.sprite;
      const body = s.body;
      body.blocked.down = false;
      body.touching.down = false;
      if (fromGround) s.y = Math.min(s.y, this.supportY(d)) - 10;
      d.jumpsLeft = Math.max(0, (d.jumpsLeft || 1) - 1);
      d._wasGrounded = false;
      s.setVelocity(vx, fromGround ? JUMP : DOUBLE_JUMP);
      if (alreadyAirJump) {
        d.busy = false;
      } else {
        d.startMove("jump", { busy: false });
      }
      return true;
    }

    cpuProfile() {
      const id = cpuDiffId(this.cpuDiff);
      // skillCd / superCd 只是思考间隔；真正冷却走 MOVE_CD_MS（canSpend/spend）
      if (id === "kind") {
        return {
          mpRegen: 3.2,
          skillP: 0.1,
          skillCd: 480,
          skillRange: 250,
          superP: 0,
          superCd: 480,
          superRange: 0,
          atkLo: 320,
          atkHi: 540,
          guardP: 0.16,
          airAtkP: 0.28,
          dashChase: false,
          jumpPunish: 0.1,
          escapeP: 0.34,
        };
      }
      if (id === "cruel") {
        return {
          mpRegen: 3.8,
          skillP: 0.72,
          skillCd: 380,
          skillRange: 540,
          superP: 0.42,
          superCd: 420,
          superRange: 560,
          atkLo: 180,
          atkHi: 320,
          guardP: 0.3,
          airAtkP: 0.62,
          dashChase: true,
          jumpPunish: 0.36,
          escapeP: 0.85,
        };
      }
      return {
        mpRegen: 3.2,
        skillP: 0.55,
        skillCd: 420,
        skillRange: 460,
        superP: 0.18,
        superCd: 420,
        superRange: 360,
        atkLo: 240,
        atkHi: 420,
        guardP: 0.2,
        airAtkP: 0.48,
        dashChase: true,
        jumpPunish: 0.22,
        escapeP: 0.58,
      };
    }

    /** 被连击/硬直时朝远离对手方向冲刺脱战 */
    cpuTryDashEscape(d, p, brain, now) {
      if (!d || d.ko || !p) return false;
      if (d.willKnockdown || d.airFalling || d.downed()) return false;
      const locked =
        d.comboLocked() ||
        (d.stunUntil && d.stunUntil > now) ||
        (d.busy && FALL.has(d.move)) ||
        d.immobilized();
      if (!locked) return false;
      if (now < (brain.escapeAt || 0)) return false;
      if (d.sp < DASH_ESCAPE_SP) return false;
      const urgent = (d.comboDmg || 0) >= Math.max(6, COMBO_LAUNCH_DMG * 0.45);
      const chance = this.cpuProfile().escapeP || 0.5;
      if (!urgent && Math.random() > chance) {
        brain.escapeAt = now + Phaser.Math.Between(140, 260);
        return false;
      }
      const awayLeft = p.sprite.x > d.sprite.x;
      if (this.tryDashEscape(d, awayLeft, !awayLeft)) {
        brain.escapeAt = now + Phaser.Math.Between(720, 1400);
        brain.nextAt = now + 380;
        return true;
      }
      brain.escapeAt = now + 220;
      return false;
    }

    cpuPickSkill(d, p) {
      const dist = Math.abs(p.sprite.x - d.sprite.x);
      const pool = ["combo_up", "combo_down", "skill"].filter((m) => d.has(m) && this.canSpend(d, m));
      const best = this.cpuPickBestSpecial(d, p, dist, pool);
      return best || (d.has("skill") ? "skill" : "attack");
    }

    /** 按英雄机制给技能打分，低分不放（避免乱放无效技） */
    cpuSkillScore(d, p, anim, dist) {
      const dy = p.sprite.y - d.sprite.y;
      const samePlane = Math.abs(dy) < 56;
      const facing = d.facing || 1;
      const inFront = (p.sprite.x - d.sprite.x) * facing > 20;
      let score = 0;
      if (anim === "combo_up") {
        if (this.isNewtonHero(d.fighter)) {
          if (dist >= 140 && dist <= 820) score += 90;
          else if (dist > 820) score += 40;
          else score -= 35;
          if (p.airborne() || dy < -40) score += 25;
          if (p.comboLocked?.() || p.reacting?.()) score += 15;
        } else if (this.isIeyasuHero(d.fighter)) {
          if (inFront && samePlane && dist >= 90 && dist <= 300) score += 85;
          else score -= 40;
        } else if (this.isJiangHero(d.fighter)) {
          if (dist >= 120 && dist <= 520) score += 70;
          else score -= 20;
        } else if (p.airborne()) score += 75;
        else if (dist < 220) score += 35;
        else score -= 15;
      } else if (anim === "combo_down") {
        if (this.isGroundFrontDown(d.fighter)) {
          if (inFront && samePlane && dist >= 60 && dist <= 280) score += 80;
          else score -= 35;
        } else if (dist >= 80 && dist <= 380) score += 60;
        else score -= 25;
      } else if (anim === "skill") {
        if (dist >= 100 && dist <= 460) score += 55;
        else if (dist < 80) score -= 30;
        else score += 15;
      } else if (anim === "super") {
        if (dist <= 420) score += 50 + (d.hp < d.maxHp * 0.5 ? 30 : 0);
        else score -= 10;
        if (p.move === "super") score -= 80;
      }
      return score;
    }

    cpuPickBestSpecial(d, p, dist, pool) {
      let best = null;
      let bestS = -1e9;
      for (const anim of pool) {
        if (!d.has(anim) || !this.canSpend(d, anim)) continue;
        const s = this.cpuSkillScore(d, p, anim, dist) + Math.random() * 6;
        if (s > bestS) {
          bestS = s;
          best = anim;
        }
      }
      if (bestS < 28) return null;
      return best;
    }

    cpuTrySpecial(d, p, dist) {
      const now = this.time.now;
      const spec = this.cpuProfile();
      const brain = this.cpuBrain(d);
      if (
        spec.superP > 0 &&
        d.has("super") &&
        this.canSpend(d, "super") &&
        now >= (brain.superAt || 0) &&
        dist < spec.superRange
      ) {
        const s = this.cpuSkillScore(d, p, "super", dist);
        if (s >= 40 && Math.random() < spec.superP) {
          if (this.cpuStrike(d, "super")) {
            brain.superAt = now + Math.max(spec.superCd, 360);
            brain.nextAt = now + 520;
            return true;
          }
        }
      }
      if (spec.skillP > 0 && now >= (brain.skillAt || 0) && Math.random() < Math.min(0.92, spec.skillP + 0.12)) {
        const pool = ["combo_up", "combo_down", "skill"].filter((m) => d.has(m));
        const anim = this.cpuPickBestSpecial(d, p, dist, pool);
        if (anim && this.cpuStrike(d, anim)) {
          brain.skillAt = now + Math.max(spec.skillCd, 360);
          brain.nextAt = now + 360;
          return true;
        }
        brain.skillAt = now + 220;
      }
      return false;
    }

    cpuSteerAir(d, p) {
      const now = this.time.now;
      const brain = this.cpuBrain(d);
      const dist = Math.abs(p.sprite.x - d.sprite.x);
      let aimX = Number.isFinite(brain.landX) ? brain.landX : p.sprite.x;
      const overVoid =
        !this.hasWalkable(d.sprite.x, d.sprite.y) ||
        this.cpuKillPitAt(d.sprite.x, d.sprite.y + 36) ||
        this.cpuKillPitAt(aimX, d.sprite.y + 40);
      if (overVoid) {
        const safe = this.cpuNearestSafeX(d.sprite.x, d.sprite.y);
        if (safe != null) aimX = safe;
        else {
          const dir = aimX >= d.sprite.x ? 1 : -1;
          const pit = this.cpuKillPitAt(aimX, d.sprite.y + 40) || this.cpuPitBetween(d.sprite.x, aimX, d.sprite.y);
          const land = pit ? this.cpuSafeCrossLand(pit, d.sprite.x, p.sprite.y, dir, DASH) : null;
          if (land != null) aimX = land;
        }
      } else if (this.cpuKillPitAt(aimX, d.sprite.y + 40)) {
        const dir = aimX >= d.sprite.x ? 1 : -1;
        const pit = this.cpuKillPitAt(aimX, d.sprite.y + 40);
        const land = pit ? this.cpuSafeCrossLand(pit, d.sprite.x, d.sprite.y, dir, DASH) : null;
        if (land != null) aimX = land;
        else {
          const safe = this.cpuNearestSafeX(d.sprite.x, d.sprite.y);
          if (safe != null) aimX = safe;
        }
      }
      const sdx = aimX - d.sprite.x;
      if (Math.abs(sdx) > 16) {
        d.facing = sdx < 0 ? -1 : 1;
        d.syncFacingVisual();
        d.sprite.setVelocityX(Math.sign(sdx) * (Math.abs(sdx) > 240 ? DASH : AIR));
      }
      // 二段跳：只为救坑或追明显更高的对手，避免空中连跳乱跑
      if ((d.jumpsLeft || 0) > 0 && now >= (brain.jumpAt || 0)) {
        const vy = d.sprite.body.velocity.y;
        const peaked = vy > -60;
        const foeMuchHigher = p.sprite.y < d.sprite.y - 88;
        const needSave = overVoid && peaked;
        if (needSave || (foeMuchHigher && peaked && dist < 320)) {
          const jx = Math.sign(sdx || d.facing) * (Math.abs(sdx) > 160 ? DASH : AIR);
          if (this.cpuStartJump(d, jx || d.facing * AIR)) {
            brain.nextAt = now + 220;
            return;
          }
        }
      }
      if (dist < 190 && now >= brain.nextAt && Math.random() < Math.max(0.4, this.cpuProfile().airAtkP)) {
        this.cpuStrike(d, "air_attack");
        brain.nextAt = now + 300;
        return;
      }
      if (d.move !== "jump" && d.sprite.body.velocity.y < -40 && !ATTACKS.has(d.move)) {
        d.startMove("jump", { busy: false });
      }
    }

    cpuNavigate(d, p, opts = {}) {
      if (this.domainDashLocked(d)) opts = { ...opts, dash: false };
      const brain = this.cpuBrain(d);
      const dir = p.sprite.x >= d.sprite.x ? 1 : -1;
      d.facing = dir;
      d.syncFacingVisual();
      const y = d.sprite.y;
      const dist = Math.abs(p.sprite.x - d.sprite.x);
      const ahead = d.sprite.x + dir * (opts.shy ? 72 : 88);
      const plat = opts.noHop ? null : this.cpuPlatformToward(d, p);
      const pit = this.cpuBlockingPit(d, dir, p);

      if (plat && y - plat.y > 34) {
        const dx = plat.x - d.sprite.x;
        const reach = Math.abs(dx) < 300 ? 460 : 620;
        const pitToPlat = this.cpuPitBetween(d.sprite.x, plat.x, y);
        const canPlat =
          !pitToPlat || this.cpuSafeCrossLand(pitToPlat, d.sprite.x, y, Math.sign(dx || dir) || dir, DASH);
        if (canPlat && Math.abs(dx) < reach + 80) {
          brain.landX = plat.x;
          if (this.cpuStartJump(d, Math.sign(dx || dir) * (Math.abs(dx) > 240 ? DASH : AIR))) return;
        }
      }

      if (pit) {
        // 有底的壕沟：走进去，别在沿上踌躇
        if (this.cpuPitHasFloor(pit, y) || this.cpuCanDropOrStep(ahead, y)) {
          d.sprite.setVelocityX(dir * (opts.dash ? DASH : WALK));
          d.startMove(opts.dash && d.has("dash") && d.sp > 16 ? "dash" : "walk", { busy: false });
          return;
        }
        const land = this.cpuSafeCrossLand(pit, d.sprite.x, y, dir, DASH);
        if (land != null) {
          brain.landX = land;
          if (this.cpuStartJump(d, dir * DASH)) return;
        }
        brain.landX = null;
        this.cpuHoldNearLedge(d, pit, dir);
        return;
      }

      if (p.sprite.y > y + 48 && !this.hasWalkable(ahead, y)) {
        const surf = this.cpuSurfaceAt(ahead);
        if (surf != null && surf > y + 16 && !this.cpuKillPitAt(ahead, surf - 6)) {
          d.sprite.setVelocityX(dir * (opts.dash ? DASH : WALK));
          d.startMove(opts.dash && d.has("dash") && d.sp > 16 ? "dash" : "walk", { busy: false });
          return;
        }
      }

      // 前方有更低地面（壕沟）：直接走进去，不要卡在坑沿发呆
      {
        const downSurf = this.cpuSurfaceAt(ahead) ?? this.cpuSurfaceAt(d.sprite.x + dir * 120);
        if (downSurf != null && downSurf > y + 28 && !this.cpuKillPitAt(ahead, downSurf - 4)) {
          d.sprite.setVelocityX(dir * (opts.dash ? DASH : WALK));
          d.startMove(opts.dash && d.has("dash") && d.sp > 16 ? "dash" : "walk", { busy: false });
          return;
        }
      }

      // 壕沟里往主地面爬：前方更高才起跳（同平面对打时禁止乱跳）
      if (!opts.noHop) {
        const upSurf = this.cpuSurfaceAt(ahead) ?? this.cpuSurfaceAt(d.sprite.x + dir * 140);
        if (upSurf != null && upSurf < y - 40) {
          brain.landX = d.sprite.x + dir * 120;
          if (this.cpuStartJump(d, dir * (dist > 280 ? DASH : AIR))) return;
        }
      }

      if (!this.hasWalkable(ahead, y)) {
        const gapPit =
          this.cpuKillPitAt(ahead, y + 40) ||
          this.cpuKillPitAt(ahead, y + 100) ||
          this.cpuPitBetween(d.sprite.x, p.sprite.x, y);
        if (gapPit) {
          const land = this.cpuSafeCrossLand(gapPit, d.sprite.x, y, dir, DASH);
          if (land != null && !opts.noHop) {
            brain.landX = land;
            if (this.cpuStartJump(d, dir * DASH)) return;
          }
          // 无击杀坑时不要傻站：继续朝对手走（下方可能有凹地地板）
          if (!this.cpuKillPitAt((gapPit.left + gapPit.right) / 2, y + 80)) {
            d.sprite.setVelocityX(dir * WALK);
            if (d.move !== "walk") d.startMove("walk", { busy: false });
            return;
          }
          brain.landX = null;
          this.cpuHoldNearLedge(d, gapPit, dir);
          return;
        }
        const climb = this.cpuSurfaceAt(ahead);
        if (!opts.noHop && climb != null && climb < y - 24) {
          brain.landX = ahead;
          if (this.cpuStartJump(d, dir * AIR)) return;
        }
        if (climb != null && climb > y + 20) {
          d.sprite.setVelocityX(dir * WALK);
          if (d.move !== "walk") d.startMove("walk", { busy: false });
          return;
        }
        // 仍有地面就朝对手挤，避免斗蛐蛐隔空对站
        if (this.cpuSurfaceAt(p.sprite.x) != null || this.cpuSurfaceAt(ahead) != null) {
          d.sprite.setVelocityX(dir * WALK);
          if (d.move !== "walk") d.startMove("walk", { busy: false });
          return;
        }
        d.sprite.setVelocityX(0);
        if (d.move !== "idle") d.startMove("idle", { busy: false });
        return;
      }

      if (opts.shy && dist < 160) {
        const back = opts.dash && d.has("dash") && d.sp > 18 && dist < 110;
        d.sprite.setVelocityX(-dir * (back ? DASH : WALK));
        d.startMove(back ? "dash" : "walk", { busy: false });
        return;
      }

      const spec = this.cpuProfile();
      const dash = (this.cricket || spec.dashChase) && opts.dash && dist > 280 && d.has("dash") && d.sp > 16;
      d.sprite.setVelocityX(dir * (dash ? DASH : WALK));
      d.startMove(dash ? "dash" : "walk", { busy: false });
    }

    showCpuSpecial(d, p, brain, dist, opts = {}) {
      const now = this.time.now;
      if (now < brain.skillAt) return false;
      const kinds = ["skill", "combo_up", "combo_down", "super"].filter((m) => d.has(m));
      if (!kinds.length) return false;
      let pool = kinds.filter((m) => !brain.used.includes(m) && m !== brain.lastKind);
      if (!pool.length) {
        brain.used = [];
        pool = kinds.filter((m) => m !== brain.lastKind);
        if (!pool.length) pool = kinds.slice();
      }
      const withoutSuper = pool.filter((m) => m !== "super");
      if (pool.includes("super") && brain.used.filter((k) => k !== "super").length < 2 && withoutSuper.length) {
        pool = withoutSuper;
      }
      if (opts.siege) {
        pool = pool.filter((m) => m === "skill" || m === "super" || m === "combo_up" || m === "combo_down");
      }
      if (p.move === "super") pool = pool.filter((m) => m !== "super");
      pool = pool.filter((m) => this.canSpend(d, m));
      const anim = this.cpuPickBestSpecial(d, p, dist, pool);
      if (!anim || !this.cpuStrike(d, anim)) return false;
      brain.lastKind = anim;
      brain.used.push(anim);
      brain.skillAt = now + 360;
      brain.nextAt = now + Phaser.Math.Between(opts.siege ? 280 : 300, opts.siege ? 480 : 460);
      return true;
    }

    /** 对手硬直/连击中：贴身加压，制造压制感 */
    cpuPressAdvantage(d, p, brain, now) {
      if (!p || p.ko || p.downed()) return false;
      const locked = p.comboLocked?.() || (p.reacting?.() && !p.willKnockdown && !p.airFalling);
      if (!locked && !(p.stunUntil && p.stunUntil > now)) return false;
      const dist = Math.abs(p.sprite.x - d.sprite.x);
      const samePlane = Math.abs(p.sprite.y - d.sprite.y) < 64;
      if (dist > 260) {
        this.cpuNavigate(d, p, { dash: true, noHop: samePlane });
        brain.nextAt = now + 90;
        return true;
      }
      if (now < brain.nextAt) {
        this.cpuNavigate(d, p, { dash: dist > 140, noHop: samePlane });
        return true;
      }
      let anim = "attack";
      if (p.airborne() && d.has("attack_up")) anim = "attack_up";
      else if (dist < 90 && d.has("attack_down") && Math.random() < 0.35) anim = "attack_down";
      // 有收益时穿插技能续压
      if (Math.random() < 0.38) {
        const special = this.cpuPickBestSpecial(d, p, dist, ["combo_up", "combo_down", "skill"].filter((m) => d.has(m)));
        if (special) anim = special;
      }
      if (this.cpuStrike(d, anim)) {
        brain.nextAt = now + Phaser.Math.Between(180, 320);
        return true;
      }
      return false;
    }

    controlShowCpu(d, p) {
      if (d.ko) return;
      d.tickGetUp();
      const now = this.time.now;
      const brain = this.cpuBrain(d);
      if (this.cpuTryDashEscape(d, p, brain, now)) return;
      if (!d.canAct() || d.busy) return;
      const dx = p.sprite.x - d.sprite.x;
      const dy = p.sprite.y - d.sprite.y;
      const dist = Math.abs(dx);
      const samePlane = Math.abs(dy) < 64;
      d.facing = dx < 0 ? -1 : 1;
      d.syncFacingVisual();
      if (now < this.roundAt || (p.move === "opening_cg" && p.busy)) {
        d.sprite.setVelocityX(0);
        if (d.move !== "idle") d.startMove("idle", { busy: false });
        return;
      }
      if (!d.grounded()) {
        this.cpuSteerAir(d, p);
        return;
      }
      brain.landX = null;
      brain.retreatUntil = 0;
      const killPit = this.cpuBlockingPit(d, d.facing, p);
      const pitSiege = !!(
        killPit &&
        !this.cpuPitHasFloor(killPit, d.sprite.y) &&
        this.cpuSafeCrossLand(killPit, d.sprite.x, d.sprite.y, d.facing, DASH) == null
      );

      if (this.cpuPressAdvantage(d, p, brain, now)) return;

      if (pitSiege) {
        this.cpuHoldNearLedge(d, killPit, d.facing);
        if (now >= brain.nextAt) {
          if (this.showCpuSpecial(d, p, brain, dist, { siege: true })) return;
          if (dist < 220) this.cpuStrike(d, p.airborne() ? "attack_up" : "attack");
          brain.nextAt = now + Phaser.Math.Between(240, 400);
        }
        return;
      }

      // 倒地无敌：贴上去等，不要跳走
      if (p.downed() || p.invulnerable()) {
        if (dist > 120) this.cpuNavigate(d, p, { dash: dist > 240, noHop: samePlane });
        else {
          d.sprite.setVelocityX(0);
          if (d.move !== "idle") d.startMove("idle", { busy: false });
        }
        return;
      }

      // 同平面：先打后走。贴身就出拳，绝不无故后退/起跳
      if (samePlane) {
        if (now >= brain.nextAt) {
          if (dist < 420 && this.showCpuSpecial(d, p, brain, dist)) return;
          if (dist < 198) {
            let anim = "attack";
            if (p.airborne() && d.has("attack_up")) anim = "attack_up";
            else if (dist < 70 && d.has("attack_down") && Math.random() < 0.22) anim = "attack_down";
            this.cpuStrike(d, anim);
            brain.nextAt = now + Phaser.Math.Between(240, 400);
            return;
          }
        }
        if (dist > 70) {
          this.cpuNavigate(d, p, { dash: dist > 220, noHop: true });
          return;
        }
        d.sprite.setVelocityX(0);
        if (now < brain.nextAt) {
          if (d.move !== "idle" && !ATTACKS.has(d.move)) d.startMove("idle", { busy: false });
          else d.plantFrame();
          return;
        }
        this.cpuStrike(d, "attack");
        brain.nextAt = now + 280;
        return;
      }

      // 不同高度：只为够到对手才跳
      if (now >= brain.nextAt && dist < 240 && Math.abs(dy) < 110) {
        if (this.showCpuSpecial(d, p, brain, dist)) return;
        if (p.airborne() && d.has("attack_up") && this.cpuStrike(d, "attack_up")) {
          brain.nextAt = now + 320;
          return;
        }
      }
      this.cpuNavigate(d, p, { dash: dist > 240, noHop: false });
      if (now >= brain.nextAt) brain.nextAt = now + 160;
    }

    controlCpu() {
      const d = this.p2;
      const p = this.p1;
      if (d.ko) return;
      d.tickGetUp();
      const now = this.time.now;
      const brain = this.cpuBrain(d);
      if (this.cpuTryDashEscape(d, p, brain, now)) return;
      if (!d.canAct()) return;
      if (d.busy) return;
      const dx = p.sprite.x - d.sprite.x;
      const dist = Math.abs(dx);
      d.facing = dx < 0 ? -1 : 1;
      d.syncFacingVisual();
      if (now < this.roundAt || (p.move === "opening_cg" && p.busy)) {
        d.sprite.setVelocityX(0);
        if (d.move !== "idle") d.startMove("idle", { busy: false });
        return;
      }
      if (!d.grounded()) {
        this.cpuSteerAir(d, p);
        return;
      }
      brain.landX = null;
      const spec = this.cpuProfile();
      const close = dist < 176;
      if (this.cpuPressAdvantage(d, p, brain, now)) return;
      if (p.downed() || p.invulnerable()) {
        if (dist > 130) this.cpuNavigate(d, p, { dash: dist > 280, noHop: Math.abs(p.sprite.y - d.sprite.y) < 64 });
        else {
          d.sprite.setVelocityX(0);
          if (d.move !== "idle") d.startMove("idle", { busy: false });
        }
        brain.nextAt = now + 180;
        return;
      }
      if (
        p.attacking() &&
        close &&
        d.grounded() &&
        this.canGuard(d) &&
        Math.random() < (d.hp < d.maxHp * 0.22 ? spec.guardP + 0.16 : spec.guardP)
      ) {
        d.sprite.setVelocityX(0);
        d.startMove("guard", { busy: false });
        brain.nextAt = now + Phaser.Math.Between(180, 320);
        return;
      }
      if (now < brain.nextAt) {
        if (d.move === "guard") {
          d.sprite.setVelocityX(0);
          d.plantFrame();
          return;
        }
        this.cpuNavigate(d, p, {
          dash: spec.dashChase && dist > 340,
          noHop: Math.abs(p.sprite.y - d.sprite.y) < 64,
        });
        return;
      }
      if (this.cpuTrySpecial(d, p, dist)) return;
      if (dist < 198) {
        let anim = "attack";
        if (p.airborne() && d.has("attack_up")) anim = "attack_up";
        else if (dist < 72 && d.has("attack_down") && Math.random() < 0.28) anim = "attack_down";
        this.cpuStrike(d, anim);
        brain.nextAt = now + Phaser.Math.Between(spec.atkLo, spec.atkHi);
        return;
      }
      if (p.airborne() && dist < 300 && now >= (brain.jumpAt || 0) && Math.random() < spec.jumpPunish) {
        const punishPit = this.cpuBlockingPit(d, d.facing, p);
        const ok =
          !punishPit ||
          this.cpuPitHasFloor(punishPit, d.sprite.y) ||
          this.cpuSafeCrossLand(punishPit, d.sprite.x, d.sprite.y, d.facing, AIR) != null;
        if (ok) {
          brain.landX = p.sprite.x;
          if (this.cpuStartJump(d, d.facing * AIR)) {
            brain.nextAt = now + 260;
            return;
          }
        }
      }
      this.cpuNavigate(d, p, {
        dash: spec.dashChase && dist > 300,
        noHop: Math.abs(p.sprite.y - d.sprite.y) < 64,
      });
      brain.nextAt = now + Phaser.Math.Between(90, 180);
    }

    update() {
      if (Phaser.Input.Keyboard.JustDown(this.keys.ESC)) {
        this.onFightEsc();
        return;
      }
      this.harvestFightEdges();
      if (
        this.cutinActive &&
        this._cutinStartedAt &&
        this.time.now - this._cutinStartedAt > 2800
      ) {
        this.endSuperCutin(this._cutinActor);
      }
      this.updateCamera();
      if (this.hitstop) {
        this.tickCountdown();
        this.positionPlayerTags();
        this.drawHp();
        // 客人端 cutin/hitstop 期间仍要吃状态包，否则大招残影与显隐会卡住
        if (this.pvp && !this.isHost) {
          this.sendLocalInput();
          this.applyPendingState();
          // 仍要推进弹道寿命，否则奥义全屏特效会卡到永远
          this.updateProjectiles();
        }
        if (this.pvp && this.isHost) this.sendState();
        return;
      }
      if (this.inCountdown()) {
        this.tickCountdown();
        this.fighters().forEach((a) => {
          a.tickGetUp();
          a.stayOnStage();
          a.plantFrame();
        });
        this.positionPlayerTags();
        this.drawHp();
        if (this.pvp && !this.isHost) {
          this.sendLocalInput();
          this.applyPendingState();
        }
        if (this.pvp && this.isHost) this.sendState();
        return;
      }
      if (this.countText) this.countText.setAlpha(0);
      if (this.over) {
        this.plantAllFrames();
        this.positionPlayerTags();
        this.drawHp();
        if (this.pvp && !this.isHost) this.applyPendingState();
        if (
          this.resultShown &&
          (this._edgeJ || Phaser.Input.Keyboard.JustDown(this.keys.ENTER))
        ) {
          if (this.pvp && !this.isHost) {
            this.net?.send({ type: "rematch_request" });
            return;
          }
          if (this.pvp && this.isHost) this.net?.send({ type: "rematch" });
          killStageBgm(this);
          this.scene.start("loader", this.pack);
        }
        return;
      }
      if (this.pvp) {
        if (!this.isHost) {
          this.sendLocalInput();
          this.applyPendingState();
          this.tickCountdown();
          this.plantAllFrames();
          // 客人端本地生成特效，必须自己推进/销毁，否则小技能看不见、奥义残留
          this.updateProjectiles();
          this.positionPlayerTags();
          this.drawHp();
          return;
        }
        this.fighters().forEach((a) => a.tickGetUp());
        this.regenResources();
        this.tickTimeLocks();
        this.tickYearZeroWireBinds();
        this.refreshDomainMpBan();
        this.driveActor(this.p1, this.padForSeat("host"), this.hostBuf);
        this.driveActor(this.p2, this.padForSeat("guest"), this.guestBuf);
        if (this.p3) this.driveActor(this.p3, this.padForSeat("guest2"), this.guest2Buf);
        ["guest", "guest2"].forEach((seat) => {
          const pad = this.remotePads[seat];
          if (!pad) return;
          pad.justUp = false;
          pad.justDown = false;
          pad.justJ = false;
          pad.justK = false;
          pad.justL = false;
          pad.justShift = false;
        });
        this.fighters().forEach((a) => {
          a.stayOnStage();
          this.faceNearestThreat(a);
        });
        this.resolveAllPush();
        this.tryAllHits();
        this.updateProjectiles();
        this.plantAllFrames();
        this.resolveAllPush();
        this.checkMatchOver();
        this.sendState();
        this.positionPlayerTags();
        this.drawHp();
        return;
      }
      this.p1.tickGetUp();
      this.p2.tickGetUp();
      this.regenResources();
      this.tickTimeLocks();
      this.tickYearZeroWireBinds();
      if (this.cricket) {
        this.controlShowCpu(this.p1, this.p2);
        this.controlShowCpu(this.p2, this.p1);
      } else {
        this.controlPlayer();
        if (this.pve) this.controlCpu();
        else this.controlDummy();
      }
      this.p1.stayOnStage();
      this.p2.stayOnStage();
      this.resolvePush(this.p1, this.p2);
      this.p1.ensureAttackAnimLive?.();
      this.p2.ensureAttackAnimLive?.();
      this.tryHit(this.p1, this.p2);
      if (this.pve || this.cricket) this.tryHit(this.p2, this.p1);
      this.updateProjectiles();
      this.p1.plantFrame();
      this.p2.plantFrame();
      this.resolvePush(this.p1, this.p2);
      if (this.p1.ko || this.p2.ko) this.beginEndCine();
      this.positionPlayerTags();
      this.dummyTag?.setPosition(this.p2.sprite.x, this.p2.sprite.y - 200);
      this.drawHp();
    }
  }

  new Phaser.Game({
    type: Phaser.AUTO,
    parent: "game",
    width: 1344,
    height: 768,
    backgroundColor: "#1a1410",
    pixelArt: true,
    roundPixels: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: "arcade",
      arcade: { gravity: { y: 0 }, debug: false },
    },
    scene: [Boot, Select, Load, Fight],
  });
})();
