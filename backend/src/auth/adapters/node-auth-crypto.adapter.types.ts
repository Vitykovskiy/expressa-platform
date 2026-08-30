export type NodeAuthCryptoConfiguration = {
  jwtSecret: string;
  otpPepper: string;
};

export type JwtHeader = {
  alg: "HS256";
  typ: "JWT";
};
