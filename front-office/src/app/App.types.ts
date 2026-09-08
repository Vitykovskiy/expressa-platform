export interface AppBootstrapState {
  ready: boolean;
}

export type SessionBoundaryState = "error" | "loading" | "ready";
