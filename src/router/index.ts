import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Public routes
    {
      path: '/login',
      component: () => import('@/layouts/AuthLayout.vue'),
      children: [
        { path: '', name: 'login', component: () => import('@/views/LoginView.vue') },
        { path: 'register', name: 'register', component: () => import('@/views/RegisterView.vue') },
        {
          path: 'forgot-password',
          name: 'forgot-password',
          component: () => import('@/views/ForgotPasswordView.vue'),
        },
      ],
      meta: { requiresGuest: true },
    },

    // Protected routes
    {
      path: '/',
      component: () => import('@/layouts/ChatLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', name: 'empty-chat', component: () => import('@/views/EmptyChatView.vue') },
        {
          path: 'chat/:conversationId',
          name: 'chat',
          component: () => import('@/views/ChatView.vue'),
        },
        { path: 'settings', name: 'settings', component: () => import('@/views/SettingsView.vue') },
        { path: 'contacts', name: 'contacts', component: () => import('@/views/ContactsView.vue') },
        {
          path: 'contacts/:userId',
          name: 'user-profile',
          component: () => import('@/views/UserProfileView.vue'),
        },
        {
          path: 'new-conversation',
          name: 'new-conversation',
          component: () => import('@/views/NewConversationView.vue'),
        },
      ],
    },

    // 404
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
    },
  ],
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Wait for auth initialization on first load
  if (!authStore.user && !authStore.isLoading) {
    await authStore.init()
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login' })
  } else if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next({ path: '/' })
  } else {
    next()
  }
})

export default router
