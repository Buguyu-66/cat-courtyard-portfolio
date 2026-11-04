# 猫咪工作室与花园 · 3D 互动作品集

**[在线体验](https://buguyu-66.github.io/cat-courtyard-portfolio/)**

温暖的木质工作室与花园。访客可以操控黑白奶牛猫自由探索，也可以直接使用左侧导航浏览作品。当前发布版本为 V13。

## 操作与互动

- WASD / 方向键移动，鼠标右键拖动旋转，滚轮缩放，一键恢复全景。
- 点击金色图标，小猫会走近目标；靠近后也可以按 E 互动。
- 空格喵叫，G 放下叼着的落叶。
- 拍球、拨水、扒拉铅笔、推动秋千、和其他猫咪打招呼。
- 纸箱：跳入 → 合盖 → 箱内蹦跳 → 开盖 → 自动跳出；E 或移动可提前退出。
- 落叶：叼起一小堆 → G 放下 → 狸花猫扑玩 → 落叶飘回原处，可重复体验。
- 池边捞鱼：观察游鱼 → 抬爪捞起 → 小鱼扑腾跳回池塘 → 小猫甩湿爪；摇椅前新增花丛扑蝶。
- 拨动小提琴琴弦、跳上摇椅晒太阳、在窗边猫窝休息、分层跳上猫爬架后伸懒腰，再趴下休息。E 或方向键离开休息处。
- 手动切换日夜，夜晚工作室与入口亮起暖光，池塘周围亮起冷色庭院灯。声音默认关闭，可在右上角开启。

开场为「捣蛋猫」游戏标题页：蓝绿色底色、奶油色标题与原创扁平黑白猫。猫咪偷偷推落铅笔，再装作无事发生；模型就绪后自动进入，也可点击「开始捣蛋」。左侧作品导航始终可用。加载失败仍能收起开场或直接看作品，尊重系统减少动态效果设置。左上角与浏览器图标保留黑白猫头像。

产品项目、AI 插画、园林设计、其他作品、关于我、联系我六个栏目始终可直接打开。阅读时暂停探索，关闭后保留猫咪与镜头状态。作品和个人资料仍明确标注“待提供”。

## 加载与恢复

首屏只等待工作室、家具与奶牛猫，其余三只猫咪和外围景观随后加载；后续资源失败可单独重试。进入场景所需模型下载量从 42.61 MB 降至约 5.67 MB。静态模型的网页副本使用 meshopt 压缩和 WebP 纹理，再经 gzip 传输；没有简化三角面，保留全部命名物件以支持互动。原始 GLB、原始材质及猫咪绑定动画文件保持不变。启动脚本合并为一个文件，布局内置，减少串行网络请求。

开场显示下载百分比；慢连接可先看作品，返回后继续显示进度。连接无数据 30 秒或单文件下载达到 120 秒后会显示重试。启动脚本加载失败也提供恢复入口。

## 本地运行

预览仓库内已构建的页面需要 Node.js 20 或更高版本，无需安装依赖。修改网站源码后需要安装构建依赖并重新打包：`npm ci`、`npm run build`。构建会生成压缩模型、清单、合并脚本及缓存版本标记。

```sh
npm start
npm run check
npm test
```

本地入口为 `http://127.0.0.1:4195/cat-courtyard-portfolio/`。不要直接双击 HTML；浏览器需要通过 HTTP 读取模型和模块。

## GitHub Pages

沿用 `main` 分支的 `/docs` 发布源。`docs/` 包含页面、脚本、样式、布局、Three.js 和全部七个运行模型，使用相对路径，支持项目网址下的加载。`.nojekyll` 保留原始静态文件。无需后端、密钥或外部模型服务。

上一版工作室保留在分支 [`archive/studio-v10-before-stories`](https://github.com/Buguyu-66/cat-courtyard-portfolio/tree/archive/studio-v10-before-stories)。旧庭院版本保留在分支 [`archive/courtyard-before-studio-v10`](https://github.com/Buguyu-66/cat-courtyard-portfolio/tree/archive/courtyard-before-studio-v10) 及提交历史中。

## 文件

- `docs/index.html`、`docs/style.css`：页面、导航和界面。
- `docs/app.js`：镜头、猫咪、作品栏目与基础互动。
- `docs/layout.json`：物件位置、入口、路线与碰撞配置。
- `docs/mischief.js`、`docs/cozy-interactions.js`：捣蛋与家具互动。
- `docs/box-story.js`、`docs/leaf-story.js`、`docs/garden-wildlife.js`：纸箱、落叶、鱼与蝴蝶的可复位互动。
- `docs/cat-logo.svg`：原创猫咪头像标志。
- `docs/welcome.css`、`docs/welcome.js`：捣蛋猫开场动画、进入和加载异常处理。猫脸与前爪在 V13 重新绘制。
- `docs/model-transfer.js`：带进度、超时和兼容回退的无损模型传输。
- `source/boot.js`、`scripts/build.mjs`：启动错误恢复与构建入口。
- `source/`：本轮 Blender 细化、动作与渲染脚本。
- `docs/day-night.js`：手动日夜与灯光。
- `docs/models/`：完整场景、周边环境、家具和四只独立猫咪。
- `docs/models-web/`：静态场景、周边环境与家具的轻量网页副本。使用官方 gltfpack v1.3，通过 `source/optimize_web_models.py <gltfpack路径>` 重新生成，再执行 `npm run build`。源模型改动后需要同步更新网页副本。
- `tests/`：通路、动画状态、复位、日夜与标签避让检查。
- `docs/vendor/`：Three.js r170 与 meshoptimizer v1.3 解码器，许可见 `LICENSE.txt`、`MESHOPT-LICENSE.md`。

模型采用已有 Aholo Lux3D 资产与 Blender 本地细化。仓库保存网页所需的模型和网站源码；Blender 工程、原始生成文件与历史制作资料继续保留在本地交付目录。

## 验证范围

资源检查验证项目子路径、相对依赖、GLB 完整性和猫咪动作；33 项互动、布局与加载检查覆盖进入/退出、重复触发、复位、通路及日夜切换。Blender 日夜全景、池塘游鱼和猫爬架动作近景已检查。V13 使用独立 Edge 浏览器实测了桌面开场、自动与手动进入、真实 WebGL 场景加载、作品打开和返回、手机排版、加载失败后的作品入口，以及前版保留的减少动态效果偏好。新增检查覆盖后续模型被阻塞时提前进入、猫咪移动、加载失败重试、启动脚本失败提示、加载期间浏览作品再返回；没有捕获到页面脚本异常。完整猫咪互动与声音仍主要依赖前述自动检查，未在本轮逐一操作验证。部署后另行核对改动的线上文件与本次提交一致。

本轮可编辑工程与预览保留在本地 `outputs/cat-stories-v11/`。建模脚本在原生产目录中执行，依赖保留的 `cat-play-v10` 工程及 `cat-studio-v1/source/refine_scene.py` 工具；网页本身独立运行，无这些生产依赖。没有新增付费生成。

V13 浏览器截图与加载验证记录保留在本地 `outputs/cat-polish-v13/`。本轮没有付费生成模型。
