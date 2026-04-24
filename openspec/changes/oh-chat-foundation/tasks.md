# oh-chat Foundation Tasks

## Completed

- [x] **Rename design.md** — `desgin.md` → `design.md`
- [x] **Install dependencies** — pnpm install tailwindcss, @tailwindcss/vite, @supabase/supabase-js, animejs, @phosphor-icons/vue, @fontsource/fraunces, @fontsource/nunito, clsx, tailwind-merge
- [x] **Configure Vite** — Add `@tailwindcss/vite` plugin to vite.config.ts
- [x] **Update openspec config** — Add project context with tech stack and design tokens
- [x] **Update .gitignore** — Add .env patterns
- [x] **Create .env.example** — VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
- [x] **Create main.css** — Tailwind v4 @theme, global styles, noise texture, scrollbar, selection, blob animation keyframes, organic shape utilities
- [x] **Update main.ts** — Import main.css
- [x] **Create lib/utils.ts** — `cn()` helper with clsx + tailwind-merge
- [x] **Create types/index.ts** — Profile, Conversation, ConversationParticipant, Message, MessageReaction, Attachment interfaces
- [x] **Create types/database.ts** — Supabase Database type definitions
- [x] **Create composables/useSupabase.ts** — Supabase client initialization
- [x] **Create stores/auth.ts** — Pinia auth store with signUp, signIn, signOut, fetchProfile, onAuthStateChange listener
- [x] **Create stores/chat.ts** — Pinia chat store with conversations, messages, currentConversation state
- [x] **Create router/index.ts** — Full routing with AuthLayout/ChatLayout, route guards (requiresAuth/requiresGuest)
- [x] **Create layouts/AuthLayout.vue** — Centered card with blob background
- [x] **Create layouts/ChatLayout.vue** — Two-column layout with mobile sidebar toggle
- [x] **Create components/layout/Sidebar.vue** — Avatar header, search, conversation list placeholder, new chat/settings buttons
- [x] **Create components/ui/Button.vue** — 4 variants (primary/secondary/outline/ghost), 3 sizes, hover/active animations
- [x] **Create components/ui/Input.vue** — Pill input with prefix slot, error state, focus ring
- [x] **Create components/ui/Card.vue** — Rounded card with asymmetric corner options
- [x] **Create components/ui/Avatar.vue** — Image/fallback/initials with online status dot
- [x] **Create composables/useAnimation.ts** — Anime.js wrappers: animateEnter, animateMessageIn, animateBlob, animateScalePress, animateSlideIn
- [x] **Create components/effects/BlobBackground.vue** — Configurable blob shapes with CSS float animation
- [x] **Create views/LoginView.vue** — Email/password form with design system styling
- [x] **Create views/RegisterView.vue** — Username/email/password/confirm form
- [x] **Create views/ForgotPasswordView.vue** — Email input with confirmation state
- [x] **Create views/EmptyChatView.vue** — Welcome screen with blob background, icon, description, CTA button

## Completed (continued)

- [x] **Fix ChatLayout.vue** — Add missing `PhList` import from @phosphor-icons/vue
- [x] **Create views/ChatView.vue** — Message list area, input area, conversation header (skeleton)
- [x] **Create views/SettingsView.vue** — Tab-based layout with profile/account/appearance tabs (skeleton)
- [x] **Create views/ContactsView.vue** — Contact list (skeleton)
- [x] **Create views/UserProfileView.vue** — User profile display (skeleton)
- [x] **Create views/NewConversationView.vue** — Search users + start conversation (skeleton)
- [x] **Create views/NotFoundView.vue** — 404 page with organic style
- [x] **Fix useAnimation.ts** — Migrate to animejs v4 API (`animate`, `cubicBezier`, `utils`)
- [x] **Fix ESLint config** — Disable `vue/multi-word-component-names`, allow `_` prefix unused vars
- [x] **Build verification** — pnpm run type-check, lint, format, build all pass

## Completed (continued)

- [x] **Supabase database setup** — Create tables, RLS policies, realtime subscriptions
- [x] **Load real conversations** — Sidebar fetches and displays conversations from Supabase with participant info and last message preview
- [x] **Real-time message sync** — Integrate Supabase Realtime for live messages
- [x] **New conversation flow** — Search users and create direct conversations via NewConversationView
- [x] **Real message loading & sending** — ChatView loads messages from DB and sends via Supabase
- [x] **File upload** — Attachment support via Supabase Storage (Storage bucket, upload UI, image/file display in messages)
- [x] **Friends system** — `friends` table + RLS, friend store, ContactsView with real data, friend requests (accept/decline), UserProfileView add-friend actions, Sidebar Contacts entry with badge

## Pending

- [ ] **OAuth authentication** — Google/GitHub login
