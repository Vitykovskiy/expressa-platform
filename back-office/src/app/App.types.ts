export interface NativeIntentBinding {
  readonly ownerKey: string;
  readonly lifetime: string;
  readonly worker: globalThis.ServiceWorker;
}
