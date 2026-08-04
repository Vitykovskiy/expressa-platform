import { shouldUseSecureCookies, validateEnvironment } from './environment';

const validEnvironment: NodeJS.ProcessEnv = {
  NODE_ENV: 'local',
  PORT: '3000',
  DATABASE_URL: 'postgresql://expressa:expressa@localhost:5432/expressa',
  AUTH_ACCESS_TOKEN_SECRET: 'local-access-token-secret',
  AUTH_OTP_PEPPER: 'local-otp-pepper',
  AUTH_DEVELOPMENT_OTP: '123456',
  CORS_ORIGINS: 'http://localhost:5173,https://backoffice.expressa.test',
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

  it('требует SMS.ru настройки в staging и production', () => {
    const staging = { ...validEnvironment, NODE_ENV: 'staging', AUTH_DEVELOPMENT_OTP: undefined };
    const production = { ...staging, NODE_ENV: 'production' };

    expectValidationError(staging, 'SMS_RU_API_ID');
    expect(() => validateEnvironment({ ...staging, SMS_RU_API_ID: 'id', SMS_RU_SENDER: 'Expressa' })).not.toThrow();
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
