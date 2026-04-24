## Context

oh-chat 当前已具备完整的即时通讯基础能力：消息收发（文本+文件）、群聊、好友系统、OAuth 认证。数据库已有 `profiles`、`conversations`、`conversation_participants`、`messages`、`message_reactions`、`attachments`、`friends` 七张表，且通过 Supabase Realtime 实现了消息实时同步。

本次变更在现有架构上增加 5 项用户体验增强功能，全部在前端层实现，部分涉及数据库扩展和 Storage 新增 bucket。

## Goals / Non-Goals

**Goals:**
- 消息输入区支持 Emoji 选择面板，点击即可插入到输入框
- 支持录制、发送、播放语音消息（Web Audio API 前端录制，上传 Supabase Storage）
- Sidebar 会话列表和 ChatView 内清晰标识未读消息
- 用户可为好友/群设置自定义备注名，覆盖默认显示名
- 用户可对任意会话开启免打扰，静音通知并隐藏角标
- 用户可将任意会话置顶，置顶会话固定在 Sidebar 顶部
- 会话设置（备注、免打扰、置顶）可通过多渠道入口操作

**Non-Goals:**
- 消息 Reactions（已有 `message_reactions` 表但本次不涉及 UI）
- 端到端加密语音
- 语音转文字
- 推送通知（浏览器 Push API）— 仅做应用内角标/边界线静默
- 自定义表情包上传（仅使用系统 Emoji Unicode）
- 会话设置仅通过单一入口操作（本次支持多渠道）

## Decisions

### 1. Emoji 数据源：自建分类数据，不引入第三方库
- **选择**：使用原生 Unicode Emoji + 自建分类 JSON（~200 个常用 emoji），通过原生 `<button>` 渲染
- **理由**：避免引入 `emoji-picker-element` 等库的体积开销（~50KB+）；本项目设计系统高度定制，第三方库样式难以融入有机风格
- **替代方案**：`emoji-picker-element` — 功能完整但样式侵入性强，且体积大

### 2. 语音录制：MediaRecorder API + WebM/Opus 格式
- **选择**：使用浏览器原生 `MediaRecorder` API，录制 `audio/webm;codecs=opus`，上传至 Supabase Storage `voice-messages` bucket
- **理由**：`opus` 格式压缩率高、音质好，WebM 容器兼容性最佳；无需引入第三方录音库
- **替代方案**：`RecordRTC` — 封装更好但增加依赖；Web Audio API 手动编码 — 过于复杂

### 3. 未读追踪：扩展 `conversation_participants` 表
- **选择**：在 `conversation_participants` 表新增 `unread_count` 和 `last_read_at` 字段，而非独立 `message_reads` 表
- **理由**：已存在 `last_read_message_id` 字段，在此基础上扩展计数和时间是增量最小方案；每会话每用户仅一行，更新原子性高
- **替代方案**：独立 `message_reads` 表 — 更灵活但过度设计，当前阶段不需要消息级已读状态

### 4. 备注与免打扰：统一 `conversation_settings` 表
- **选择**：新建 `conversation_settings` 表（`user_id`, `conversation_id`, `custom_name`, `is_muted`, `updated_at`），而非分散到多个表
- **理由**：用户-会话级别的个性化设置天然是一对一关系，单表即可覆盖；与 `conversation_participants` 解耦避免参与者元数据膨胀
- **替代方案**：扩展 `conversation_participants` — 语义混淆（参与者身份 vs 用户偏好）

### 5. 语音消息类型：复用 `messages.type` 枚举
- **选择**：在 `messages.type` 枚举中新增 `'voice'` 值，复用现有 `attachments` 表存储语音文件元数据
- **理由**：语音消息本质是带音频附件的文本消息，复用 `attachments` 避免新建表；消息列表渲染逻辑只需在 `type === 'voice'` 时展示语音播放器
- **替代方案**：新建 `voice_messages` 表 — 增加复杂度，与现有附件体系不一致

### 6. 会话置顶：扩展 `conversation_settings` 表
- **选择**：在 `conversation_settings` 表中新增 `is_pinned` (boolean, default false) 和 `pinned_at` (timestamptz) 字段
- **理由**：置顶与备注/静音同属用户-会话级偏好，共用一张表避免碎片化；`pinned_at` 用于多置顶会话的排序（最新置顶在最前）
- **替代方案**：扩展 `conversations` 表 — 置顶是用户级而非全局属性，不能放在会话表

### 7. 会话设置入口：多渠道设计
- **选择**：设置入口分布在三个位置，而非集中在一处
  - **Sidebar 会话项**：悬停/长按显示 `PhDotsThree` 按钮，点击弹出 Dropdown 菜单（置顶、静音快捷开关）
  - **ChatView 头部**：点击 `PhDotsThreeVertical` 弹出菜单（备注、静音、置顶）
  - **UserProfileView（好友资料）**：备注编辑输入框 + 静音/置顶开关
- **理由**：不同场景下用户的心智模型不同——在列表里想快捷操作，在聊天里想顺手改，在好友资料里想深度管理；多渠道入口减少操作路径
- **替代方案**：所有设置集中到 SettingsView — 路径过长，不符合即时通讯的使用习惯

## Risks / Trade-offs

- **[Risk] MediaRecorder 浏览器兼容性** → **Mitigation**：iOS Safari 14+ 和 Chrome/Edge/Firefox 均支持；不支持时隐藏语音按钮并降级为纯文本输入
- **[Risk] 语音文件体积** → **Mitigation**：限制单条语音最长 60 秒；opus 格式 60 秒约 200KB；Storage bucket 配置 10MB 单文件限制
- **[Risk] 未读计数 Realtime 同步冲突** → **Mitigation**：未读计数仅由后端触发器维护（收到新消息时 +1，用户进入会话时重置），前端不直接修改，避免并发冲突
- **[Trade-off] 自建 emoji 数据覆盖有限** → 仅包含 200 个常用 emoji，足够日常聊天；未来可通过搜索/分类扩展，无需引入重型库

## Migration Plan

1. 创建数据库 migration（`conversation_settings` 表含 `is_pinned`/`pinned_at`、`conversation_participants` 扩展、`messages.type` 新增 `'voice'`）
2. 创建 Supabase Storage `voice-messages` bucket 并配置 RLS
3. 更新 `src/types/database.ts` 类型定义
4. 前端组件开发（EmojiPicker、VoiceRecorder、VoicePlayer、未读角标/边界线、ConversationSettingsMenu、备注编辑 UI）
5. 更新 Sidebar（置顶排序 + 快捷菜单）、ChatView（头部设置菜单）、ContactsView/UserProfileView（备注/静音/置顶）
6. 运行 `pnpm type-check`、`pnpm lint`、`pnpm format` 验证
7. 无需回滚策略（纯新增功能，不影响现有数据）

## Open Questions

- 免打扰的具体行为：是否仅隐藏角标，还是同时静音消息列表的 "新消息" 视觉提示？（建议：仅隐藏角标和系统通知，消息列表正常显示）
- 置顶会话排序：当多个会话置顶时，按 `pinned_at` 倒序（最新置顶在最前）还是固定顺序？（建议：`pinned_at` 倒序）
