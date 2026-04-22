# oh-chat Foundation

## Summary
Build the complete project foundation for oh-chat, a real-time social chat web application with an organic/natural (wabi-sabi) design aesthetic.

## Goals
- Set up Vue 3 + Vite + TypeScript + Tailwind CSS v4 + Pinia + Vue Router
- Integrate Supabase client and define database types
- Implement the organic design system from design.md
- Create layout components, base UI components, and view page skeletons
- Establish routing with auth guards

## Scope
### In Scope
- Tailwind v4 configuration with design tokens
- Global styles (fonts, textures, scrollbar, selection)
- Supabase client setup and Pinia auth/chat stores
- AuthLayout, ChatLayout, Sidebar
- UI primitives: Button, Input, Card, Avatar
- View pages: Login, Register, ForgotPassword, EmptyChat (fully styled)
- View pages: Chat, Settings, Contacts, UserProfile, NewConversation, NotFound (skeletons)
- Animation utilities and BlobBackground component
- Router with navigation guards

### Out of Scope
- Supabase database setup and RLS policies (done separately)
- Real-time message subscriptions
- File upload functionality
- OAuth authentication
- Push notifications

## Decisions
- Tailwind v4 with CSS-first configuration (no tailwind.config.js)
- shadcn-vue only for complex components (Dialog, Dropdown, Toast) — not in foundation
- Anime.js for animations
- Phosphor Icons (fill variant)
- Local fonts via @fontsource
- pnpm for package management
- oxfmt for formatting (not Prettier)
