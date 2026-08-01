import { validateEnvironment } from './environment';

const validEnvironment: NodeJS.ProcessEnv = {
  NODE_ENV: 'local',
  PORT: '3000',
  DATABASE_URL: 'postgresql://expressa:expressa@localhost:5432/expressa',
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
  const originalJestWorkerId = process.env.JEST_WORKER_ID;

  beforeEach(() => {
    delete process.env.JEST_WORKER_ID;
  });

  afterAll(() => {
    if (originalJestWorkerId === undefined) {
      delete process.env.JEST_WORKER_ID;
      return;
    }

    process.env.JEST_WORKER_ID = originalJestWorkerId;
  });

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

  it('разрешает пустое окружение только тестовому процессу', () => {
    process.env.JEST_WORKER_ID = '1';

    expect(() => validateEnvironment({})).not.toThrow();
  });
});
