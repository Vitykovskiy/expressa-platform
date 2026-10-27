import type { AppSection } from "../layouts/AppNavigation.types";

export interface NativeIntentBinding {
  readonly ownerKey: string;
  readonly lifetime: string;
  readonly worker: globalThis.ServiceWorker;
}

export interface AppNotice {
  readonly section: AppSection;
  readonly message: string | null;
}
