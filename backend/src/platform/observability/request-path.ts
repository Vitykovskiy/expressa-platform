export function getRequestPath(requestUrl: string | undefined): string {
  const path = requestUrl ?? '/';
  const queryStart = path.indexOf('?');

  return queryStart === -1 ? path : path.slice(0, queryStart) || '/';
}
