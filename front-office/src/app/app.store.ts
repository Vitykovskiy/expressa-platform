import type { ScreenError } from "../shared/ui/screen-error.types";
import type { AppState } from "./app.store.types";
import { defineStore } from "pinia";

export const useAppStore = defineStore("app", {
  state: (): AppState => ({
    screenError: null,
  }),
  actions: {
    showScreenError(error: ScreenError): void {
      this.screenError = error;
    },
    clearScreenError(): void {
      this.screenError = null;
    },
  },
});
