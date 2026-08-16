import { shouldUseSecureCookies, validateEnvironment } from './environment';

const validEnvironment: NodeJS.ProcessEnv = {
  NODE_ENV: 'local',
  PORT: '3000',
  DATABASE_URL: 'postgresql://expressa:expressa@localhost:5432/expressa',
  AUTH_ACCESS_TOKEN_SECRET: 'local-access-token-secret',
  AUTH_OTP_PEPPER: 'local-otp-pepper',
  AUTH_DEVELOPMENT_OTP: '123456',
  CORS_ORIGINS: 'http://localhost:5173,https://backoffice.expressa.test',
  VAPID_SUBJECT: 'mailto:push@expressa.test',
  VAPID_PUBLIC_KEY: 'BOT-VsrivTqPsMDCzS45APlNSMbgcTT5jqlrYu2-6PCRGB0YneXQDNsbrIxTAy0jJ-kUlKlWPm94PeirK8A8wCw',
  VAPID_PRIVATE_KEY: '9rZGGVplNbc2psiiiyOla_ZL-qDyrgIZqD_cpLz1G0c',
};

function expectValidationError(
  environment: NodeJS.ProcessEnv,
  variable: string,
): void {
  expect(() => validateEnvironment(environment)).toThrow(
    `Invalid environment variable: ${variable}`,
  );
}

describe('validateEnvironment', () => {
  it('принимает корректное delivery-окружение', () => {
    expect(validateEnvironment(validEnvironment)).toBe(validEnvironment);
  });

  it.each([
    ['NODE_ENV', { ...validEnvironment, NODE_ENV: undefined }],
    ['NODE_ENV', { ...validEnvironment, NODE_ENV: 'test' }],
    ['PORT', { ...validEnvironment, PORT: 'not-a-port' }],
    ['PORT', { ...validEnvironment, PORT: '65536' }],
    ['DATABASE_URL', { ...validEnvironment, DATABASE_URL: undefined }],
    ['DATABASE_URL', { ...validEnvironment, DATABASE_URL: 'not-a-url' }],
    ['AUTH_ACCESS_TOKEN_SECRET', { ...validEnvironment, AUTH_ACCESS_TOKEN_SECRET: undefined }],
    ['AUTH_OTP_PEPPER', { ...validEnvironment, AUTH_OTP_PEPPER: '  ' }],
    ['VAPID_SUBJECT', { ...validEnvironment, VAPID_SUBJECT: 'invalid-subject' }],
    ['VAPID_PUBLIC_KEY', { ...validEnvironment, VAPID_PUBLIC_KEY: 'not valid' }],
    ['VAPID_PUBLIC_KEY', { ...validEnvironment, VAPID_PUBLIC_KEY: 'dG9vLXNob3J0' }],
    ['VAPID_PRIVATE_KEY', { ...validEnvironment, VAPID_PRIVATE_KEY: undefined }],
    ['AUTH_DEVELOPMENT_OTP', { ...validEnvironment, AUTH_DEVELOPMENT_OTP: '12345' }],
    ['CORS_ORIGINS', { ...validEnvironment, CORS_ORIGINS: 'https://customer.expressa.test/path' }],
    ['BOOTSTRAP_ADMIN_PHONE', { ...validEnvironment, BOOTSTRAP_ADMIN_PHONE: '79991234567' }],
  ])('отклоняет невалидную переменную %s', (variable, environment) => {
    expectValidationError(environment, variable);
  });

  it('не раскрывает значение DATABASE_URL в ошибке', () => {
    const databaseUrl = 'postgresql://user:secret@';

    expect(() =>
      validateEnvironment({ ...validEnvironment, DATABASE_URL: databaseUrl }),
    ).toThrow('Invalid environment variable: DATABASE_URL');

    try {
      validateEnvironment({ ...validEnvironment, DATABASE_URL: databaseUrl });
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).not.toContain(databaseUrl);
    }
  });

  it('требует staging test OTP только в staging', () => {
    const staging = { ...validEnvironment, NODE_ENV: 'staging', AUTH_DEVELOPMENT_OTP: undefined };

    expectValidationError(staging, 'AUTH_OTP_MODE');
    expectValidationError({ ...staging, AUTH_OTP_MODE: 'sms' }, 'AUTH_OTP_MODE');
    expectValidationError({ ...staging, AUTH_OTP_MODE: 'staging_test' }, 'STAGING_TEST_OTP_CODE');
    expectValidationError(
      { ...staging, AUTH_OTP_MODE: 'staging_test', STAGING_TEST_OTP_CODE: '12345' },
      'STAGING_TEST_OTP_CODE',
    );
    expectValidationError(
      {
        ...staging,
        AUTH_OTP_MODE: 'staging_test',
        STAGING_TEST_OTP_CODE: '123456',
        STAGING_TEST_PHONE_ALLOWLIST: '+79991234567,+79991234567',
      },
      'STAGING_TEST_PHONE_ALLOWLIST',
    );
    expect(() => validateEnvironment({
      ...staging,
      AUTH_OTP_MODE: 'staging_test',
      STAGING_TEST_OTP_CODE: '123456',
      STAGING_TEST_PHONE_ALLOWLIST: '+79991234567,+79876543210',
    })).not.toThrow();
  });

  it('требует SMS.ru настройки в production', () => {
    const production = { ...validEnvironment, NODE_ENV: 'production', AUTH_DEVELOPMENT_OTP: undefined };

    expectValidationError(production, 'SMS_RU_API_ID');
    expect(() => validateEnvironment({ ...production, SMS_RU_API_ID: 'id', SMS_RU_SENDER: 'Expressa' })).not.toThrow();
  });

  it('требует development OTP в local и development', () => {
    const development = { ...validEnvironment, NODE_ENV: 'development' };

    expectValidationError({ ...validEnvironment, AUTH_DEVELOPMENT_OTP: undefined }, 'AUTH_DEVELOPMENT_OTP');
    expectValidationError({ ...development, AUTH_DEVELOPMENT_OTP: undefined }, 'AUTH_DEVELOPMENT_OTP');
    expect(validateEnvironment(development)).toBe(development);
  });

  it.each([
    ['local', false],
    ['development', true],
    ['staging', true],
    ['production', true],
    [undefined, true],
  ])('использует Secure cookie во всех средах, кроме exact local: %s', (environment, expected) => {
    expect(shouldUseSecureCookies(environment)).toBe(expected);
  });

  it('не ослабляет validation в тестовом процессе', () => {
    expectValidationError({}, 'NODE_ENV');
  });
});
