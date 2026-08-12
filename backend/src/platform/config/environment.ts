import { deliveryEnvironments, developmentEnvironments, localEnvironment } from './environment.constants';
import type { DeliveryEnvironment } from './environment.types';

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

function validatePhone(value: string, name: string): void {
  if (!/^\+7\d{10}$/.test(value)) {
    throw new Error(`Invalid environment variable: ${name}`);
  }
}

export function validateEnvironment(environment: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const nodeEnvironment = requireEnvironmentVariable(environment, 'NODE_ENV');

  if (!isDeliveryEnvironment(nodeEnvironment)) {
    throw new Error('Invalid environment variable: NODE_ENV');
  }

  validatePort(requireEnvironmentVariable(environment, 'PORT'));
  validateDatabaseUrl(requireEnvironmentVariable(environment, 'DATABASE_URL'));
  requireEnvironmentVariable(environment, 'AUTH_ACCESS_TOKEN_SECRET');
  requireEnvironmentVariable(environment, 'AUTH_OTP_PEPPER');
  getCorsOrigins(environment);
  validateEnvironmentSpecificVariables(environment, nodeEnvironment);
  const bootstrapPhone = environment.BOOTSTRAP_ADMIN_PHONE;
  if (bootstrapPhone !== undefined && bootstrapPhone.trim() !== '') {
    validatePhone(bootstrapPhone, 'BOOTSTRAP_ADMIN_PHONE');
  }

  return environment;
}

export function getCorsOrigins(environment: { CORS_ORIGINS?: string | undefined }): string[] {
  const value = requireEnvironmentVariable(environment, 'CORS_ORIGINS');
  const origins = value.split(',');

  if (origins.length === 0 || new Set(origins).size !== origins.length) {
    throw new Error('Invalid environment variable: CORS_ORIGINS');
  }

  for (const origin of origins) {
    if (!isExactOrigin(origin)) {
      throw new Error('Invalid environment variable: CORS_ORIGINS');
    }
  }

  return origins;
}

export function shouldUseSecureCookies(environment: string | undefined): boolean {
  return environment !== localEnvironment;
}

function validateEnvironmentSpecificVariables(
  environment: NodeJS.ProcessEnv,
  nodeEnvironment: DeliveryEnvironment,
): void {
  if (developmentEnvironments.some((value) => value === nodeEnvironment)) {
    const otp = requireEnvironmentVariable(environment, 'AUTH_DEVELOPMENT_OTP');
    if (!/^\d{6}$/.test(otp)) {
      throw new Error('Invalid environment variable: AUTH_DEVELOPMENT_OTP');
    }
    return;
  }

  if (nodeEnvironment === 'staging') {
    const otpMode = requireEnvironmentVariable(environment, 'AUTH_OTP_MODE');
    if (otpMode !== 'staging_test') {
      throw new Error('Invalid environment variable: AUTH_OTP_MODE');
    }

    const otp = requireEnvironmentVariable(environment, 'STAGING_TEST_OTP_CODE');
    if (!/^\d{6}$/.test(otp)) {
      throw new Error('Invalid environment variable: STAGING_TEST_OTP_CODE');
    }

    const allowlist = requireEnvironmentVariable(environment, 'STAGING_TEST_PHONE_ALLOWLIST');
    const phones = allowlist.split(',');
    if (
      phones.some((phone) => !/^\+7\d{10}$/.test(phone)) ||
      new Set(phones).size !== phones.length
    ) {
      throw new Error('Invalid environment variable: STAGING_TEST_PHONE_ALLOWLIST');
    }

    return;
  }

  requireEnvironmentVariable(environment, 'SMS_RU_API_ID');
  requireEnvironmentVariable(environment, 'SMS_RU_SENDER');
}

function isExactOrigin(value: string): boolean {
  try {
    const origin = new URL(value);
    return (origin.protocol === 'http:' || origin.protocol === 'https:') && origin.origin === value;
  } catch {
    return false;
  }
}
