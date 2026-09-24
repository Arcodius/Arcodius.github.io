# Aaron Zhang 的个人网站

使用 Astro 构建的个人作品集与学习笔记网站，发布在
[https://arcodius.github.io](https://arcodius.github.io)。

## 环境准备

- Node.js 22.12 或更高版本
- npm

首次拉取项目后安装依赖：

```bash
npm ci
```

## 本地修改与预览

常用内容的位置：

- 个人信息、社交链接：`src/data/site.ts`
- 首页及 About、Blog、Demo 页面：`src/pages/`
- 项目内容：`src/content/projects/`
- 博客文章：`src/content/blog/`
- 图片、视频和简历：`public/`
- 全局样式：`src/styles/global.css`

启动后台开发服务器：

```bash
npm run dev
```

开发服务器在后台运行时，可以使用：

```bash
npm run dev:status
npm run dev:logs
npm run dev:stop
```

修改后先打开终端输出的网址预览页面。完成修改后，运行生产构建检查：

```bash
npm run build
```

构建成功的静态文件会生成在 `dist/`，这个目录不需要提交。

## 发布更新

确认生产构建成功后，提交并推送到 `main` 分支：

```bash
git status
git add -A
git commit -m "描述本次更新"
git push origin main
```

推送完成后，`.github/workflows/deploy.yml` 中的 GitHub Actions 会自动构建并发布网站，通常几分钟内即可在
[https://arcodius.github.io](https://arcodius.github.io) 看到更新。

可以在仓库的
[Actions 页面](https://github.com/Arcodius/Arcodius.github.io/actions)
查看构建和发布状态。如果部署失败，点开最新一次运行查看报错，先在本地修复并确保
`npm run build` 通过，再重新提交和推送。

## Git 远程仓库

- `origin`：当前网站与自动发布仓库 `Arcodius/Arcodius.github.io`
- `source`：原始备用仓库 `Arcodius/AaronZhang`
