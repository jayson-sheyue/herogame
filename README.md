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

选人顶部切换 **木桩练习** / **PVE** / **局域网 PVP**（或 `Q` / `1` / `2` / `3`）。

- 木桩 / PVE：点战场预览翻地图，`E` 锁定；选定英灵与地图后 `J` 开战。
- 局域网 PVP：同一 Wi‑Fi 下每人打开终端打印的 `http://局域网IP:8788/` → 一人创建房间得到 4 位房号 → 其他人加入 → 选人准备 → 全员准备后开战。2 人 1v1，3 人混战。

不要用 `198.18.x.x`（常见代理虚拟网段，同事通常连不上）。启动日志里的局域网地址才是正确的。

局内 `M` 或 `]` `[` 切图（PVP 仅主机），`Esc` 回选人。  
`?p1=` `?p2=` `?stage=` 可预选（`stage` 只影响木桩/PVE 预览起点）。

---

## 目录

```text
herogame/
  game/                 # 对战端
    serve.py            # 本机 HTTP + PVP WebSocket
    import_pack.py      # 导入工坊 .hgpk.zip
    incoming/           # 把 zip 丢这里，启动时导入
    index.html
    src/game.js
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
