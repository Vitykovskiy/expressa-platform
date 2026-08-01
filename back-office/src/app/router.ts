import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

import AvailabilityPage from '../pages/AvailabilityPage.vue'
import LoginPage from '../pages/LoginPage.vue'
import MenuPage from '../pages/MenuPage.vue'
import QueuePage from '../pages/QueuePage.vue'

import type { StaffRole } from './session.store'
import { useSessionStore } from './session.store'

declare module 'vue-router' {
  interface RouteMeta {
    roles?: readonly StaffRole[]
    title: string
  }
}

const staffRoles: readonly StaffRole[] = ['admin', 'manager', 'barista']

export const routes: readonly RouteRecordRaw[] = [
  { path: '/', redirect: '/queue', meta: { title: 'Expressa back-office' } },
  { path: '/login', component: LoginPage, meta: { title: 'Вход' } },
  { path: '/queue', component: QueuePage, meta: { title: 'Очередь', roles: staffRoles } },
  {
    path: '/availability',
    component: AvailabilityPage,
    meta: { title: 'Доступность', roles: staffRoles },
  },
  { path: '/menu', component: MenuPage, meta: { title: 'Меню', roles: ['admin', 'manager'] } },
]

export function createBackOfficeRouter() {
  const router = createRouter({
    history: createWebHistory(),
    routes: [...routes],
  })

  router.beforeEach((to) => {
    const allowedRoles = to.meta.roles
    if (allowedRoles === undefined) {
      return true
    }

    const sessionStore = useSessionStore()
    if (!sessionStore.isAuthenticated || sessionStore.role === null) {
      return { path: '/login' }
    }

    if (!allowedRoles.includes(sessionStore.role)) {
      return { path: '/queue' }
    }

    return true
  })

  return router
}

export const router = createBackOfficeRouter()
