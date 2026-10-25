const INTENT_LIFETIME_MS = 120000;
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
    !isUuid(payload.orderId)
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
  const orderId = event.notification.data?.orderId;

  event.notification.close();
  if (isUuid(orderId)) {
    event.waitUntil(handleOrderClick(orderId));
  }
});

function isUuid(value) {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu.test(
      value,
    )
  );
}
function isScopedWindow(client) {
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

  if (!isScopedWindow(client)) {
    return;
  }

  if (
    typeof data !== "object" ||
    data === null ||
    data.type !== INTENT_PROTOCOL ||
    !isUuid(data.lifetime) ||
    !port
  ) {
    return;
  }

  if (data.action === "claim") {
    claimView(client.id, data.lifetime);
    port.postMessage({ accepted: true });
    return;
  }

  const ownsView =
    ownedView?.clientId === client.id && ownedView.lifetime === data.lifetime;

  if (data.action === "release") {
    if (ownsView) {
      ownedView = null;
      latestIntent = null;
    }

    port.postMessage({ accepted: ownsView });
    return;
  }

  const matchesCurrentIntent =
    ownsView &&
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

  if (matchesCurrentIntent && data.action === "consume") {
    latestIntent = null;
  }

  port.postMessage({ accepted: Boolean(matchesCurrentIntent) });
}

function claimView(clientId, lifetime) {
  if (ownedView?.clientId !== clientId || ownedView.lifetime !== lifetime) {
    latestIntent = null;
  }

  ownedView = { clientId, lifetime };
}

async function handleOrderClick(orderId) {
  // Новый клик заменяет прежнее намерение; поздний ответ прежнего клика не публикуется.
  const sequence = ++clickSequence;
  latestIntent = null;
  const windows = (await self.clients.matchAll({ type: "window" })).filter(
    isScopedWindow,
  );
  const candidates = [...windows].sort(
    (left, right) => viewPriority(right) - viewPriority(left),
  );
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

  ownedView = isScopedWindow(client) && owner !== undefined ? owner : null;

  if (client && ownedView) {
    latestIntent = {
      type: "expressa-order-click",
      id: self.crypto.randomUUID(),
      orderId,
      lifetime: ownedView.lifetime,
      expiresAt: Date.now() + INTENT_LIFETIME_MS,
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

function viewPriority(client) {
  if (client.id === ownedView?.clientId) {
    return 2;
  }

  if (client.focused) {
    return 1;
  }

  return 0;
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
        isUuid(data.lifetime)
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
