import { randomUUID } from "node:crypto";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { AddressInfo } from "node:net";
import { Pool } from "pg";
import { AppModule } from "../../src/app.module";
import { PostgresPushSubscriptionRepository } from "../../src/notifications/adapters/postgres-push-subscription.repository";
import { SendOrderPushUseCase } from "../../src/notifications/application/send-order-push.use-case";
import type { PushSender, PushSubscription } from "../../src/notifications/application/push-notifications.types";
import { pushSenderPort } from "../../src/notifications/notifications.module";
import { migrateDatabase } from "../../src/platform/database/migrations";
import { configureHttp } from "../../src/platform/http/http-configuration";
import { configureObservability } from "../../src/platform/observability/observability-configuration";

const databaseUrl = process.env.DATABASE_URL;
const otp = process.env.AUTH_DEVELOPMENT_OTP ?? "123456";
const phones = new Set<string>();
const subscription = {
  endpoint: `https://push.example/${randomUUID()}`,
  keys: {
    auth: Buffer.alloc(16, 7).toString("base64url"),
    p256dh: Buffer.concat([Buffer.from([4]), Buffer.alloc(64, 8)]).toString("base64url"),
  },
};

type Session = { accessToken: string; cookie: string; userId: string };
type Notification = { title: string; body: string; orderId: string };
type SentPush = { subscription: PushSubscription; notification: Notification };
type DeferredPush = {
  entered: Promise<void>;
  release: () => void;
  reject: (error: unknown) => void;
};
type HeldPush = DeferredPush & { pending: Promise<void>; signal: () => void };

class ControlledPushSender implements PushSender {
  readonly sent: SentPush[] = [];
  private readonly deferred = new Map<string, HeldPush>();

  reset(): void {
    this.sent.length = 0;
    for (const held of this.deferred.values()) held.release();
    this.deferred.clear();
  }

  hold(endpoint: string): DeferredPush {
    let entered!: () => void;
    let release!: () => void;
    let reject!: (error: unknown) => void;
    const enteredPromise = new Promise<void>((resolve) => { entered = resolve; });
    const pending = new Promise<void>((resolve, rejectPromise) => {
      release = resolve;
      reject = rejectPromise;
    });
    const deferred = { entered: enteredPromise, release, reject, pending, signal: entered };
    this.deferred.set(endpoint, deferred);
    return deferred;
  }

  async send(subscriptionValue: PushSubscription, notification: Notification): Promise<void> {
    this.sent.push({ subscription: subscriptionValue, notification });
    const deferred = this.deferred.get(subscriptionValue.endpoint);
    if (deferred !== undefined) {
      deferred.signal();
      await deferred.pending;
    }
  }
}

function newSubscription() {
  return {
    endpoint: `https://push.example/${randomUUID()}`,
    keys: {
      auth: Buffer.alloc(16, Math.floor(Math.random() * 200)).toString("base64url"),
      p256dh: Buffer.concat([Buffer.from([4]), Buffer.alloc(64, 8)]).toString("base64url"),
    },
  };
}

describe("push association E2E", () => {
  let app: INestApplication;
  let pool: Pool;
  let url: string;
  let sender: ControlledPushSender;
  let repository: PostgresPushSubscriptionRepository;
  let sendOrderPush: SendOrderPushUseCase;

  beforeAll(async () => {
    if (databaseUrl === undefined) throw new Error("DATABASE_URL is required for e2e tests");
    pool = new Pool({ connectionString: databaseUrl });
    await migrateDatabase(pool, "migrations");
    sender = new ControlledPushSender();
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(pushSenderPort)
      .useValue(sender)
      .compile();
    app = module.createNestApplication();
    repository = app.get(PostgresPushSubscriptionRepository);
    sendOrderPush = app.get(SendOrderPushUseCase);
    configureHttp(app, "local");
    configureObservability(app);
    await app.listen(0, "127.0.0.1");
    url = `http://127.0.0.1:${(app.getHttpServer().address() as AddressInfo).port}`;
  });
  afterAll(async () => { await app?.close(); await pool?.end(); });
  afterEach(async () => {
    sender?.reset();
    const values = [...phones]; phones.clear();
    if (values.length > 0) {
      await pool.query(
        "DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE phone_e164 = ANY($1::text[]))",
        [values],
      );
      await pool.query("DELETE FROM users WHERE phone_e164 = ANY($1::text[])", [values]);
    }
  });

  it("requires customer authority and transfers a proven versioned association", async () => {
    expect((await request("/push/subscriptions/inspect", undefined, "POST", subscription)).status).toBe(401);
    const customerA = await login();
    const customerB = await login();
    expect((await request("/push/subscriptions", customerA, "PUT", subscription)).status).toBe(204);
    const inspection = await request("/push/subscriptions/inspect", customerB, "POST", subscription);
    expect(inspection.headers.get("cache-control")).toBe("no-store");
    const before = (await inspection.json()) as { association: string; version: string };
    expect(before.association).toBe("other");
    expect((await request("/push/subscriptions/association", customerB, "PUT", { subscription, action: "transfer", expectedVersion: before.version })).status).toBe(200);
    expect((await request("/push/subscriptions/association", customerA, "DELETE", { subscription, expectedVersion: before.version })).status).toBe(409);
  });

  it("covers hostile proof, enable, idempotence, conflicts, two phones and A-B-A transfer", async () => {
    const customerA = await login();
    const customerB = await login();
    const first = newSubscription();
    const second = newSubscription();
    expect((await request("/push/subscriptions/association", customerA, "PUT", { subscription: first, action: "enable", expectedVersion: null })).status).toBe(200);
    const current = await inspect(customerA, first);
    expect(current.association).toBe("current");
    expect((await request("/push/subscriptions/association", customerA, "PUT", { subscription: first, action: "enable", expectedVersion: null })).status).toBe(200);
    await expect((await request("/push/subscriptions/inspect", customerB, "POST", { ...first, keys: { ...first.keys, auth: Buffer.alloc(16, 1).toString("base64url") } })).json()).resolves.toEqual({ association: "none", version: null });
    await expect((await request("/push/subscriptions/inspect", customerB, "POST", { ...first, endpoint: `${first.endpoint}/guessed` })).json()).resolves.toEqual({ association: "none", version: null });
    const other = await inspect(customerB, first);
    expect(other.association).toBe("other");
    expect(JSON.stringify(other)).not.toContain("customer");
    expect((await request("/push/subscriptions/association", customerB, "PUT", { subscription: first, action: "transfer", expectedVersion: randomUUID() })).status).toBe(409);
    expect((await inspect(customerA, first)).association).toBe("current");
    expect((await request("/push/subscriptions", customerB, "PUT", first)).status).toBe(204);
    expect((await inspect(customerA, first)).association).toBe("current");
    expect((await request("/push/subscriptions/association", customerA, "PUT", { subscription: second, action: "enable", expectedVersion: null })).status).toBe(200);
    expect((await inspect(customerA, second)).association).toBe("current");
    expect((await request("/push/subscriptions/association", customerB, "PUT", { subscription: first, action: "transfer", expectedVersion: other.version })).status).toBe(200);
    const bCurrent = await inspect(customerB, first);
    expect((await request("/push/subscriptions/association", customerA, "PUT", { subscription: first, action: "transfer", expectedVersion: bCurrent.version })).status).toBe(200);
    const aAgain = await inspect(customerA, first);
    expect(aAgain.association).toBe("current");
    expect((await request("/push/subscriptions/association", customerB, "DELETE", { subscription: first, expectedVersion: aAgain.version })).status).toBe(409);
    expect((await request("/push/subscriptions/association", customerA, "DELETE", { subscription: first, expectedVersion: aAgain.version })).status).toBe(204);
  });

  it("denies staff association routes and does not expose another customer's saved association", async () => {
    const staff = await login("barista");
    expect((await request("/push/subscriptions/inspect", staff, "POST", newSubscription())).status).toBe(403);
    const firstSession = await login();
    const saved = newSubscription();
    expect((await request("/push/subscriptions/association", firstSession, "PUT", { subscription: saved, action: "enable", expectedVersion: null })).status).toBe(200);
    const secondSession = await login();
    expect((await inspect(secondSession, saved)).association).toBe("other");
  });

  it("retains both device associations and real fan-out after authenticated HTTP logout", async () => {
    const customer = await login();
    const first = newSubscription();
    const second = newSubscription();
    await associate(customer, first, "enable", null);
    await associate(customer, second, "enable", null);
    const before = await Promise.all([row(first.endpoint), row(second.endpoint)]);
    const logout = await request("/auth/logout", undefined, "POST", undefined, customer.cookie);
    expect(logout.status).toBe(204);
    expect((await request("/auth/refresh", undefined, "POST", undefined, customer.cookie)).status).toBe(401);
    expect(await Promise.all([row(first.endpoint), row(second.endpoint)])).toEqual(before);
    await dispatch(customer, "READY");
    expect(sender.sent.map(({ subscription: value }) => value.endpoint).sort()).toEqual([first.endpoint, second.endpoint].sort());
    expect(sender.sent.map(({ notification }) => notification)).toEqual([
      { title: "Заказ 42", body: "Заказ готов", orderId: "order-42" },
      { title: "Заказ 42", body: "Заказ готов", orderId: "order-42" },
    ]);
  });

  it.each([
    ["ACCEPTED", "Заказ принят"],
    ["READY", "Заказ готов"],
    ["ISSUED", "Заказ выдан"],
  ] as const)("fans out exact %s payload only to the customer's devices", async (stage, body) => {
    const customerA = await login();
    const customerB = await login();
    const first = newSubscription(); const second = newSubscription(); const foreign = newSubscription();
    await associate(customerA, first, "enable", null); await associate(customerA, second, "enable", null); await associate(customerB, foreign, "enable", null);
    await dispatch(customerA, stage);
    expect(sender.sent).toHaveLength(2);
    expect(sender.sent.map(({ subscription: value }) => value.endpoint).sort()).toEqual([first.endpoint, second.endpoint].sort());
    expect(sender.sent.map(({ notification }) => notification)).toEqual([
      { title: "Заказ 42", body, orderId: "order-42" }, { title: "Заказ 42", body, orderId: "order-42" },
    ]);
  });

  it.each([404, 410] as const)("removes unchanged association on delayed %i", async (statusCode) => {
    const customer = await login(); const stale = newSubscription(); const unaffected = newSubscription();
    await associate(customer, stale, "enable", null); await associate(customer, unaffected, "enable", null);
    await dispatchDuringMutation(customer, stale.endpoint, statusCode, async () => undefined);
    expect(await row(stale.endpoint)).toBeNull();
    expect(await row(unaffected.endpoint)).not.toBeNull();
    expect(sender.sent.map(({ subscription: value }) => value.endpoint).sort()).toEqual([stale.endpoint, unaffected.endpoint].sort());
  });

  it.each([404, 410] as const)("keeps replacement association after delayed %i for rotation", async (statusCode) => {
    const customerA = await login(); const stale = newSubscription();
    await associate(customerA, stale, "enable", null); const old = await row(stale.endpoint); expect(old).not.toBeNull();
    const fresh = await dispatchDuringMutation(customerA, stale.endpoint, statusCode, async () => {
      const rotated = { ...stale, keys: { auth: Buffer.alloc(16, 21).toString("base64url"), p256dh: Buffer.concat([Buffer.from([4]), Buffer.alloc(64, 22)]).toString("base64url") } };
      expect((await request("/push/subscriptions", customerA.accessToken, "PUT", rotated)).status).toBe(204);
      return row(stale.endpoint);
    });
    expect(fresh).not.toBeNull(); expect(fresh!.associationVersion).not.toBe(old!.associationVersion); expect(await row(stale.endpoint)).toEqual(fresh);
    sender.reset(); await dispatch(customerA, "READY"); expect(sender.sent.map(({ subscription: value }) => value.endpoint)).toEqual([stale.endpoint]);
  });

  it.each([404, 410] as const)("keeps replacement association after delayed %i for transfer", async (statusCode) => {
    const customerA = await login(); const customerB = await login(); const stale = newSubscription();
    await associate(customerA, stale, "enable", null); const old = await row(stale.endpoint); expect(old).not.toBeNull();
    const fresh = await dispatchDuringMutation(customerA, stale.endpoint, statusCode, async () => {
      const inspection = await inspect(customerB.accessToken, stale); await associate(customerB, stale, "transfer", inspection.version);
      return row(stale.endpoint);
    });
    expect(fresh).not.toBeNull(); expect(fresh!.userId).toBe(customerB.userId); expect(fresh!.associationVersion).not.toBe(old!.associationVersion); expect(await row(stale.endpoint)).toEqual(fresh);
    sender.reset(); await dispatch(customerA, "READY"); expect(sender.sent).toHaveLength(0); await dispatch(customerB, "READY"); expect(sender.sent.map(({ subscription: value }) => value.endpoint)).toEqual([stale.endpoint]);
  });

  it.each([404, 410] as const)("keeps replacement association after delayed %i for recreation", async (statusCode) => {
    const customerA = await login(); const stale = newSubscription();
    await associate(customerA, stale, "enable", null); const old = await row(stale.endpoint); expect(old).not.toBeNull();
    const fresh = await dispatchDuringMutation(customerA, stale.endpoint, statusCode, async () => {
      expect((await request("/push/subscriptions/association", customerA.accessToken, "DELETE", { subscription: stale, expectedVersion: old!.associationVersion })).status).toBe(204);
      const recreated = { ...stale, keys: { auth: Buffer.alloc(16, 31).toString("base64url"), p256dh: Buffer.concat([Buffer.from([4]), Buffer.alloc(64, 32)]).toString("base64url") } };
      await associate(customerA, recreated, "enable", null); return row(stale.endpoint);
    });
    expect(fresh).not.toBeNull(); expect(fresh!.id).not.toBe(old!.id); expect(await row(stale.endpoint)).toEqual(fresh);
    sender.reset(); await dispatch(customerA, "READY"); expect(sender.sent.map(({ subscription: value }) => value.endpoint)).toEqual([stale.endpoint]);
  });

  async function inspect(accessToken: string | Session, value: typeof subscription): Promise<{ association: string; version: string }> {
    return (await (await request("/push/subscriptions/inspect", accessToken, "POST", value)).json()) as { association: string; version: string };
  }

  async function login(role: "barista" | "customer" = "customer"): Promise<Session> {
    const phone = `+7999${Math.floor(Math.random() * 10_000_000).toString().padStart(7, "0")}`;
    phones.add(phone);
    if (role === "barista")
      await pool.query("INSERT INTO users (phone_e164, role) VALUES ($1, 'barista')", [phone]);
    await request("/auth/otp/request", undefined, "POST", { phone });
    const response = await request("/auth/otp/verify", undefined, "POST", { phone, code: otp });
    const accessToken = ((await response.json()) as { accessToken: string }).accessToken;
    const userId = (await pool.query<{ id: string }>("SELECT id FROM users WHERE phone_e164 = $1", [phone])).rows[0]!.id;
    const refreshCookie = response.headers.get("set-cookie")?.split(";")[0];
    if (refreshCookie === undefined) throw new Error("OTP verification did not set refresh cookie");
    return { accessToken, cookie: refreshCookie, userId };
  }
  async function associate(session: Session, value: typeof subscription, action: "enable" | "transfer", expectedVersion: string | null): Promise<void> {
    expect((await request("/push/subscriptions/association", session.accessToken, "PUT", { subscription: value, action, expectedVersion })).status).toBe(200);
  }
  async function row(endpoint: string): Promise<PushSubscription | null> { return repository.findByEndpoint(endpoint); }
  async function dispatch(session: Session, stage: "ACCEPTED" | "READY" | "ISSUED"): Promise<void> {
    return sendOrderPush.execute({ recipient: "customer", customerId: session.userId, stage, orderId: "order-42", number: "42" });
  }
  async function dispatchDuringMutation<T>(session: Session, endpoint: string, statusCode: 404 | 410, mutate: () => Promise<T>): Promise<T> {
    const held = sender.hold(endpoint);
    const execution = dispatch(session, "READY");
    await held.entered;
    try {
      const result = await mutate();
      held.reject({ statusCode });
      await execution;
      return result;
    } finally {
      held.release();
      await execution;
    }
  }
  async function request(path: string, accessToken: string | Session | undefined, method: string, body?: unknown, cookie?: string): Promise<Response> {
    return fetch(`${url}/api/v2${path}`, {
      method,
      headers: { "content-type": "application/json", "x-request-id": randomUUID(), ...(accessToken === undefined ? {} : { authorization: `Bearer ${typeof accessToken === "string" ? accessToken : accessToken.accessToken}` }), ...(cookie === undefined ? {} : { cookie, origin: "http://localhost:5173" }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  }
});
