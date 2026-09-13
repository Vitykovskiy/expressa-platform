import { registerSW } from "virtual:pwa-register";

export function registerPwa(): void {
  if (!import.meta.env.PROD) {
    return;
  }

  const shouldActivateOnRefresh = isReloadNavigation();
  const updateServiceWorker: ReturnType<typeof registerSW> = registerSW({
    immediate: true,
    onNeedRefresh: () => {
      if (shouldActivateOnRefresh) {
        void updateServiceWorker();
      }
    },
  });
}

function isReloadNavigation(): boolean {
  return performance
    .getEntriesByType("navigation")
    .some((entry) => "type" in entry && entry.type === "reload");
}
