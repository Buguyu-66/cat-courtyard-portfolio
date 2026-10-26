# 猫咪小院 · 互动个人作品集

一个可以自由探索的 3D 庭院作品集。使用 WASD / 方向键移动，靠近物件后左键互动，滚轮有限缩放。开场展示院子，移动后镜头平滑跟随奶牛猫。

小院包含推门、拍球、抓苹果树、扒拉铅笔、拨水互动，以及会收拾物品的屋主和园艺师。左侧目录提供产品项目、AI 插画、园林设计、其他作品、关于我与联系我六个栏目；作品与个人资料目前使用明确标注的占位内容。

## GitHub Pages

本项目为纯静态网站。`docs/` 中包含全部网页、Three.js 库、场景与角色模型，不依赖后端或账号 API。

发布源使用 `main` 分支的 `/docs` 文件夹，目录中的 `.nojekyll` 保留原始文件。相对资源路径支持 `https://用户名.github.io/仓库名/` 形式的项目网址。

网站当前仍可在原地址体验：
https://mischief-cat-courtyard.buguyu.chatgpt.site

GitHub Pages 最终网址应以 GitHub 的发布结果为准；本 README 未预填未经验证的网址。

## 本地预览与检查

需要 Node.js 20 或更高版本，无须安装 npm 依赖：

```sh
npm run check
npm start
```

`npm start` 会打印本机预览地址。`npm run check` 验证资源相对路径、GLB 容器、动画资源及单文件大小，并模拟 GitHub Pages 项目子路径下的 HTTP 访问。它不替代浏览器中的 WebGL 视觉检查。

## 后续修改

- 页面与栏目：`docs/index.html`、`docs/style.css`、`docs/game.js`。
- 场景、猫咪及人物：`docs/models/`。
- 第三方库：`docs/vendor/`，Three.js 许可见其中 `LICENSE.txt`。

场景模型由 Aholo Lux3D 生成并在 Blender 中整理。仓库仅保留网页实际需要的模型；制作源文件和历史模型另行保留于本地交付包。
