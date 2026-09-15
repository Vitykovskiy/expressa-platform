import { defineStore } from "pinia";

import {
  createPushApi,
  type PushSubscriptionRequest,
} from "@/shared/api/push.api";
import type { LogoutPushSubscription } from "@/shared/api/auth.api.types";
import { initialOrderNotificationsState } from "./order-notifications.store.constants";
import { getOrderNotificationsDependencies } from "./order-notifications.store.dependencies";
import type { OrderNotificationsState } from "./order-notifications.store.types";

const operationLocks = new WeakMap<object, Promise<void>>();

export const useOrderNotificationsStore = defineStore("order-notifications", {
  state: (): OrderNotificationsState => ({ ...initialOrderNotificationsState }),
  actions: {
    setSession(accountId: string | null, accessToken: string | null): void {
      if (this.accountId === accountId && this.accessToken === accessToken)
        return;
      this.generation += 1;
      this.accountId = accountId;
      this.accessToken = accessToken;
      this.operation = null;
      this.publicKey = null;
      this.version = null;
      this.subscription = null;
      this.state = "checking";
    },
    async inspect(): Promise<void> {
      if (this.operation !== null || operationLocks.has(this)) return;
      const snapshot = this.snapshot();
      if (!supportsPush()) {
        if (this.owns(snapshot)) this.state = "unsupported";
        return;
      }
      if (Notification.permission === "denied") {
        if (this.owns(snapshot)) this.state = "denied";
        return;
      }
      this.operation = "inspect";
      this.state = "checking";
      this.subscription = null;
      this.version = null;
      const work = (async () => {
        try {
          if (snapshot.accessToken !== null && snapshot.accountId !== null) {
            const dependencies = getOrderNotificationsDependencies();
            const publicKey = await dependencies.readProtected((accessToken) =>
              createPushApi(dependencies.apiClient).getPublicKey(accessToken),
            );
            if (!this.owns(snapshot)) return;
            this.publicKey = publicKey;
          }
          const subscription = await getBrowserSubscription();
          if (!this.owns(snapshot)) return;
          if (subscription === null) {
            this.state =
              this.accountId === null ? "anonymous_off" : "off_current";
            return;
          }
          this.subscription = subscription;
          if (snapshot.accessToken === null || snapshot.accountId === null) {
            this.state = "anonymous_subscription";
            return;
          }
          const dependencies = getOrderNotificationsDependencies();
          const inspection = await dependencies.readProtected((accessToken) =>
            createPushApi(dependencies.apiClient).inspectSubscription(
              accessToken,
              subscription,
            ),
          );
          if (!this.owns(snapshot)) return;
          this.version = inspection.version;
          this.state =
            inspection.association === "current"
              ? "on_current"
              : inspection.association === "other"
                ? "other_account"
                : "off_current";
        } catch {
          if (this.owns(snapshot)) this.state = "failed_check";
        } finally {
          if (this.owns(snapshot)) this.operation = null;
        }
      })();
      operationLocks.set(this, work);
      try {
        await work;
      } finally {
        operationLocks.delete(this);
      }
    },
    async readLogoutPushSubscription(): Promise<LogoutPushSubscription | null> {
      if (!supportsPush()) return null;

      return getBrowserSubscription();
    },
    async enable(transfer = false): Promise<void> {
      if (
        this.operation !== null ||
        this.accessToken === null ||
        this.accountId === null
      )
        return;
      if (operationLocks.has(this)) return;
      if (!supportsPush()) {
        this.state = "unsupported";
        return;
      }
      if (Notification.permission === "denied") {
        this.state = "denied";
        return;
      }
      const snapshot = this.snapshot();
      const accessToken = snapshot.accessToken;
      if (accessToken === null || snapshot.accountId === null) return;
      this.operation = transfer ? "transfer" : "enable";
      const work = (async () => {
        let subscription: PushSubscriptionRequest | null = null;
        try {
          if (Notification.permission === "default") {
            const permission = await Notification.requestPermission();
            if (permission !== "granted") {
              if (this.owns(snapshot)) this.state = "denied";
              return;
            }
          }
          subscription = await getOrCreateBrowserSubscription(
            accessToken,
            snapshot.publicKey,
          );
          if (!this.owns(snapshot) || subscription === null) return;
          const response = await createPushApi(
            getOrderNotificationsDependencies().apiClient,
          ).associateSubscription(accessToken, {
            action: transfer ? "transfer" : "enable",
            expectedVersion: transfer ? snapshot.version : null,
            subscription,
          });
          if (!this.owns(snapshot) || subscription === null) return;
          this.subscription = subscription;
          this.version = response.version;
          this.state = "on_current";
        } catch {
          if (!this.owns(snapshot)) return;
          if (subscription === null) {
            this.state = "failed_enable";
            return;
          }
          try {
            const currentSubscription = subscription;
            const dependencies = getOrderNotificationsDependencies();
            const inspection = await dependencies.readProtected((token) =>
              createPushApi(dependencies.apiClient).inspectSubscription(
                token,
                currentSubscription,
              ),
            );
            if (!this.owns(snapshot)) return;
            if (inspection.association === "current") {
              this.subscription = currentSubscription;
              this.version = inspection.version;
              this.state = "on_current";
              return;
            }
          } catch {
            // Reinspection failure leaves the explicit retry state below.
          }
          if (this.owns(snapshot)) this.state = "failed_enable";
        } finally {
          if (this.owns(snapshot)) this.operation = null;
        }
      })();
      operationLocks.set(this, work);
      try {
        await work;
      } finally {
        operationLocks.delete(this);
      }
    },
    async disable(): Promise<void> {
      if (this.operation !== null || this.subscription === null) return;
      if (operationLocks.has(this)) return;
      const snapshot = this.snapshot();
      const subscription = snapshot.subscription;
      if (subscription === null) return;
      this.operation = "disable";
      const work = (async () => {
        let serverStopped = false;
        let localStopped: boolean;
        try {
          if (
            snapshot.state === "on_current" &&
            snapshot.accessToken !== null &&
            snapshot.version !== null
          ) {
            await createPushApi(
              getOrderNotificationsDependencies().apiClient,
            ).deleteAssociation(snapshot.accessToken, {
              expectedVersion: snapshot.version,
              subscription,
            });
            serverStopped = true;
          }
        } catch {
          // Still attempt the local stop: it is the effective device boundary.
        }
        try {
          const browserSubscription = await navigator.serviceWorker.ready.then(
            (registration) => registration.pushManager.getSubscription(),
          );
          if (browserSubscription === null) localStopped = true;
          else {
            await browserSubscription.unsubscribe();
            const observed = await navigator.serviceWorker.ready.then(
              (registration) => registration.pushManager.getSubscription(),
            );
            localStopped = observed === null;
          }
        } catch {
          localStopped = false;
        }
        if (!this.owns(snapshot)) return;
        if (!localStopped && !serverStopped) {
          this.state = "failed_disable";
          this.operation = null;
          return;
        }
        if (localStopped) this.subscription = null;
        this.version = null;
        this.state = this.accountId === null ? "anonymous_off" : "off_current";
        this.operation = null;
      })();
      operationLocks.set(this, work);
      try {
        await work;
      } finally {
        operationLocks.delete(this);
      }
    },
    snapshot() {
      return {
        accountId: this.accountId,
        accessToken: this.accessToken,
        generation: this.generation,
        state: this.state,
        subscription: this.subscription,
        publicKey: this.publicKey,
        version: this.version,
      };
    },
    owns(
      snapshot: Pick<
        OrderNotificationsState,
        "accountId" | "accessToken" | "generation"
      >,
    ): boolean {
      return (
        this.accountId === snapshot.accountId &&
        this.accessToken === snapshot.accessToken &&
        this.generation === snapshot.generation
      );
    },
  },
});

function supportsPush(): boolean {
  return (
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

async function getBrowserSubscription(): Promise<PushSubscriptionRequest | null> {
  const subscription = await navigator.serviceWorker.ready.then(
    (registration) => registration.pushManager.getSubscription(),
  );
  return subscription === null ? null : toPushSubscription(subscription);
}

async function getOrCreateBrowserSubscription(
  accessToken: string,
  preparedPublicKey: string | null,
): Promise<PushSubscriptionRequest> {
  const registration = await navigator.serviceWorker.ready;
  const current = await registration.pushManager.getSubscription();
  const subscription =
    current ??
    (await registration.pushManager.subscribe({
      applicationServerKey: toApplicationServerKey(
        preparedPublicKey ??
          (await createPushApi(
            getOrderNotificationsDependencies().apiClient,
          ).getPublicKey(accessToken)),
      ),
      userVisibleOnly: true,
    }));
  return toPushSubscription(subscription);
}

function toPushSubscription(value: PushSubscription): PushSubscriptionRequest {
  const p256dh = value.getKey("p256dh");
  const auth = value.getKey("auth");
  if (p256dh === null || auth === null)
    throw new Error("Push subscription has no keys.");
  return {
    endpoint: value.endpoint,
    keys: { auth: toBase64(auth), p256dh: toBase64(p256dh) },
  };
}

function toApplicationServerKey(value: string): Uint8Array<ArrayBuffer> {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const bytes = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
  const key = new Uint8Array(new ArrayBuffer(bytes.length));
  for (const [index, character] of Array.from(bytes).entries())
    key[index] = character.charCodeAt(0);
  return key;
}

function toBase64(value: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(value)));
}
