## Why

oh-chat 当前的基础聊天功能（消息发送、文件上传、群聊）已完备，但缺乏现代聊天应用的核心体验细节：用户无法便捷插入表情符号、无法区分已读/未读消息、缺乏对嘈杂会话的降噪手段，也没有个性化备注能力。这些缺失直接影响日常使用的流畅度和信息组织效率。

## What Changes

- **Emoji 选择面板**：在消息输入区添加可展开的表情选择器，支持点击插入 emoji 到输入框
- **语音消息**：支持录制、发送和播放语音消息（Web Audio API + 前端录制，上传至 Supabase Storage）
- **未读消息指示器**：Sidebar 会话列表显示未读消息数角标；ChatView 内区分未读消息的视觉边界线
- **好友/群备注与免打扰**：
  - 为好友或群设置自定义备注名（覆盖默认显示名）
  - 会话级别免打扰开关（静音通知、隐藏角标）
- **会话置顶**：将任意会话固定在 Sidebar 顶部，多置顶按时间倒序
- **多渠道设置入口**：Sidebar 会话项快捷菜单、ChatView 头部菜单、好友资料页均支持修改备注/静音/置顶

## Capabilities

### New Capabilities

- `emoji-picker`: 消息输入区 emoji 选择面板，支持常用 emoji 分类浏览与点击插入
- `voice-message`: 语音消息录制、上传、播放全流程
- `unread-indicator`: 未读消息计数与视觉边界标识
- `contact-note`: 好友/群备注名管理
- `conversation-mute`: 会话免打扰设置（静音 + 隐藏通知）
- `conversation-pin`: 会话置顶管理（固定到 Sidebar 顶部）

### Modified Capabilities

- _(none — all new capabilities)_

## Impact

- **Frontend**: ChatView 输入区重构（新增 emoji 面板、语音录制按钮）、Sidebar 会话项角标/置顶排序/快捷菜单、消息气泡内语音播放器组件、ChatView 头部设置菜单、好友资料页备注/静音/置顶 UI
- **Database**: 新增 `conversation_settings` 表（用户-会话级别的备注名、mute 状态、置顶状态）；扩展 `conversation_participants`（未读计数）
- **Storage**: 新增 `voice-messages` bucket 存储 `.webm` / `.ogg` 语音文件
- **Realtime**: 未读计数与 conversation_settings 更新需通过 Realtime 同步到 Sidebar
- **Dependencies**: 无需新增运行时依赖（emoji 用原生 Unicode + 自建分类数据；音频用 Web Audio API）
