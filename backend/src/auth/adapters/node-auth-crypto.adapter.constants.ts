import type { JwtHeader } from "./node-auth-crypto.adapter.types";

export const jwtHeader: JwtHeader = { alg: "HS256", typ: "JWT" };
export const refreshTokenByteLength = 32;
