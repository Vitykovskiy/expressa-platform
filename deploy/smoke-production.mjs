const backendUrl = 'http://127.0.0.1:3000';
const apiPrefix = '/api/v2';

function passed(name) {
  console.log(`expressa-production-smoke: check=${name} status=passed`);
}

async function expectStatus(path, expectedStatus, name) {
  const response = await fetch(`${backendUrl}${path}`);
  if (response.status !== expectedStatus) {
    throw new Error(`${name}: expected HTTP ${expectedStatus}, received ${response.status}`);
  }
  passed(`${name} HTTP ${expectedStatus}`);
  return response;
}

async function runProductionSmoke() {
  await expectStatus('/health/live', 200, 'liveness');
  await expectStatus('/health/ready', 200, 'readiness');
  const menu = await expectStatus(`${apiPrefix}/public/menu`, 200, 'public menu');
  if (!menu.headers.get('content-type')?.includes('application/json')) {
    throw new Error('public menu: response is not JSON');
  }
  await menu.json();
  passed('public menu JSON');
}

runProductionSmoke().catch((error) => {
  console.error(error instanceof Error ? error.message : 'production smoke failed');
  process.exitCode = 1;
});
