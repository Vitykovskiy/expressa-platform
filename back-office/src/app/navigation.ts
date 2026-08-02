export interface NavigationItem {
  label: string
  path: string
}

export const navigationItems: readonly NavigationItem[] = [
  { label: 'Очередь', path: '/queue' },
  { label: 'Доступность', path: '/availability' },
  { label: 'Меню', path: '/menu' },
]
