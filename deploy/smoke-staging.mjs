import { randomUUID } from 'node:crypto';

const backendUrl = 'http://127.0.0.1:3000';
const apiPrefix = '/api/v1';

export async function runStagingSmoke(
  customerPhone = process.env.SMOKE_CUSTOMER_PHONE,
  baseUrl = backendUrl,
  staffPhone = process.env.SMOKE_STAFF_PHONE,
) {
  if (!isPhone(customerPhone)) throw new Error('SMOKE_CUSTOMER_PHONE is required for staging smoke');
  if (!isPhone(staffPhone)) throw new Error('SMOKE_STAFF_PHONE is required for staging smoke');

  await expectStatus(baseUrl, '/health/live', 200, 'liveness');
  await expectStatus(baseUrl, '/health/ready', 200, 'readiness');

  const customerAccessToken = await authenticate(baseUrl, customerPhone, 'customer');
  const staffAccessToken = await authenticate(baseUrl, staffPhone, 'staff');
  const order = await createOrder(baseUrl, customerAccessToken);

  await expectStatus(baseUrl, `${apiPrefix}/backoffice/orders/${order.id}/accept`, 403, 'customer accept denial', {
    method: 'POST',
    headers: { authorization: `Bearer ${customerAccessToken}` },
  });
  await expectStatus(baseUrl, `${apiPrefix}/backoffice/orders/${order.id}/issue`, 409, 'early issue', {
    method: 'POST',
    headers: { authorization: `Bearer ${staffAccessToken}` },
  });
  assertStage(await getOrder(baseUrl, order.id, staffAccessToken), 'CREATED', 'early issue');

  await expectStage(baseUrl, order.id, staffAccessToken, 'accept', 200, 'ACCEPTED', 'accept');
  await expectStage(baseUrl, order.id, staffAccessToken, 'start-preparing', 200, 'PREPARING', 'start preparing');
  await expectStage(baseUrl, order.id, staffAccessToken, 'mark-ready', 200, 'READY', 'mark ready');

  await expectStatus(baseUrl, `${apiPrefix}/backoffice/orders/${order.id}/issue`, 403, 'customer issue denial', {
    method: 'POST',
    headers: { authorization: `Bearer ${customerAccessToken}` },
  });
  assertStage(await getOrder(baseUrl, order.id, staffAccessToken), 'READY', 'customer issue denial');
  await expectStage(baseUrl, order.id, staffAccessToken, 'issue', 200, 'ISSUED', 'issue', true);
}

async function authenticate(baseUrl, phone, role) {
  await expectStatus(baseUrl, `${apiPrefix}/auth/otp/request`, 202, `${role} OTP request`, {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });
  const verified = await expectJson(baseUrl, `${apiPrefix}/auth/otp/verify`, 200, `${role} OTP verification`, {
    method: 'POST',
    body: JSON.stringify({ phone, code: '000000' }),
  });
  return readAccessToken(verified);
}

async function createOrder(baseUrl, accessToken) {
  const menu = await expectJson(baseUrl, `${apiPrefix}/public/menu`, 200, 'public menu');
  const order = createOrderRequest(menu);
  const created = await expectJson(baseUrl, `${apiPrefix}/orders`, 201, 'order creation', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'idempotency-key': randomUUID(),
    },
    body: JSON.stringify(order),
  });
  assertStage(created, 'CREATED', 'order creation');
  if (typeof created.id !== 'string' || created.id === '') {
    throw new Error('order creation: CREATED order id is missing');
  }
  return created;
}

async function expectStage(baseUrl, orderId, accessToken, action, expectedStatus, expectedStage, name, verifyEvents = false) {
  const order = await expectJson(baseUrl, `${apiPrefix}/backoffice/orders/${orderId}/${action}`, expectedStatus, name, {
    method: 'POST',
    headers: { authorization: `Bearer ${accessToken}` },
  });
  assertStage(order, expectedStage, name);
  if (verifyEvents) assertLifecycleEvents(order);
  return order;
}

async function getOrder(baseUrl, orderId, accessToken) {
  return expectJson(baseUrl, `${apiPrefix}/backoffice/orders/${orderId}`, 200, 'order details', {
    method: 'GET',
    headers: { authorization: `Bearer ${accessToken}` },
  });
}

function createOrderRequest(menu) {
  if (!isRecord(menu) || menu.acceptsNewOrders !== true || !Array.isArray(menu.categories)) {
    throw new Error('public menu: no order intake');
  }

  for (const category of menu.categories) {
    if (!isRecord(category) || !Array.isArray(category.products)) continue;
    for (const product of category.products) {
      const item = createOrderItem(product);
      if (item !== null) {
        const { totalMinor, ...orderItem } = item;
        return { expectedTotalMinor: totalMinor, items: [orderItem] };
      }
    }
  }

  throw new Error('public menu: no available orderable product');
}

function createOrderItem(product) {
  if (!isRecord(product) || product.isAvailable !== true || typeof product.id !== 'string') return null;

  const variant = product.type === 'DRINK' && Array.isArray(product.variants)
    ? product.variants.find((candidate) => isRecord(candidate) && candidate.isAvailable === true && typeof candidate.id === 'string' && isMinor(candidate.priceMinor))
    : null;
  const priceMinor = variant === null ? product.priceMinor : variant.priceMinor;
  const variantId = variant === null ? null : variant.id;

  if ((product.type !== 'DRINK' && product.type !== 'OTHER') || !isMinor(priceMinor)) return null;
  if ((product.type === 'DRINK') !== (variant !== null)) return null;

  const modifierOptionIds = [];
  let modifierTotalMinor = 0;
  if (!Array.isArray(product.modifierGroups)) return null;
  for (const group of product.modifierGroups) {
    if (!isRecord(group) || !Number.isInteger(group.minSelect) || !Number.isInteger(group.maxSelect) || !Array.isArray(group.options)) return null;
    if (group.minSelect <= 0) continue;

    const defaults = group.options.filter((option) => isRecord(option) && option.isAvailable === true && option.isDefault === true && typeof option.id === 'string' && isMinor(option.priceDeltaMinor));
    if (defaults.length < group.minSelect || defaults.length > group.maxSelect) return null;
    for (const option of defaults) {
      modifierOptionIds.push(option.id);
      modifierTotalMinor += option.priceDeltaMinor;
    }
  }

  const totalMinor = priceMinor + modifierTotalMinor;
  if (!isMinor(totalMinor)) return null;
  return { productId: product.id, variantId, modifierOptionIds, quantity: 1, totalMinor };
}

function assertLifecycleEvents(order) {
  if (!Array.isArray(order.events)) throw new Error('order events: response is invalid');
  if (order.events.length !== 4) throw new Error('order events: expected exactly four events');
  for (const [from, to] of [['CREATED', 'ACCEPTED'], ['ACCEPTED', 'PREPARING'], ['PREPARING', 'READY'], ['READY', 'ISSUED']]) {
    if (!order.events.some((event) => isRecord(event) && event.from === from && event.to === to)) {
      throw new Error(`order events: missing ${from} to ${to}`);
    }
  }
}

async function expectStatus(baseUrl, path, expectedStatus, name, options = {}) {
  const response = await request(baseUrl, path, options);
  if (response.status !== expectedStatus) {
    throw new Error(`${name}: expected HTTP ${expectedStatus}, received ${response.status}`);
  }
  return response;
}

async function expectJson(baseUrl, path, expectedStatus, name, options = {}) {
  const response = await expectStatus(baseUrl, path, expectedStatus, name, options);
  try {
    return await response.json();
  } catch {
    throw new Error(`${name}: response is not JSON`);
  }
}

function request(baseUrl, path, { headers = {}, ...options }) {
  return fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

function readAccessToken(value) {
  if (!isRecord(value) || typeof value.accessToken !== 'string' || value.accessToken === '') {
    throw new Error('OTP verification: access token is missing');
  }
  return value.accessToken;
}

function assertStage(value, expectedStage, name) {
  if (!isRecord(value) || value.stage !== expectedStage) {
    throw new Error(`${name}: expected ${expectedStage}`);
  }
}

function isPhone(value) {
  return typeof value === 'string' && /^\+7[0-9]{10}$/.test(value);
}

function isRecord(value) {
  return typeof value === 'object' && value !== null;
}

function isMinor(value) {
  return Number.isSafeInteger(value) && value >= 0;
}

if (import.meta.main) {
  runStagingSmoke().catch((error) => {
    console.error(error instanceof Error ? error.message : 'staging smoke failed');
    process.exitCode = 1;
  });
}
