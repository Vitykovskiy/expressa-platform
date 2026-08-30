import {
  HttpException,
  UnauthorizedException,
  type ExecutionContext,
} from "@nestjs/common";
import { OriginGuard } from "./origin.guard";

function context(origin: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ headers: { origin } }) }),
  } as unknown as ExecutionContext;
}

function guard(
  allowedOrigins = ["https://customer.expressa.test"],
): OriginGuard {
  return new OriginGuard({ allowedOrigins });
}

describe("OriginGuard", () => {
  it("принимает только exact origin из allowlist", () => {
    expect(guard().canActivate(context("https://customer.expressa.test"))).toBe(
      true,
    );
  });

  it.each([
    undefined,
    "null",
    "https://customer.expressa.test/path",
    "https://customer.expressa.test/",
    ["https://customer.expressa.test"],
  ])("отклоняет отсутствующий, opaque или malformed Origin %p", (origin) => {
    expect(() => guard().canActivate(context(origin))).toThrow(
      UnauthorizedException,
    );
  });

  it("отклоняет неразрешённый origin без wildcard или subdomain fallback", () => {
    for (const origin of [
      "https://admin.expressa.test",
      "https://evilcustomer.expressa.test",
    ]) {
      expect(() => guard().canActivate(context(origin))).toThrow(HttpException);
    }
  });

  it("не использует Referer как fallback", () => {
    const executionContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { referer: "https://customer.expressa.test" },
        }),
      }),
    } as unknown as ExecutionContext;

    expect(() => guard().canActivate(executionContext)).toThrow(
      UnauthorizedException,
    );
  });

  it("возвращает безопасный ACCESS_DENIED для неразрешённого origin", () => {
    try {
      guard().canActivate(context("https://other.example"));
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getResponse()).toEqual({
        code: "ACCESS_DENIED",
        details: null,
        message: "Access denied",
      });
    }
  });
});
