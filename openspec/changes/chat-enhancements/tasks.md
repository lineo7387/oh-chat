## 1. Database & Backend

- [x] 1.1 Create `conversation_settings` table migration (user_id, conversation_id, custom_name, is_muted, is_pinned, pinned_at, updated_at, composite PK, RLS)
- [x] 1.2 Extend `conversation_participants` table: add `unread_count` (int default 0) and `last_read_at` (timestamptz)
- [x] 1.3 Extend `messages.type` enum: add `'voice'` value
- [x] 1.4 Create Supabase Storage `voice-messages` bucket with RLS policies
- [x] 1.5 Create database trigger/function to auto-increment `unread_count` on new message (excluding sender, excluding muted conversations)
- [x] 1.6 Create function/procedure to mark conversation as read (reset unread_count, update last_read_at)
- [x] 1.7 Update `src/types/database.ts` with new tables, columns, and enum values
- [x] 1.8 Push migrations to remote Supabase database

## 2. Emoji Picker

- [x] 2.1 Create `src/data/emojis.ts` with categorized emoji data (~200 common emojis, grouped by category)
- [x] 2.2 Create `src/components/chat/EmojiPicker.vue` component (panel with category tabs, emoji grid, click-to-insert)
- [x] 2.3 Add recent emoji tracking using localStorage
- [x] 2.4 Add emoji search/filter functionality
- [x] 2.5 Wire EmojiPicker into ChatView.vue message input area (replace decorative PhSmiley button)
- [x] 2.6 Add click-outside-to-close behavior for EmojiPicker

## 3. Unread Message Indicators

- [x] 3.1 Update chat store to fetch and track `unread_count` from `conversation_participants`
- [x] 3.2 Add unread count badge to Sidebar conversation items
- [x] 3.3 Add "New messages" boundary line in ChatView when opening a conversation with unread messages
- [x] 3.4 Implement auto-mark-as-read when user opens a conversation (call reset function, update store)
- [x] 3.5 Add Realtime listener for unread_count changes to update Sidebar badges in real-time
- [x] 3.6 Update last message preview styling for conversations with unread messages (bold text, accent indicator)

## 4. Contact Notes, Conversation Mute & Pin

- [x] 4.1 Create `conversation_settings` Pinia store with CRUD operations (custom_name, is_muted, is_pinned, pinned_at)
- [x] 4.2 Update Sidebar conversation list sorting: pinned first (by pinned_at desc), then by last message time
- [x] 4.3 Create `ConversationSettingsMenu` dropdown component (Pin/Unpin, Mute/Unmute, Edit Note)
- [x] 4.4 Wire ConversationSettingsMenu into Sidebar conversation items (more-options button on hover)
- [x] 4.5 Wire ConversationSettingsMenu into ChatView header (more-options button for both direct and group)
- [x] 4.6 Add custom name input + mute/pin toggles to UserProfileView for friends
- [x] 4.7 Update Sidebar `getConversationName` to use custom_name when available
- [x] 4.8 Update ChatView header to use custom_name when available
- [x] 4.9 Add pin icon (push-pin) to pinned conversations in Sidebar
- [x] 4.10 Add muted icon (bell-slash) to muted conversations in Sidebar
- [x] 4.11 Add "Pinned Conversations" section to SettingsView
- [x] 4.12 Add "Muted Conversations" section to SettingsView
- [x] 4.13 Ensure unread count trigger respects `is_muted` setting

## 5. Voice Messages

- [ ] 5.1 Create `src/composables/useVoiceRecorder.ts` (MediaRecorder API, max 60s, WebM/Opus)
- [ ] 5.2 Create `src/components/chat/VoiceRecorder.vue` UI component (hold-to-record, cancel gesture, duration timer)
- [ ] 5.3 Create `src/components/chat/VoicePlayer.vue` component (play/pause, progress bar, duration display)
- [ ] 5.4 Update chat store `sendMessage` to support voice type and audio file upload
- [ ] 5.5 Update ChatView message rendering to show VoicePlayer for `type === 'voice'` messages
- [ ] 5.6 Add microphone button to ChatView input area (show/hide based on MediaRecorder support)
- [ ] 5.7 Handle voice message upload errors and loading states

## 6. Integration & Polish

- [ ] 6.1 Ensure all new components follow organic design system (colors, rounded corners, shadows, easing)
- [ ] 6.2 Add anime.js enter/exit animations for EmojiPicker panel and VoiceRecorder overlay
- [ ] 6.3 Run `pnpm run type-check` and fix all TypeScript errors
- [ ] 6.4 Run `pnpm run lint` and fix all linting issues
- [ ] 6.5 Run `pnpm run format` to format all changed files
- [ ] 6.6 Manual QA: test emoji insertion, voice record/send/play, unread badges, notes, mute, pin
