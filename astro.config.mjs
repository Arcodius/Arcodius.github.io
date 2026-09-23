// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default defineConfig({
    // 发布前可在这里加入 site: 'https://your-domain.com'
    // 用于生成 canonical 和社交分享图片的绝对链接。
    redirects: {
        '/posts/post-1': '/blog/first-post/',
        '/posts/fluid-basic': '/blog/fluid-basic/',
    },
    markdown: {
        processor: unified({
            remarkPlugins: [remarkMath],
            rehypePlugins: [rehypeKatex],
        }),
    },
});
