import { defineStore } from 'pinia'

import type { ScreenError } from '../shared/ui/screen-error'

interface AppState {
  screenError: ScreenError | null
}

export const useAppStore = defineStore('app', {
  state: (): AppState => ({
    screenError: null,
  }),
  actions: {
    showScreenError(error: ScreenError): void {
      this.screenError = error
    },
    clearScreenError(): void {
      this.screenError = null
    },
  },
})
