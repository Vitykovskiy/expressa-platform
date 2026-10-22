const INTENT_LIFETIME = 120000;
const INTENT_PROTOCOL = "expressa-order-intent";
const VIEW_REPLY_TIMEOUT = 2000;
let ownedView = null;
let latestIntent = null;
let clickSequence = 0;

self.addEventListener("install", () => {
  void self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener("push", (event) => {
  let payload;

  try {
    payload = event.data?.json();
  } catch {
    return;
  }

  if (
    typeof payload !== "object" ||
    payload === null ||
    typeof payload.title !== "string" ||
    typeof payload.body !== "string" ||
    !isId(payload.orderId)
  ) {
    return;
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      data: { orderId: payload.orderId },
    }),
  );
});
self.addEventListener("message", (event) => {
  event.waitUntil(handleMessage(event));
});
self.addEventListener("notificationclick", (event) => {
  const id = event.notification.data?.orderId;

  event.notification.close();
  if (isId(id)) {
    event.waitUntil(openOrder(id));
  }
});

function isId(value) {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu.test(
      value,
    )
  );
}
function scopedWindow(client) {
  if (client?.type !== "window") {
    return false;
  }

  const url = new URL(client.url);

  return url.origin === self.location.origin && url.pathname === "/";
}
async function handleMessage(event) {
  const data = event.data;
  const port = event.ports[0];
  const client = event.source?.id
    ? await self.clients.get(event.source.id)
    : null;

  if (
    !scopedWindow(client) ||
    typeof data !== "object" ||
    data === null ||
    data.type !== INTENT_PROTOCOL ||
    !isId(data.lifetime) ||
    !port
  ) {
    return;
  }

  if (data.action === "claim") {
    if (
      ownedView?.clientId !== client.id ||
      ownedView.lifetime !== data.lifetime
    ) {
      latestIntent = null;
    }

    ownedView = { clientId: client.id, lifetime: data.lifetime };
    port.postMessage({ accepted: true });
    return;
  }

  const owned =
    ownedView?.clientId === client.id && ownedView.lifetime === data.lifetime;

  if (data.action === "release") {
    if (owned) {
      ownedView = null;
      latestIntent = null;
    }

    port.postMessage({ accepted: owned });
    return;
  }

  const current =
    owned &&
    latestIntent !== null &&
    latestIntent.expiresAt > Date.now() &&
    data.intent?.id === latestIntent.id &&
    data.intent.orderId === latestIntent.orderId &&
    data.intent.lifetime === latestIntent.lifetime &&
    data.intent.expiresAt === latestIntent.expiresAt;

  if (data.action !== "inspect" && data.action !== "consume") {
    port.postMessage({ accepted: false });
    return;
  }

  if (current && data.action === "consume") {
    latestIntent = null;
  }

  port.postMessage({ accepted: Boolean(current) });
}
async function openOrder(orderId) {
  const sequence = ++clickSequence;
  latestIntent = null;
  const windows = (await self.clients.matchAll({ type: "window" })).filter(
    scopedWindow,
  );
  const candidates = [...windows].sort((left, right) => {
    const priority = (client) =>
      client.id === ownedView?.clientId ? 2 : client.focused ? 1 : 0;

    return priority(right) - priority(left);
  });
  const replies = await Promise.all(candidates.map(recoverView));

  if (sequence !== clickSequence) {
    return;
  }

  const owner = replies.find((reply) => reply !== null);
  const client =
    owner === undefined ? undefined : await self.clients.get(owner.clientId);

  if (sequence !== clickSequence) {
    return;
  }

  ownedView = scopedWindow(client) && owner !== undefined ? owner : null;

  if (client && ownedView) {
    latestIntent = {
      type: "expressa-order-click",
      id: self.crypto.randomUUID(),
      orderId,
      lifetime: ownedView.lifetime,
      expiresAt: Date.now() + INTENT_LIFETIME,
    };
    client.postMessage(latestIntent);
    await client.focus();
    return;
  }

  if (windows.length > 0) {
    await windows[0].focus();
    return;
  }

  await self.clients.openWindow(`/?order=${encodeURIComponent(orderId)}`);
}

function recoverView(client) {
  return new Promise((resolve) => {
    const challenge = self.crypto.randomUUID();
    const channel = new MessageChannel();
    const timer = setTimeout(() => finish(null), VIEW_REPLY_TIMEOUT);

    function finish(owner) {
      clearTimeout(timer);
      channel.port1.close();
      channel.port2.close();
      resolve(owner);
    }

    channel.port1.onmessage = (event) => {
      const data = event.data;

      if (
        typeof data === "object" &&
        data !== null &&
        data.type === "expressa-view-response" &&
        data.challenge === challenge &&
        isId(data.lifetime)
      ) {
        finish({ clientId: client.id, lifetime: data.lifetime });
      } else {
        finish(null);
      }
    };
    try {
      client.postMessage({ type: "expressa-view-request", challenge }, [
        channel.port2,
      ]);
    } catch {
      finish(null);
    }
  });
}
