import { nativeRead, ownedActive } from "../shared/browser/web-push";
import { isRecord } from "../shared/api/transport";
import { clickConfirmationTimeoutMs } from "./notification-click.constants";
import {
  staffClickConfirmationType,
  staffClickType,
  staffOrderPattern,
} from "./staff-push.worker.constants";
import type { NotificationClickIntent } from "./staff-push.worker.types";
import type {
  ClickReceipt,
  NotificationClickOptions,
} from "./notification-click.types";

function parse(value: unknown): NotificationClickIntent | null {
  if (
    !isRecord(value) ||
    value.type !== staffClickType ||
    typeof value.epoch !== "string" ||
    !staffOrderPattern.test(value.epoch) ||
    typeof value.orderId !== "string" ||
    !staffOrderPattern.test(value.orderId) ||
    typeof value.sequence !== "number" ||
    !Number.isSafeInteger(value.sequence) ||
    value.sequence <= 0
  )
    return null;

  return {
    type: staffClickType,
    epoch: value.epoch,
    orderId: value.orderId,
    sequence: value.sequence,
  };
}

export function listenForNotificationClick(options: NotificationClickOptions) {
  let disposed = false;
  let generation = 0;
  let latest: ClickReceipt | null = null;
  let received: NotificationClickIntent | null = null;
  let cancel: (() => void) | null = null;
  let reads = new AbortController();

  async function active(source: ServiceWorker) {
    const registration = await nativeRead(
      navigator.serviceWorker.getRegistration(options.owner.scope),
      reads.signal,
    );

    return (
      !disposed &&
      registration !== undefined &&
      ownedActive(registration, options.owner) &&
      registration.active === source
    );
  }

  async function confirm(receipt: ClickReceipt, version: number) {
    if (!(await active(receipt.source)) || disposed || version !== generation)
      return false;

    return new Promise<boolean>((resolve) => {
      const channel = new MessageChannel();
      const timer = setTimeout(() => settle(false), clickConfirmationTimeoutMs);
      const abort = () => settle(false);

      function settle(confirmed: boolean) {
        clearTimeout(timer);
        channel.port1.onmessage = null;
        channel.port1.close();
        channel.port2.close();
        if (cancel === abort) cancel = null;
        resolve(confirmed);
      }

      cancel?.();
      cancel = abort;
      channel.port1.onmessage = (event: MessageEvent<unknown>) =>
        settle(isRecord(event.data) && event.data.confirmed === true);
      try {
        receipt.source.postMessage(
          {
            type: staffClickConfirmationType,
            epoch: receipt.intent.epoch,
            sequence: receipt.intent.sequence,
            orderId: receipt.intent.orderId,
          },
          [channel.port2],
        );
      } catch {
        settle(false);
      }
    });
  }

  async function receive(event: MessageEvent<unknown>) {
    const intent = parse(event.data);
    const source = event.source;

    if (
      disposed ||
      intent === null ||
      !(source instanceof ServiceWorker) ||
      source.scriptURL !== options.owner.scriptURL ||
      event.origin !== window.location.origin
    )
      return;
    if (
      received?.epoch === intent.epoch &&
      received.sequence >= intent.sequence
    )
      return;

    received = intent;
    const version = ++generation;
    const interaction = options.interaction();
    const lifetime = options.lifetime();
    const receipt = { intent, source };

    cancel?.();
    try {
      if (
        !(await confirm(receipt, version)) ||
        !(await active(source)) ||
        disposed ||
        generation !== version ||
        lifetime !== options.lifetime()
      )
        return;
      if (
        latest?.intent.epoch === intent.epoch &&
        latest.intent.sequence >= intent.sequence
      )
        return;

      latest = receipt;
      options.receive(intent, interaction !== options.interaction());
    } catch {
      // Missing current-source confirmation has no navigation fallback.
    }
  }

  if ("serviceWorker" in navigator)
    navigator.serviceWorker.addEventListener("message", receive);

  return {
    async confirmCurrent(intent: NotificationClickIntent) {
      const captured = latest;
      const version = generation;

      if (captured === null || captured.intent !== intent) return false;
      try {
        return (
          (await confirm(captured, version)) &&
          (await active(captured.source)) &&
          version === generation &&
          latest === captured &&
          !disposed
        );
      } catch {
        return false;
      }
    },
    invalidate() {
      generation += 1;
      reads.abort();
      reads = new AbortController();
      cancel?.();
      latest = null;
      received = null;
    },
    dispose() {
      disposed = true;
      generation += 1;
      reads.abort();
      cancel?.();
      if ("serviceWorker" in navigator)
        navigator.serviceWorker.removeEventListener("message", receive);
      latest = null;
      received = null;
    },
  };
}
