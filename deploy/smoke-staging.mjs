import { randomUUID } from 'node:crypto';

const backendUrl = 'http://127.0.0.1:3000';

export async function runStagingSmoke(phone = process.env.SMOKE_CUSTOMER_PHONE, baseUrl = backendUrl) {
  if (typeof phone !== 'string' || !/^\+7[0-9]{10}$/.test(phone)) {
    throw new Error('SMOKE_CUSTOMER_PHONE is required for staging smoke');
  }

  await expectStatus(baseUrl, '/health/live', 200, 'liveness');
  await expectStatus(baseUrl, '/health/ready', 200, 'readiness');

  await expectStatus(baseUrl, '/api/v1/auth/otp/request', 202, 'OTP request', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });
  const verified = await expectJson(baseUrl, '/api/v1/auth/otp/verify', 200, 'OTP verification', {
    method: 'POST',
    body: JSON.stringify({ phone, code: '000000' }),
  });
  const accessToken = readAccessToken(verified);

  const menu = await expectJson(baseUrl, '/api/v1/public/menu', 200, 'public menu');
  const order = createOrder(menu);
  const created = await expectJson(baseUrl, '/api/v1/orders', 201, 'order creation', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'idempotency-key': randomUUID(),
    },
    body: JSON.stringify(order),
  });
  assertCreatedOrder(created);
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

function createOrder(menu) {
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

function assertCreatedOrder(value) {
  if (!isRecord(value) || value.stage !== 'CREATED' || typeof value.id !== 'string' || value.id === '') {
    throw new Error('order creation: CREATED order id is missing');
  }
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
