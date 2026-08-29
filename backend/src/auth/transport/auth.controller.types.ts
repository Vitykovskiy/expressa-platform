export type AuthCookieOptions = {
  httpOnly: true;
  maxAge: number;
  path: '/api/v2/auth';
  sameSite: 'strict';
  secure: boolean;
};

export type AuthCookieResponse = {
  cookie(name: string, value: string, options: AuthCookieOptions): unknown;
};

export type AuthHeaderResponse = AuthCookieResponse & {
  header(name: string, value: string): unknown;
};

export type AccessTokenResponse = {
  accessToken: string;
  expiresInSeconds: number;
  tokenType: 'Bearer';
};
