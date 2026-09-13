import { authReturnBlockedPaths } from "./auth-return.constants";

export function getSafeAuthReturnTo(value: unknown): string | undefined {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.includes("\\") ||
    /%5c/iu.test(value)
  )
    return undefined;

  try {
    const target = new URL(value, window.location.origin);
    const decodedPathname = decodeURIComponent(target.pathname);
    const normalizedPathname =
      decodedPathname.replace(/\/+$/u, "").toLowerCase() || "/";
    if (target.origin !== window.location.origin) return undefined;
    if (
      decodedPathname.startsWith("//") ||
      decodedPathname.includes("\\") ||
      authReturnBlockedPaths.has(normalizedPathname)
    )
      return undefined;
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return undefined;
  }
}
