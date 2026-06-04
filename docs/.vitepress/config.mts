import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitepress';
import { withMermaid } from 'vitepress-plugin-mermaid';

const docsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const siteRoot = path.resolve(docsRoot, '../docs-site');

// GitHub Pages project site: https://arcpx-eng.github.io/async-dag/
// Local dev: VITEPRESS_BASE=/ npm start (see docs-site/package.json)
const base = process.env.VITEPRESS_BASE ?? '/async-dag/';

export default withMermaid(
  defineConfig({
    title: 'async-dag',
    description: 'Open-source DAG engine — pluggable nodes, parallel execution',
    base,
    cleanUrls: true,
    // Links to repo files outside docs/ (examples/, .env.template, LICENSE, …)
    ignoreDeadLinks: true,
    rewrites: {
      'README.md': 'index.md',
    },
    head: [['link', { rel: 'icon', href: '/logo.svg' }]],
    vite: {
      // Deps live in docs-site/; keep Vite cache there too.
      cacheDir: path.join(siteRoot, 'node_modules/.vite'),
      server: {
        port: 3000,
        fs: { allow: [docsRoot, siteRoot] },
      },
      preview: { port: 3000 },
    },
    themeConfig: {
      logo: '/logo.svg',
      nav: [
        { text: 'Docs', link: '/' },
        { text: 'GitHub', link: 'https://github.com/arcpx-eng/async-dag' },
      ],
      sidebar: [
        { text: 'Documentation index', link: '/' },
        { text: 'Getting started', link: '/getting-started' },
        {
          text: 'Guides',
          collapsed: false,
          items: [
            { text: 'Scripts', link: '/scripts' },
            { text: 'API reference', link: '/api' },
            { text: 'LLM configuration', link: '/llm-config' },
            { text: 'Payload guide', link: '/payload-guide' },
            { text: 'Bring your own LLM', link: '/byo-llm' },
            { text: 'ArcPX integration', link: '/arcpx-integration' },
            { text: 'Node handlers', link: '/node-handlers' },
            { text: 'Extending builtin executor', link: '/extending-builtin-executor' },
            { text: 'Core node types', link: '/core-node-types' },
          ],
        },
        {
          text: 'Examples',
          link: '/examples/',
          collapsed: false,
          items: [
            { text: 'Overview', link: '/examples/' },
            { text: 'Linear pipeline', link: '/examples/linear-pipeline' },
            { text: 'Fan-in', link: '/examples/fan-in' },
            { text: 'Fan-out', link: '/examples/fan-out' },
            { text: 'Web scraper', link: '/examples/web-scraper-pipeline' },
            { text: 'LLM demo', link: '/examples/llm-demo' },
            { text: 'Output chaining', link: '/examples/output-chaining' },
            { text: 'AI repos pipeline', link: '/examples/ai-repos-pipeline' },
          ],
        },
        { text: 'Security', link: '/security' },
        { text: 'Contributing', link: '/contributing' },
        { text: 'Changelog', link: '/changelog' },
      ],
      socialLinks: [
        { icon: 'github', link: 'https://github.com/arcpx-eng/async-dag' },
      ],
      editLink: {
        pattern: 'https://github.com/arcpx-eng/async-dag/edit/main/docs/:path',
      },
      footer: {
        message: 'MIT Licensed',
        copyright: `Copyright © ${new Date().getFullYear()} ArcPX Engineering`,
      },
    },
  }),
);
