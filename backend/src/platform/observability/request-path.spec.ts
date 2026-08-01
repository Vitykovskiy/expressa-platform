import { getRequestPath } from './request-path';

describe('getRequestPath', () => {
  it('исключает query string из журнала', () => {
    expect(getRequestPath('/health/live?accessToken=secret-value')).toBe(
      '/health/live',
    );
  });
});
