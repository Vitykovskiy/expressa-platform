import { StagingOtpAdapter } from "./staging-otp.adapter";

describe("StagingOtpAdapter", () => {
  const allowlist = "+79991234567,+79876543210";

  it("выдаёт фиксированный код только в staging_test режиме", () => {
    const adapter = new StagingOtpAdapter(
      "staging",
      "staging_test",
      "123456",
      allowlist,
    );

    expect(adapter.generate()).toBe("123456");
  });

  it.each([
    ["local", "staging_test"],
    ["staging", undefined],
    ["staging", "sms"],
  ])("не создаётся для %s и режима %s", (environment, mode) => {
    expect(
      () => new StagingOtpAdapter(environment, mode, "123456", allowlist),
    ).toThrow("Staging OTP adapter is unavailable in this environment.");
  });

  it.each([undefined, "", "12345", "1234567", "12 3456"])(
    "отклоняет некорректный STAGING_TEST_OTP_CODE",
    (code) => {
      expect(
        () => new StagingOtpAdapter("staging", "staging_test", code, allowlist),
      ).toThrow("Invalid environment variable: STAGING_TEST_OTP_CODE");
    },
  );

  it.each([undefined, "", "+79991234567,", "+79991234567,+79991234567"])(
    "отклоняет некорректный STAGING_TEST_PHONE_ALLOWLIST",
    (allowlistValue) => {
      expect(
        () =>
          new StagingOtpAdapter(
            "staging",
            "staging_test",
            "123456",
            allowlistValue,
          ),
      ).toThrow("Invalid environment variable: STAGING_TEST_PHONE_ALLOWLIST");
    },
  );

  it("разрешает отправку только номеру из allowlist", async () => {
    const adapter = new StagingOtpAdapter(
      "staging",
      "staging_test",
      "123456",
      allowlist,
    );

    await expect(
      adapter.send("+79991234567", "123456"),
    ).resolves.toBeUndefined();
    await expect(adapter.send("+79001234567", "123456")).rejects.toThrow(
      "Staging OTP delivery is unavailable for this phone.",
    );
  });
});
