// utils/mockData.js

// ===== 分类数据 =====
export const categories = [
  { id: 1, name: '前端开发', icon: '💻', color: '#6C5CE7' },
  { id: 2, name: '后端架构', icon: '⚙️', color: '#00B894' },
  { id: 3, name: '产品设计', icon: '🎨', color: '#FDCB6E' },
  { id: 4, name: '运营增长', icon: '📈', color: '#E17055' },
  { id: 5, name: 'AI 技术', icon: '🤖', color: '#0984E3' },
  { id: 6, name: '职场成长', icon: '🚀', color: '#A29BFE' },
]

// ===== 文章数据 =====
export const mockArticles = [
  {
    id: 1,
    title: 'Vue 3 入门到精通',
    subtitle: '从零开始掌握 Vue 3 核心概念',
    cover: 'https://picsum.photos/seed/vue/400/240',
    summary: 'Vue 3 是前端开发最流行的框架之一，本文带你从零开始系统学习。',
    content: `
# Vue 3 入门到精通

## 什么是 Vue 3？

Vue 3 是 Vue.js 框架的最新主要版本，于 2020 年 9 月正式发布。它带来了许多新特性：

### 核心特性

1. **Composition API** - 更灵活的代码组织方式
2. **Proxy 响应式系统** - 更高效的响应式
3. **TypeScript 支持** - 更好的类型推断
4. **Teleport 组件** - 更灵活的内容渲染
5. **Fragments** - 支持多根节点

## 为什么要学习 Vue 3？

- 性能更好，包体积更小
- 更现代化的开发体验
- 社区生态丰富
- 企业需求旺盛

## 前置知识

- HTML / CSS / JavaScript 基础
- 了解 ES6+ 语法
- 基本的 Node.js 知识

## 开始学习

本文是系列教程的第一篇，后续会深入讲解 Composition API、响应式原理、路由管理等高级话题。

继续关注，一起成长！
    `,
    category_id: 1,
    type: 2, // 1:免费, 2:积分支付
    points_required: 30,
    is_top: true,
    view_count: 1280,
    pay_count: 89,
    create_time: '2026-07-08 10:00'
  },
  {
    id: 2,
    title: '微服务架构设计与实践',
    subtitle: '深入理解微服务架构的核心思想',
    cover: 'https://picsum.photos/seed/microservice/400/240',
    summary: '微服务架构已经成为大型系统的标配，本文带你理解其核心设计理念。',
    content: `
# 微服务架构设计与实践

## 什么是微服务？

微服务是一种架构风格，将单个应用程序开发为一组小型服务，每个服务运行在自己的进程中。

### 核心原则

1. **单一职责** - 每个服务只做一件事
2. **独立部署** - 服务可以独立部署和扩展
3. **去中心化** - 每个服务可以独立选择技术栈
4. **弹性设计** - 服务故障隔离

## 微服务 vs 单体架构

| 维度 | 单体架构 | 微服务架构 |
|------|----------|------------|
| 部署 | 整体部署 | 独立部署 |
| 扩展 | 整体扩展 | 按需扩展 |
| 技术栈 | 统一 | 多样化 |
| 团队协作 | 需要协调 | 独立开发 |

## 实践建议

采用微服务需要有成熟的 DevOps 基础设施，不建议在团队规模较小时采用。
    `,
    category_id: 2,
    type: 2,
    points_required: 50,
    is_top: false,
    view_count: 856,
    pay_count: 45,
    create_time: '2026-07-07 14:30'
  },
  {
    id: 3,
    title: 'UX 设计入门指南',
    subtitle: '提升产品用户体验的实用方法',
    cover: 'https://picsum.photos/seed/ux/400/240',
    summary: '好的用户体验是产品成功的关键，本文分享 UX 设计的核心理念和实用技巧。',
    content: `
# UX 设计入门指南

## 什么是 UX 设计？

用户体验设计关注用户在使用产品过程中的感受和体验。

### 设计原则

1. **用户为中心** - 一切从用户需求出发
2. **一致性** - 界面和交互保持统一
3. **反馈** - 及时给予用户操作反馈
4. **简洁** - 少即是多

## 常用工具

- Figma - 界面设计
- Sketch - 原型设计
- Adobe XD - 交互设计
- Axure - 高保真原型

## 设计流程

1. 用户研究
2. 信息架构
3. 原型设计
4. 用户测试
5. 迭代优化
    `,
    category_id: 3,
    type: 1, // 免费
    points_required: 0,
    is_top: false,
    view_count: 2100,
    pay_count: 0,
    create_time: '2026-07-06 09:00'
  },
  {
    id: 4,
    title: 'AI 时代产品经理的必备技能',
    subtitle: '产品经理如何利用 AI 提升工作效率',
    cover: 'https://picsum.photos/seed/ai/400/240',
    summary: 'AI 正在改变产品经理的工作方式，本文带你了解 AI 时代的核心能力。',
    content: `
# AI 时代产品经理的必备技能

## AI 对产品经理的影响

AI 技术正在深刻改变产品经理的工作方式，从数据分析到用户洞察，从需求分析到产品决策。

### 核心能力

1. **数据驱动决策** - 利用 AI 分析用户行为数据
2. **AI 产品设计** - 设计 AI 驱动的产品功能
3. **技术理解** - 了解 AI 技术的基本原理
4. **伦理意识** - 关注 AI 产品的伦理问题

## AI 工具推荐

- ChatGPT - 辅助文案和内容创作
- Midjourney - 生成产品视觉素材
- Notion AI - 提升文档效率
- Claude - 数据分析助手

## 未来趋势

AI 不会取代产品经理，但会用 AI 的产品经理会取代不用 AI 的。
    `,
    category_id: 5,
    type: 2,
    points_required: 40,
    is_top: false,
    view_count: 1532,
    pay_count: 67,
    create_time: '2026-07-05 16:20'
  },
  {
    id: 5,
    title: '从程序员到技术管理者的成长之路',
    subtitle: '技术人转型管理者的经验与思考',
    cover: 'https://picsum.photos/seed/techlead/400/240',
    summary: '技术管理不是那么容易，本文分享从程序员到 tech lead 的转型经验。',
    content: `
# 从程序员到技术管理者的成长之路

## 为什么要转型？

技术管理是许多程序员的职业发展方向，但这条路并不容易。

### 能力转变

- **硬技能 → 软技能** - 从写代码到带团队
- **执行者 → 决策者** - 从完成任务到制定方向
- **个人 → 团队** - 从个人贡献到团队成长

### 核心技能

1. **技术视野** - 从局部到整体
2. **沟通能力** - 向上向下双向沟通
3. **决策能力** - 在不确定中做决策
4. **培养能力** - 帮助团队成员成长

## 常见挑战

- 从写代码到写文档
- 从技术专家到管理小白
- 平衡技术和管理的时间

## 建议

不要完全放弃技术，保持对技术的敏感度。
    `,
    category_id: 6,
    type: 2,
    points_required: 35,
    is_top: false,
    view_count: 967,
    pay_count: 34,
    create_time: '2026-07-04 11:00'
  },
  {
    id: 6,
    title: '前端性能优化最佳实践',
    subtitle: '让你的网页速度提升 50% 的技巧',
    cover: 'https://picsum.photos/seed/performance/400/240',
    summary: '页面加载速度直接影响用户转化率，本文分享前端性能优化的实战经验。',
    content: `
# 前端性能优化最佳实践

## 为什么性能很重要？

研究表明，页面加载时间每增加 1 秒，转化率就会下降 7%。

### 优化方向

1. **加载性能** - 减少首屏加载时间
2. **运行时性能** - 提升交互响应速度
3. **网络性能** - 优化资源传输

### 具体实践

- 代码分割（Code Splitting）
- 懒加载（Lazy Loading）
- 图片优化（WebP、响应式）
- 缓存策略（HTTP Cache、Service Worker）
- CDN 加速

## 工具推荐

- Lighthouse - 性能评分
- WebPageTest - 页面性能测试
- Chrome DevTools - 性能分析

## 核心指标

- FCP (First Contentful Paint)
- LCP (Largest Contentful Paint)
- TTI (Time to Interactive)
- CLS (Cumulative Layout Shift)

性能优化是一场持久战，需要持续监控和改进。
    `,
    category_id: 1,
    type: 1,
    points_required: 0,
    is_top: false,
    view_count: 3100,
    pay_count: 0,
    create_time: '2026-07-03 08:00'
  }
]

// ===== 工具函数 =====
export const getArticlesByCategory = (categoryId) => {
  if (categoryId === 0) return mockArticles
  return mockArticles.filter(a => a.category_id === categoryId)
}

export const getArticleById = (id) => {
  return mockArticles.find(a => a.id === id)
}

export const getCategoryById = (id) => {
  return categories.find(c => c.id === id)
}

export const getTopArticles = () => {
  return mockArticles.filter(a => a.is_top)
}

export const getFreeArticles = () => {
  return mockArticles.filter(a => a.type === 1)
}