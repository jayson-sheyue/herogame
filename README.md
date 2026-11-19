# 英灵大乱斗

本地 2D 像素格斗（Phaser 3）。**不需要** Google Cloud，也**不需要**作图工坊。Clone 后用 Python 起一个静态服即可玩。

公开仓库：<https://github.com/jayson-sheyue/herogame>  
套图工坊另仓：<https://github.com/jayson-sheyue/herogame-studio>

本仓库不含 GCP 项目 ID、API key、服务账号或本机绝对路径。

---

## 依赖

| 依赖 | 说明 |
|---|---|
| 操作系统 | macOS、Windows 或 Linux |
| Python | **3.11 或更高**（只用标准库，不必 `pip install`） |
| 浏览器 | Chrome / Edge / Firefox |
| 网络 | 首次打开会从 jsDelivr 加载 Phaser 3.80.1；离线请自行缓存 `phaser.min.js` |

防火墙若要局域网联机：放行 **TCP 8788**（网页）和 **TCP 8789**（PVP）。

---

## 一键试玩

```bash
git clone https://github.com/jayson-sheyue/herogame.git
cd herogame/game
python3 serve.py
```

终端打印 `试玩本机 http://127.0.0.1:8788` 后，浏览器打开该地址。停掉：`Ctrl+C`。

指定资源目录或导入套图包：

```bash
python3 serve.py --assets /path/to/assets/game
python3 serve.py --import ~/Downloads/hero.hgpk.zip
python3 import_pack.py ~/Downloads/hero.hgpk.zip
```

把工坊导出的 `.hgpk.zip` 放到 `game/incoming/` 再启动，也会自动导入（成功后移到 `incoming/_done/`）。

---

## 怎么玩

选人顶部切换 **木桩练习** / **PVE 对战** / **电子斗蛐蛐** / **合作闯关** / **局域网 PVP**。也可按 `Q` 循环切换，或使用 `1` / `2` / `3` / `7` / `4` 直达对应模式。

- 选人：`A` / `D` 换英灵，点击卡池两侧箭头翻页。木桩 / PVE / 斗蛐蛐可点左右立绘，或用 `W` / `S` 切换正在选择的 1P / 2P。
- 选图：点地图两侧箭头预览，点击地图或底部“锁定战场”（`E`）确认；木桩需要先锁图。PVE / 斗蛐蛐未锁图时，开战会抽签；单人闯关直接使用当前预览地图。合作房间与 PVP 由主机选图。
- 开战：点底部主按钮，或按 `J` / `Enter`。PVE 可用 `F` 循环切换三档难度。
- 电子斗蛐蛐：选择两名英灵，旁观两名 AI 自动对战。
- 局域网 PVP：同一 Wi‑Fi 下每人打开终端打印的 `http://局域网IP:8788/` → 一人创建房间得到 4 位房号 → 其他人加入 → 选人准备 → 全员准备后开战。2 人 1v1，3 人混战。
- 合作闯关（Demo）：单人选好英雄后直接按 `J` 开始；多人同样创建／加入房间并准备。支持 2～3 人合作；普通魔兽拥有虫、兽、浮灵、重甲等独立骨架，第二波还会按地图生成猛犸、机械哨兵、海怪、巨像、树妖、翼兽或门神精英。关底 Boss 从队伍未选择的英灵中产生，并完整复用该英雄的普攻、方向技、小技能、专属机制与奥义。12 张地图各有独立事件和台词，Boss 登场剧情需点击推进；主线目标是夺回各地秘宝、修复苍生宝鉴并平息魔潮。结算点击“下一关”进入下一张地图，联机时由主机同步全队推进。

不要用 `198.18.x.x`（常见代理虚拟网段，同事通常连不上）。启动日志里的局域网地址才是正确的。

局内 `A` / `D` 移动，`W` 跳跃，`S` 防守，`Shift` 冲刺，`J` 普攻，`K` 小技能，`L` 奥义／被控时挣脱。技能栏显示冷却倒计时。`Esc` 或底部“返回选人”返回；结算后 `J` / `Enter` 再战。

顶部提供 **声音开关**（记住本机偏好）、**全屏** 与 **操作指南**（`F1`）。单人模式打开指南或切出窗口时自动暂停，点击“继续对战”恢复；联机中指南不暂停其他玩家。暂停期间技能冷却也会停止。推荐使用实体键盘与横屏窗口；窄屏会缩放画面，当前没有触屏战斗按键。

`?p1=`、`?p2=`、`?stage=`、`?mode=`、`?diff=` 可预选；返回选人保留当前模式与角色。引擎或资源加载失败时会显示重试／返回入口。
---

## 目录

```text
herogame/
  game/                 # 对战端
    serve.py            # 本机 HTTP + PVP WebSocket
    import_pack.py      # 导入工坊 .hgpk.zip
    incoming/           # 把 zip 丢这里，启动时导入
    index.html
    src/game.js         # Phaser 场景与战斗逻辑
    src/shell.js        # 页面工具栏、帮助与暂停
    src/ui.css          # 古风暗色页面样式
    check.py            # 一键语法与回归检查
    tests/              # 状态、联机与界面控制回归
  assets/game/          # 只读资源
    index.json          # 英雄 / 地图名单
    heroes/<id>/
    stages/<id>/
    ui/                 # 选人背景、打击音效
```

---

## 从作图工坊加英雄 / 地图

工坊与游戏分仓、分进程。同事在工坊生成后导出 `.hgpk.zip`，你导入本仓库的 `assets/game/`，硬刷新 8788。同名 id 会覆盖。风格图不在包内。

工坊部署见 <https://github.com/jayson-sheyue/herogame-studio>。

---

## 不要提交

| 路径 | 原因 |
|---|---|
| `game/incoming/*.zip`、`incoming/_done/` | 导入包，体积大且可再生成 |
| `**/_bak/` | 入库备份，对战不读 |
| `.venv/`、`__pycache__/`、`.DS_Store` | 环境与系统文件 |
| 任何 `settings.json` / 服务账号 JSON | 本游戏用不到云密钥；若误放进来请立刻轮换 |

---

## 常见问题

**端口已被占用**  
先结束旧进程：`lsof -iTCP:8788 -sTCP:LISTEN`，再启动。

**选人是空的**  
确认 `assets/game/index.json` 与 `heroes/`、`stages/` 在仓库里，且用 `cd game && python3 serve.py` 启动（不要只打开 `index.html` 文件协议）。

**PVP 进不去房**  
双方必须同一局域网、关掉会劫持网段的代理，并放行 8788/8789。


## 开发检查

运行游戏仍只需 Python；以下检查另需 **Node.js 22 或更高版本**，不需要安装 npm 依赖。在仓库根目录执行：

```bash
python3 game/check.py
```

覆盖 JavaScript / Python 语法，以及连接并发、合作地图权限、角色缓存、暂停与冷却、帮助输入隔离等回归。真实房间测试需先启动 `serve.py`，再执行：

```bash
python3 game/check.py --lan-url http://127.0.0.1:8788
```

它会创建临时三人房间，验证满房拒绝、准备与输入/状态同步、离开和重试，最后关闭测试连接。测试结果和人工验收边界见 [game/tests/README.md](game/tests/README.md)。

## 开源协议

本项目采用 [MIT License](LICENSE)。
