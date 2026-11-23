# 网页发布

[English](WEB-PUBLISHING.md) | **简体中文**

在线游戏：**[jayson-sheyue.github.io/herogame](https://jayson-sheyue.github.io/herogame/)**。
玩家使用电脑浏览器与实体键盘，无需安装或注册。选好英灵后点击 **开战** 或按 **J / Enter**。当前尚无触屏战斗控件。

## GitHub Pages

每次推送到 `main`，[Publish web game 工作流](../.github/workflows/pages.yml)都会运行检查、构建并部署。仓库 Settings → Pages 的发布来源应为 **GitHub Actions**。部署状态与 itch.io 上传包均在 [Actions](https://github.com/jayson-sheyue/herogame/actions/workflows/pages.yml) 中查看。

发布目录包含 `index.html`、浏览器脚本、字体、Phaser **3.80.1** 与游戏资源，只需静态 HTTPS 托管；玩家机器和生产服务器都不需要 `serve.py`、Python 或 Node.js。资源使用相对路径，可运行于仓库子目录和 itch.io 内嵌页面。

选人界面使用构建生成的小型战场预览、头像与保持原始像素的首帧立绘，避免下载整套动作图；字体按已发布界面与元数据裁剪；日语使用随包 DotGothic16 与 Yuji Boku，导出时检查日语界面和奥义字形覆盖，并附带[字体许可](../game/fonts/README.md)；角色动作图采用无损 WebP，构建时逐个对比解码后的 RGBA 像素与原图一致；开战时才加载本局角色动作和战场。人物与地图目录已合并，不必逐个请求 JSON。原始导入素材保持不变。实际加载速度仍受网络和设备影响，不承诺固定三秒进入战斗。

## 构建与预览

开发需要 Python 3.11+、Node.js 22+。在仓库根目录运行：

```bash
python3 game/check.py
python3 -m venv .venv
.venv/bin/pip install -r game/requirements-web.txt
.venv/bin/python game/build_web.py
python3 -m http.server 8792 --bind 127.0.0.1 --directory dist
```

打开 **http://127.0.0.1:8792/herogame/**，验证与 Pages 相同的子目录结构。Windows 使用 `.venv\Scripts\python` 与 `.venv\Scripts\pip`。

输出为 `dist/herogame/` 与 `dist/herogame-itch.zip`。再次构建时通过 `--output dist/preview-2` 指定新的目录；脚本不会覆盖已有产物。导出仅包含 Git 跟踪的资源，读取其当前工作区内容，不修改源文件。正式发布应使用干净检出；CI 构建的是确定的已推送提交。优化工具只在开发构建时需要。随包引擎的 MIT 声明见 [game/vendor/PHASER-LICENSE.txt](../game/vendor/PHASER-LICENSE.txt)。

## itch.io HTML5 上传

从与 Pages 部署相同提交的成功工作流下载 **herogame-itch-html5** 产物。先解开 Actions 的外层压缩包，再上传内层的 **`herogame-itch.zip`**，其根目录直接包含 `index.html`。

1. 登录要发布的 itch.io 账号，新建或编辑游戏项目。
2. 将 **Kind of project** 设为 **HTML**，上传 `herogame-itch.zip`，勾选 **This file will be played in the browser**。
3. 选择 **Click to launch in fullscreen**，或使用 **1344 × 870** 的嵌入尺寸。保留点击启动，让键盘焦点与音频由玩家操作激活。游戏画面会缩放，并自带全屏按钮。
4. 暂勿标记为支持移动设备，当前战斗依赖实体键盘。
5. 发布前，在真实嵌入页面预览选人、三种界面语言、切换战场、战斗、小技能、奥义、暂停与返回选人。

构建会检查 itch.io 文档规定的限制：最多 1,000 个文件、解压后 500 MB、单个文件 200 MB、路径 240 字符。文件名区分大小写。打包成功不代表 itch.io 项目已经上传或公开发布。

官方参考：[itch.io HTML5 要求](https://itch.io/docs/creators/html5)、[GitHub Pages 自定义工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)、[fontTools 字体裁剪](https://fonttools.readthedocs.io/en/latest/subset/index.html)。
