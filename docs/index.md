---
layout: home

hero:
  name: "xiaoyu"
  text: "知识库"
  tagline: AI Native 个人助理知识体系
  image:
    src: /logo.svg
    alt: xiaoyu
  actions:
    - theme: brand
      text: 开始学习
      link: /frameworks/
    - theme: alt
      text: 知识地图
      link: /knowledge-map
    - theme: alt
      text: GitHub
      link: https://github.com/maplefeng-a/xiaoyu-knowledge

features:
  - icon: 🌍
    title: LangChain 生态
    details: 国际主流智能体框架 - DeepAgent、LangChain、LangGraph 深度研究
    link: /frameworks/01-langchain-ecosystem/
    linkText: 查看详情
  - icon: 🏢
    title: AgentScope 生态
    details: 国内/阿里主流 - AgentScope、HiClaw、CoPaw 框架实践
    link: /frameworks/02-agentscope-ecosystem/
    linkText: 查看详情
  - icon: ⚡
    title: OpenClaw
    details: 新趋势智能体框架 - 端侧运行、多渠道集成、插件生态
    link: /frameworks/03-openclaw/
    linkText: 查看详情
  - icon: 🏗️
    title: ClawdCode SDK
    details: 企业级智能体 SDK - 生产环境最佳实践
    link: /frameworks/04-clawdcode-sdk/
    linkText: 查看详情
  - icon: ☕
    title: Java 学习
    details: 核心基础、Spring 生态、WebFlux 响应式编程
    link: /java/
    linkText: 查看详情
  - icon: 🤖
    title: xiaoyu 项目
    details: AI Native 个人助理 - agent、mcp、eval、desktop 全栈实践
    link: /assistant/
    linkText: 查看详情
---

<style>
:root {
  --vp-home-hero-name-color: transparent;
  --vp-home-hero-name-background: -webkit-linear-gradient(120deg, #bd34fe 30%, #41d1ff);
  --vp-home-hero-image-background-image: linear-gradient(-45deg, #bd34fe 50%, #47caff 50%);
  --vp-home-hero-image-filter: blur(44px);
}

.VPHero .image-bg {
  transition: all 0.5s ease;
}

.VPHero:hover .image-bg {
  transform: scale(1.1);
}

.VPFeature {
  transition: all 0.3s ease;
}

.VPFeature:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}
</style>
