import { defineStore } from "pinia";

type SessionStatus = "anonymous" | "authenticated";

interface SessionState {
  phone: string | null;
  status: SessionStatus;
}

export const useSessionStore = defineStore("session", {
  state: (): SessionState => ({
    phone: null,
    status: "anonymous",
  }),
  actions: {
    setAuthenticated(phone: string): void {
      this.phone = phone;
      this.status = "authenticated";
    },
    clear(): void {
      this.phone = null;
      this.status = "anonymous";
    },
  },
});
