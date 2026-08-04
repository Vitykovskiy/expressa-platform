export type OriginGuardConfiguration = {
  allowedOrigins: readonly string[];
};

export type OriginRequest = {
  headers: Record<string, unknown>;
};
