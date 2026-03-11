import { defineConfig } from 'vitepress'

// GitHub Pages 部署时使用仓库名作为 base
const base = process.env.GITHUB_ACTIONS ? '/xiaoyu-knowledge/' : '/'

export default defineConfig({
  title: 'xiaoyu 知识库',
  description: 'AI Native 个人助理知识体系',
  lang: 'zh-CN',
  base,

  // 暂时忽略死链接，后续修复
  ignoreDeadLinks: true,

  markdown: {
    config: (md) => {
      // 禁用代码块中的 HTML 解析，避免 <> 被误识别为标签
      md.set({ html: false })
    }
  },

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }]
  ],

  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'xiaoyu 知识库',
    
    nav: [
      { text: '首页', link: '/' },
      { text: '框架研究', link: '/frameworks/' },
      { text: 'Java 学习', link: '/java/' },
      { text: 'xiaoyu 项目', link: '/assistant/' },
      { text: 'Harness 专题', link: '/knowledge/harness/' },
      { text: '知识地图', link: '/knowledge-map' }
    ],

    sidebar: {
      '/frameworks/': [
        {
          text: '框架研究',
          items: [
            { text: '总览', link: '/frameworks/' },
            { text: 'LangChain 生态', link: '/frameworks/01-langchain-ecosystem/' },
            { text: 'AgentScope 生态', link: '/frameworks/02-agentscope-ecosystem/' },
            { text: 'OpenClaw', link: '/frameworks/03-openclaw/' },
            { text: 'ClawdCode SDK', link: '/frameworks/04-clawdcode-sdk/' }
          ]
        }
      ],
      '/java/': [
        {
          text: 'Java 学习',
          items: [
            { text: '知识地图', link: '/java/' },
            { text: '核心基础', link: '/java/01-核心基础/' },
            { text: 'Spring 生态', link: '/java/04-Spring 生态/' },
            { text: '工程实践', link: '/java/05-工程实践/' }
          ]
        }
      ],
      '/assistant/': [
        {
          text: 'xiaoyu 项目',
          items: [
            { text: '概览', link: '/assistant/' },
            { text: 'agent', link: '/assistant/agent/' },
            { text: 'mcp', link: '/assistant/mcp/' },
            { text: 'eval', link: '/assistant/eval/' },
            { text: 'desktop', link: '/assistant/desktop/' }
          ]
        }
      ],
      '/knowledge/harness/': [
        {
          text: 'Harness 专题',
          items: [
            { text: '专题首页', link: '/knowledge/harness/' },
            { text: '原文', link: '/knowledge/harness/原文-The-Anatomy-of-an-Agent-Harness' },
            { text: '原文展开讲解', link: '/knowledge/harness/原文展开讲解' },
            { text: '深度解析', link: '/knowledge/harness/深度解析-Agent-Harness架构设计' }
          ]
        },
        {
          text: '六大组件',
          collapsed: false,
          items: [
            { text: '01-文件系统', link: '/knowledge/harness/01-文件系统组件详解' },
            { text: '02-代码执行', link: '/knowledge/harness/02-代码执行组件详解' },
            { text: '03-沙箱和工具', link: '/knowledge/harness/03-沙箱和工具组件详解' },
            { text: '04-记忆和搜索', link: '/knowledge/harness/04-记忆和搜索组件详解' },
            { text: '05-上下文管理', link: '/knowledge/harness/05-上下文管理组件详解' },
            { text: '06-长周期执行', link: '/knowledge/harness/06-长周期执行组件详解' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/maplefeng-a/xiaoyu-knowledge' }
    ],

    footer: {
      message: '由 Clawdbot 维护 · 基于 VitePress 构建',
      copyright: '© 2026 xiaoyu 项目'
    },

    outline: {
      label: '目录',
      level: [2, 3]
    },

    docFooter: {
      prev: '上一页',
      next: '下一页'
    },

    lastUpdated: {
      text: '最后更新',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'short'
      }
    },

    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: '搜索文档',
            buttonAriaLabel: '搜索文档'
          },
          modal: {
            noResultsText: '无法找到相关结果',
            resetButtonTitle: '清除查询条件',
            footer: {
              selectText: '选择',
              navigateText: '切换'
            }
          }
        }
      }
    }
  }
})
