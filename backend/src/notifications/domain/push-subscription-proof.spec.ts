import {
  hasPushSubscriptionProof,
  isValidPushSubscriptionProof,
} from "./push-subscription-proof";

const auth = Buffer.alloc(16, 7).toString("base64");
const publicKey = Buffer.concat([
  Buffer.from([4]),
  Buffer.alloc(64, 9),
]).toString("base64");
const stored = {
  endpoint: "https://push.example/subscription",
  auth,
  p256dh: publicKey,
};

describe("hasPushSubscriptionProof", () => {
  it("accepts equivalent standard base64 and browser base64url encodings", () => {
    expect(
      hasPushSubscriptionProof(stored, {
        ...stored,
        auth: auth.replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, ""),
        p256dh: publicKey
          .replaceAll("+", "-")
          .replaceAll("/", "_")
          .replace(/=+$/, ""),
      }),
    ).toBe(true);
  });

  it.each([
    [
      "a guessed endpoint",
      { ...stored, endpoint: "https://push.example/other" },
    ],
    [
      "a wrong secret",
      { ...stored, auth: Buffer.alloc(16, 8).toString("base64") },
    ],
    [
      "a changed public key",
      {
        ...stored,
        p256dh: Buffer.concat([Buffer.from([4]), Buffer.alloc(64, 8)]).toString(
          "base64",
        ),
      },
    ],
  ])("rejects %s", (_reason, supplied) => {
    expect(hasPushSubscriptionProof(stored, supplied)).toBe(false);
  });

  it.each([
    ["invalid alphabet", { ...stored, auth: "!!!!!!!!" }],
    [
      "mixed alphabet",
      {
        ...stored,
        auth: Buffer.alloc(16, 251).toString("base64").replace("+", "-"),
      },
    ],
    ["invalid padding", { ...stored, auth: auth.replace(/==$/, "=") }],
    [
      "invalid auth length",
      { ...stored, auth: Buffer.alloc(15).toString("base64") },
    ],
    [
      "invalid public key length",
      { ...stored, p256dh: Buffer.alloc(64).toString("base64") },
    ],
    [
      "invalid public key prefix",
      { ...stored, p256dh: Buffer.alloc(65).toString("base64") },
    ],
  ])("rejects malformed %s", (_reason, supplied) => {
    expect(isValidPushSubscriptionProof(supplied)).toBe(false);
  });
});
