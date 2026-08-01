import type { StaffRole } from './session.store'

export interface NavigationItem {
  label: string
  path: string
  roles: readonly StaffRole[]
}

export const navigationItems: readonly NavigationItem[] = [
  { label: 'Очередь', path: '/queue', roles: ['admin', 'manager', 'barista'] },
  { label: 'Доступность', path: '/availability', roles: ['admin', 'manager', 'barista'] },
  { label: 'Меню', path: '/menu', roles: ['admin', 'manager'] },
]

export function navigationItemsForRole(role: StaffRole | null): readonly NavigationItem[] {
  if (role === null) {
    return []
  }

  return navigationItems.filter((item) => item.roles.includes(role))
}
