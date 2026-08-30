import { DevelopmentOtpAdapter } from "./development-otp.adapter";

describe("DevelopmentOtpAdapter", () => {
  it.each(["local", "development"])(
    "выдаёт фиксированный код в среде %s",
    (environment) => {
      const adapter = new DevelopmentOtpAdapter(environment, "123456");

      expect(adapter.generate()).toBe("123456");
    },
  );

  it.each(["staging", "production"])(
    "не создаётся в среде %s",
    (environment) => {
      expect(() => new DevelopmentOtpAdapter(environment, "123456")).toThrow(
        "Development OTP adapter is unavailable in this environment.",
      );
    },
  );

  it.each([undefined, "", "12345", "1234567", "12 3456"])(
    "отклоняет некорректный AUTH_DEVELOPMENT_OTP",
    (code) => {
      expect(() => new DevelopmentOtpAdapter("development", code)).toThrow(
        "Invalid environment variable: AUTH_DEVELOPMENT_OTP",
      );
    },
  );

  it("не возвращает код при отправке", async () => {
    const adapter = new DevelopmentOtpAdapter("local", "123456");

    await expect(
      adapter.send("+79123456789", "123456"),
    ).resolves.toBeUndefined();
  });
});
