const deliveryEnvironments = [
  'local',
  'development',
  'staging',
  'production',
] as const;

type DeliveryEnvironment = (typeof deliveryEnvironments)[number];

function isTestProcess(): boolean {
  return process.env.JEST_WORKER_ID !== undefined;
}

function requireEnvironmentVariable(
  environment: NodeJS.ProcessEnv,
  name: string,
): string {
  const value = environment[name];

  if (value === undefined || value.trim() === '') {
    throw new Error(`Invalid environment variable: ${name}`);
  }

  return value;
}

function isDeliveryEnvironment(value: string): value is DeliveryEnvironment {
  return deliveryEnvironments.includes(value as DeliveryEnvironment);
}

function validatePort(value: string): void {
  if (!/^\d+$/.test(value)) {
    throw new Error('Invalid environment variable: PORT');
  }

  const port = Number(value);

  if (!Number.isSafeInteger(port) || port < 1 || port > 65_535) {
    throw new Error('Invalid environment variable: PORT');
  }
}

function validateDatabaseUrl(value: string): void {
  try {
    const url = new URL(value);

    if (
      (url.protocol !== 'postgres:' && url.protocol !== 'postgresql:') ||
      url.hostname === ''
    ) {
      throw new Error();
    }
  } catch {
    throw new Error('Invalid environment variable: DATABASE_URL');
  }
}

export function validateEnvironment(environment: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  if (isTestProcess()) {
    return environment;
  }

  const nodeEnvironment = requireEnvironmentVariable(environment, 'NODE_ENV');

  if (!isDeliveryEnvironment(nodeEnvironment)) {
    throw new Error('Invalid environment variable: NODE_ENV');
  }

  validatePort(requireEnvironmentVariable(environment, 'PORT'));
  validateDatabaseUrl(requireEnvironmentVariable(environment, 'DATABASE_URL'));

  return environment;
}
