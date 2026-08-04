import { refreshCookieName, refreshCookiePath } from './auth.controller.constants';
import { clearRefreshCookie, readRefreshCookie, writeRefreshCookie } from './auth-cookie';

const refreshToken = `d2719b1e-6b2c-4c4e-8e61-5c5cc62e1952.${Buffer.alloc(32, 1).toString('base64url')}`;

describe('auth-cookie', () => {
  const originalNodeEnvironment = process.env.NODE_ENV;

  afterEach(() => {
    if (originalNodeEnvironment === undefined) {
      delete process.env.NODE_ENV;
      return;
    }

    process.env.NODE_ENV = originalNodeEnvironment;
  });

  it('извлекает только точный refresh cookie без percent-decoding', () => {
    expect(readRefreshCookie(`other=value; ${refreshCookieName}=${refreshToken}`)).toBe(refreshToken);
    expect(readRefreshCookie(`${refreshCookieName}=${refreshToken.replace('.', '%2E')}`)).toBeNull();
  });

  it.each([
    undefined,
    '',
    `${refreshCookieName}=`,
    `${refreshCookieName}=${refreshToken}; ${refreshCookieName}=${refreshToken}`,
    `${refreshCookieName}=${refreshToken}, other=value`,
    `${refreshCookieName}=${refreshToken}\r\nother=value`,
    `${refreshCookieName}=not-a-token`,
    `other=value; ${refreshCookieName}=${refreshToken}=extra`,
  ])('отклоняет invalid или multiple Cookie header %p', (header) => {
    expect(readRefreshCookie(header)).toBeNull();
  });

  it.each([
    ['local', false],
    ['development', true],
    ['staging', true],
    ['production', true],
  ])('пишет и очищает refresh cookie с одинаковыми атрибутами в %s', (environment, secure) => {
    process.env.NODE_ENV = environment;
    const response = { cookie: jest.fn() };

    writeRefreshCookie(response, refreshToken, 120);
    clearRefreshCookie(response);

    expect(response.cookie).toHaveBeenNthCalledWith(1, refreshCookieName, refreshToken, {
      httpOnly: true,
      maxAge: 120,
      path: refreshCookiePath,
      sameSite: 'strict',
      secure,
    });
    expect(response.cookie).toHaveBeenNthCalledWith(2, refreshCookieName, '', {
      httpOnly: true,
      maxAge: 0,
      path: refreshCookiePath,
      sameSite: 'strict',
      secure,
    });
  });
});
