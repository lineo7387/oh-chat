# oh-chat 项目指令

## 项目概述

oh-chat 是一个实时社交聊天 Web 应用，采用有机/自然（wabi-sabi）设计风格。后端使用 Supabase（PostgreSQL + Realtime + Auth + Storage）。

## 技术栈

- **框架**: Vue 3.5 + Vite + TypeScript
- **样式**: Tailwind CSS v4（CSS-first `@theme` 配置，无 tailwind.config.js）
- **状态管理**: Pinia
- **路由**: Vue Router
- **后端**: Supabase（PostgreSQL + Realtime + Auth + Storage）
- **动画**: Anime.js + CSS @keyframes
- **图标**: @phosphor-icons/vue（fill 变体）
- **工具库**: VueUse（@vueuse/core）、clsx、tailwind-merge
- **字体**: @fontsource/fraunces（标题 600-800）+ @fontsource/nunito（正文）

## 包管理

- **必须使用 pnpm**，严禁使用 npm
- 安装命令: `pnpm add <package>` 或 `pnpm add -D <package>`

## 代码规范

### Vue 组件
- 统一使用 `<script setup lang="ts">`
- props / emits 显式标注类型，简单场景可推断
- 组件合理拆分，不追求过细粒度
- 参考 antfu 的 Vue 风格指南

### TypeScript
- 优先显式类型标注
- 复杂类型定义在 `src/types/` 目录
- Supabase 数据库类型在 `src/types/database.ts`

### 样式
- 使用 Tailwind v4 的 `@theme` 定义 design token
- 设计系统见 `design.md` 和 `src/assets/main.css`
- 有机设计风格：温暖大地色系、圆角、柔和阴影、噪点纹理
- 按钮: `rounded-full`，hover `scale-105`，active `scale-95`
- 卡片: `rounded-[2rem]`，`bg-card`，`shadow-soft`
- 缓动函数: `ease-organic` = `cubic-bezier(0.22, 1, 0.36, 1)`

### 组件库策略
- shadcn-vue **仅用于复杂交互组件**（Dialog、Dropdown、Toast）
- 简单组件（Button、Input、Card、Avatar 等）全部手写

## 项目结构

```
src/
  assets/           # 全局样式、字体
  components/
    ui/             # 基础 UI 组件（Button、Input、Card、Avatar）
    layout/         # 布局组件（Sidebar、Navigation）
    effects/        # 视觉效果（BlobBackground）
    chat/           # 聊天相关组件
  composables/      # 可组合函数（useSupabase、useAnimation）
  layouts/          # 页面布局（AuthLayout、ChatLayout）
  lib/              # 工具函数（cn）
  router/           # 路由配置
  stores/           # Pinia 状态（auth、chat）
  types/            # TypeScript 类型定义
  views/            # 页面视图
```

## 状态管理边界

- **Pinia stores**: 全局状态（用户认证、会话列表、消息）
- **组件局部 state**: 仅当前组件使用的 UI 状态（表单输入、展开/折叠、加载状态）

## 工作流程

### 核心规则
1. **每次完成任务后必须停下来等待用户确认**
2. **同步更新** `openspec/changes/*/tasks.md` 的进度
3. 不要自动进入下一项任务
4. 不要假设用户沉默等于同意

### OpenSpec 变更追踪
- 活跃变更: `oh-chat-foundation`
- 任务文件: `openspec/changes/oh-chat-foundation/tasks.md`
- 完成项标记 `[x]`，进行中标记 `~[ ]~`，待办保持 `[ ]`

### 代码提交
- 使用 `pnpm run format`（oxfmt）格式化代码
- 使用 `pnpm run lint` 检查代码
- 使用 `pnpm run type-check` 检查类型
- 不要提交 `.env` 文件（已配置 .gitignore）

## 设计系统速查

| Token | 值 |
|-------|-----|
| background | `#FDFCF8` |
| foreground | `#2C2C24` |
| primary | `#5D7052` |
| secondary | `#C18C5D` |
| accent | `#E6DCCD` |
| muted | `#F0EBE5` |
| border | `#DED8CF` |
| destructive | `#A85448` |
| card | `#FEFEFA` |
| 标题字体 | Fraunces |
| 正文字体 | Nunito |
| 缓动 | `cubic-bezier(0.22, 1, 0.36, 1)` |

## 路由结构

```
/login              AuthLayout → LoginView
/login/register     AuthLayout → RegisterView
/login/forgot-password  AuthLayout → ForgotPasswordView
/                   ChatLayout → EmptyChatView
/chat/:id           ChatLayout → ChatView
/settings           ChatLayout → SettingsView
/contacts           ChatLayout → ContactsView
/contacts/:userId   ChatLayout → UserProfileView
/new-conversation   ChatLayout → NewConversationView
*                   NotFoundView
```

## 常用命令

```bash
pnpm dev          # 开发服务器
pnpm build        # 生产构建
pnpm type-check   # TypeScript 检查
pnpm lint         # ESLint + oxlint
pnpm format       # oxfmt 格式化
```
