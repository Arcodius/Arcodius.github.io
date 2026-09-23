# Aaron Zhang 的个人网站

一个简洁、克制的个人作品集与学习笔记网站。视觉上借用了 Constructivist 的几何形、黑白对比与少量高饱和色，但内容和可读性仍是主角。

## 网站包含什么

- 首页：个人照片、简介、精选 Demo 和最新 Blog。
- Demo：用 Markdown 记录项目目标、实现、图片和 GIF。
- Blog：用 Markdown 写学习笔记，支持图片、代码块、行内公式和独立 LaTeX 公式。
- About：简介、技能、兴趣和联系方式。

## 为什么仍然保留 Astro

这个项目把 Astro 限制在“构建工具”这一层。它负责把 Markdown、LaTeX 和页面模板编译成普通 HTML/CSS；发布后的 `dist/` 不需要 Astro、Node.js 或服务器运行时。项目也没有引入 React、Vue 或 Tailwind，页面默认不向访客发送 JavaScript。

完全删除 Astro 会需要自己重新实现 Markdown 编译、LaTeX、内容校验、路由和静态构建，会让日常写作变得更难。现在的结构已将内容、组件和样式分开；如果以后真要迁移，`src/content/` 中的 Markdown 和 `public/` 中的媒体文件可以直接带走。

## 快速开始

需要 Node.js 22.12 或更高版本。

```sh
npm install
npm run dev
```

`npm run dev` 会按项目约定在后台启动开发服务器，默认地址是 <http://localhost:4321>。

```sh
npm run dev:status  # 查看状态
npm run dev:logs    # 查看日志
npm run dev:stop    # 停止服务器
npm run build       # 生成 dist/ 静态网站
npm run preview     # 本地预览 dist/
```

## 最先要替换的个人信息

1. 打开 `src/data/site.ts`，修改姓名、简介、邮箱、地点和社交链接。
2. 用自己的照片替换 `public/images/profile-placeholder.svg`。你也可以放入 `profile.webp`，再把 `site.ts` 中的 `portrait` 改为 `/images/profile.webp`。
3. 打开 `astro.config.mjs`，发布前在 `defineConfig` 中增加真实域名：

```js
export default defineConfig({
  site: 'https://your-domain.com',
  // 其余配置……
});
```

不设置 `site` 也能正常构建，只是不会生成 canonical 和社交分享图片的绝对链接。

## 新增 Blog

在 `src/content/blog/` 中新建 `.md` 文件。文件名会变成网址，例如 `my-note.md` 对应 `/blog/my-note/`。

```md
---
title: "文章标题"
description: "用一句话说明文章内容。"
pubDate: 2026-09-22
tags: ["Graphics", "Math"]
cover: "/images/blog/my-cover.webp"
coverAlt: "给无法看图的读者描述这张图"
draft: false
---

## 第一节

普通 Markdown 正文。

行内公式：$E = mc^2$

$$
\nabla \cdot \mathbf{u} = 0
$$

![图片说明](/images/blog/example.webp)
```

必填字段是 `title`、`description` 和 `pubDate`。`tags` 可以留空；`draft: true` 的文章不会出现在列表中，也不会生成公开页面。

## 新增 Demo

在 `src/content/projects/` 中新建 `.md` 文件：

```md
---
title: "项目名称"
summary: "一句话介绍项目。"
year: 2026
status: "in-progress"
tags: ["C++", "OpenGL"]
cover: "/images/projects/my-project.webp"
coverAlt: "项目封面的文字描述"
featured: true
links:
  - label: "GitHub"
    href: "https://github.com/your-name/your-project"
---

## 项目目标

在这里写项目详情。

![运行效果](/images/projects/my-demo.gif)
```

- `status` 只能是 `completed`、`in-progress` 或 `archived`。
- `featured: true` 会让项目出现在首页精选区；首页最多显示两个。
- GIF 和普通图片的写法相同。建议在保证清晰度的前提下压缩文件，较长动画优先使用 WebM/MP4。

## 项目结构

```text
src/
├── components/          # 可复用的页面片段：导航、项目卡片、文章列表等
├── content/
│   ├── blog/           # Blog Markdown
│   └── projects/       # Demo Markdown
├── data/site.ts         # 集中管理个人信息
├── layouts/             # 通用页面框架和文章框架
├── pages/               # 网址路由；文件名对应 URL
├── styles/global.css    # 全站视觉系统和响应式样式
└── content.config.ts    # Blog 和 Demo 字段规则

public/
└── images/               # 原样输出的静态图片、GIF 和视频
```

## 日常修改指南

- 修改颜色：打开 `src/styles/global.css`，修改最上方 `:root` 中的 `--paper`、`--ink`、`--red`、`--blue` 和 `--yellow`。
- 修改导航：打开 `src/components/SiteHeader.astro`。
- 修改首页版式：打开 `src/pages/index.astro`。
- 修改文章排版：在 `global.css` 中搜索 `.prose`。
- 修改内容字段：打开 `src/content.config.ts`。字段不符合规则时，构建会直接报出是哪个文件有问题。

## 图片建议

- 照片和项目截图优先使用 WebP，线条图和图标可使用 SVG。
- 首页个人照片比例为 4:5；Demo 封面比例为 3:2。
- 每张图都应该有准确的 `alt` / `coverAlt`，不要写“图片”，而是说清图中有什么。
- `public/` 中的文件会被原样复制，路径从 `/` 开始，例如 `public/images/a.webp` 在 Markdown 中写作 `/images/a.webp`。

## 发布

运行 `npm run build` 后，将 `dist/` 目录发布到 Netlify、Cloudflare Pages、GitHub Pages 或任意静态网站服务即可。

- Build command: `npm run build`
- Publish directory: `dist`

每次发布前建议先运行 `npm run build`。只要构建成功，所有内容字段、Markdown 路由和 LaTeX 编译就已经通过基本校验。
