import { PUSH_WORKER_PATH } from "../entities/notifications/notifications.constants";
import {
  LEGACY_ENTRY_SECTIONS,
  LEGACY_WORKER_PATH,
} from "./legacy-entry.constants";

export function normalizeLegacyEntry() {
  const url = new URL(globalThis.location.href);
  const section = LEGACY_ENTRY_SECTIONS.get(url.pathname);

  if (section === undefined) {
    return;
  }

  url.pathname = "/";

  if (!url.searchParams.has("section")) {
    url.searchParams.set("section", section);
  }

  globalThis.history.replaceState(globalThis.history.state, "", url);
}

export async function recoverLegacyWorker() {
  if (
    !globalThis.isSecureContext ||
    !("serviceWorker" in globalThis.navigator)
  ) {
    return;
  }

  try {
    const registration =
      await globalThis.navigator.serviceWorker.getRegistration("/");
    const origin = globalThis.location.origin;

    if (
      registration?.scope !== `${origin}/` ||
      registration.active?.scriptURL !==
        new URL(LEGACY_WORKER_PATH, origin).href
    ) {
      return;
    }

    await globalThis.navigator.serviceWorker.register(PUSH_WORKER_PATH, {
      scope: "/",
      updateViaCache: "none",
    });
  } catch {
    // Worker recovery is retried on the next normal entry; the network UI stays usable.
  }
}
