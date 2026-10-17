// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

function remarkImageCaptions() {
    return (tree) => {
        for (const node of tree.children) {
            if (node.type !== 'paragraph' || node.children.length !== 1) continue;

            const image = node.children[0];
            if (image.type !== 'image' || !image.alt) continue;

            node.data = {
                hName: 'figure',
                hProperties: { className: ['markdown-figure'] },
                hChildren: [
                    {
                        type: 'element',
                        tagName: 'img',
                        properties: {
                            src: image.url,
                            alt: image.alt,
                            ...(image.title ? { title: image.title } : {}),
                        },
                        children: [],
                    },
                    {
                        type: 'element',
                        tagName: 'figcaption',
                        properties: {},
                        children: [{ type: 'text', value: image.alt }],
                    },
                ],
            };
        }
    };
}

export default defineConfig({
    site: 'https://arcodius.github.io',
    redirects: {
        '/posts/post-1': '/blog/first-post/',
        '/posts/fluid-basic': '/blog/fluid-basic/',
    },
    markdown: {
        processor: unified({
            remarkPlugins: [remarkMath, remarkImageCaptions],
            rehypePlugins: [rehypeKatex],
        }),
    },
});
