# 英灵大乱斗 · PVE 街机版

基于 Phaser 3 的本地像素格斗游戏。本分支 `codex/pve-arcade` **只保留玩家对 CPU 的 PVE 对战**，沿用现有英灵、地图和招式素材，重做经典街机风格的选人界面与战斗 HUD。

多模式版本保留在 [main](https://github.com/jayson-sheyue/herogame/tree/main)。本分支没有木桩、双 AI 观战、合作闯关或局域网 PVP，也不启动 WebSocket 房间服务。

## 运行

需要 Python 3.11+ 和桌面浏览器，无需安装 Python 或 npm 依赖。

```bash
git clone --branch codex/pve-arcade https://github.com/jayson-sheyue/herogame.git
cd herogame
python3 game/serve.py
```

打开 <http://127.0.0.1:8788>，按 `Ctrl+C` 停服。默认仅监听本机；自定义端口使用 `--port 8790`。首次启动需要联网从 jsDelivr 加载 Phaser 3.80.1。推荐实体键盘与横屏，当前没有触屏战斗按键。

## 选人和开战

- 点击左侧 **1P** 或右侧 **CPU** 立绘切换选择对象，再点中间头像。也可用 `W` / `S` 切换对象，`A` / `D` 换人。
- 地图左右箭头或 `←` / `→` 换图。**当前显示的地图就是本局战场**，无需锁定或抽签。
- 点击“初级 / 标准 / 高手”，或用 `F` 循环切换 CPU 难度。
- 点击“开战”，或按 `J` / `Enter` 开始。允许选择相同英灵。

角色与地图选择会保留到返回选人，并写入当前页面地址；`?p1=`、`?p2=`、`?stage=`、`?diff=` 可以预选。旧的 `mode` / `room` 参数会被移除。难度和静音偏好保存在本机浏览器。

## 战斗

| 操作 | 按键 |
| --- | --- |
| 移动 / 跳跃（含二段跳） / 防守 | `A D` / `W` / `S` |
| 冲刺；受击时闪避脱战 | `Shift` |
| 普攻 / 对空普攻 / 对地普攻 | `J` / `W+J` / `S+J` |
| 技能 / 对空技能 / 对地技能 | `K` / `W+K` / `S+K` |
| 奥义；倒地或被控时挣脱 | `L` |
| 返回选人 | `Esc` |
| 结算后同人同图再战 | `J` / `Enter`，或“再战”按钮 |

金色槽为生命，蓝色槽为能量，绿色槽为体力。技能消耗能量；普攻、冲刺、挣脱消耗体力。技能栏显示冷却，`READY` 表示就绪。击倒对方即获胜。

顶部提供声音、全屏与出招表（`F1`）；底部可以暂停。打开出招表或切出窗口会暂停战斗与冷却，关闭说明或点击“继续对战”恢复。加载失败会提供重试或返回选人入口。

## 资源包

本分支继续使用 [套图工坊](https://github.com/jayson-sheyue/herogame-studio) 导出的 `.hgpk.zip`：

```bash
python3 game/serve.py --import /path/to/hero.hgpk.zip
python3 game/serve.py --assets /path/to/assets/game
python3 game/import_pack.py /path/to/hero.hgpk.zip
```

也可把包放入 `game/incoming/`，启动时自动导入，成功后移至 `_done/`。同 id 的资源会被覆盖。已有页面导入后刷新以更新名单。`--no-incoming` 跳过自动导入。

## 目录与开发检查

- `game/src/game.js`：选人、加载与 PVE 战斗。
- `game/src/shell.js`、`game/src/ui.css`：街机外框、出招表、暂停与恢复。
- `game/serve.py`：标准库 HTTP 静态服务。
- `assets/game/`：人物、地图与音效；`game/fonts/`：字体。

检查另需 Node.js 22+，无需 npm 安装：

```bash
python3 game/check.py
```

验证范围与实际验收记录见 [测试说明](game/tests/README.md)。运行游戏本身无需 Node.js。

端口占用时用 `--port` 换端口；选人为空时检查 `assets/game/index.json` 和对应人物、地图文件。不要直接双击 `index.html`；页面会引导至默认本机服务器。

请勿提交导入包、`_bak/`、本机配置、凭据或构建缓存。本项目采用 [MIT License](LICENSE)。
