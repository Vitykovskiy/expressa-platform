import type { rolePolicies, userRoles } from './auth.constants';

export type UserRole = (typeof userRoles)[number];

export type RolePolicy = keyof typeof rolePolicies;

export type OtpChallenge = {
  expiresAt: Date;
  consumedAt: Date | null;
  sentAt: Date;
  attempts: number;
};
