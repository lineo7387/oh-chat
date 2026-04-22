# oh-chat Foundation Design

## Tech Stack
- Vue 3.5 + Vite + TypeScript
- Tailwind CSS v4 (CSS-first @theme configuration)
- Pinia (state management)
- Vue Router (SPA routing)
- Supabase (backend: PostgreSQL + Realtime + Auth)
- Anime.js (animations)
- Phosphor Icons Vue (fill variant)

## Architecture

### Routing
```
/login              AuthLayout → LoginView
/login/register     AuthLayout → RegisterView
/login/forgot-password AuthLayout → ForgotPasswordView
/                   ChatLayout → EmptyChatView
/chat/:id           ChatLayout → ChatView
/settings           ChatLayout → SettingsView
/contacts           ChatLayout → ContactsView
/contacts/:userId   ChatLayout → UserProfileView
/new-conversation   ChatLayout → NewConversationView
*                   NotFoundView
```

### Layout Strategy
- **AuthLayout**: Centered single card with organic blob background
- **ChatLayout**: Two-column layout (Sidebar + Main), responsive for mobile
- **Sidebar**: Fixed width on desktop, slide-out drawer on mobile

### Design Tokens
All defined in `src/assets/main.css` via `@theme`:
- Colors: background (#FDFCF8), foreground (#2C2C24), primary (#5D7052), secondary (#C18C5D), accent (#E6DCCD), muted (#F0EBE5), border (#DED8CF), destructive (#A85448)
- Fonts: Fraunces (headings 600-800), Nunito (body)
- Shadows: shadow-soft, shadow-float, shadow-hover
- Easing: ease-organic `cubic-bezier(0.22, 1, 0.36, 1)`

### Global Texture
Fixed noise overlay on body at 4% opacity with `mix-blend-mode: multiply`

### Animation Principles
- Duration: 200-700ms
- Never use `linear` or default `ease-in`
- Hover: scale-105 or -translate-y-1 (not both)
- Active: scale-95
- Blob backgrounds: 15-22s slow float cycle
