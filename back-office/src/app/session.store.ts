import { defineStore } from 'pinia'

export type StaffRole = 'admin' | 'manager' | 'barista'

type SessionStatus = 'anonymous' | 'authenticated'

interface SessionState {
  role: StaffRole | null
  status: SessionStatus
}

export const useSessionStore = defineStore('session', {
  state: (): SessionState => ({
    role: null,
    status: 'anonymous',
  }),
  getters: {
    isAuthenticated: (state): boolean => state.status === 'authenticated',
  },
  actions: {
    setAuthenticated(role: StaffRole): void {
      this.role = role
      this.status = 'authenticated'
    },
    clear(): void {
      this.role = null
      this.status = 'anonymous'
    },
  },
})
