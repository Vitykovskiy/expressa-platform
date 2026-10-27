import type { ComputedRef } from "vue";

export type CustomerRegistrationContext = {
  accountId: ComputedRef<string | null>;
  generation: ComputedRef<number>;
  canonicalName: ComputedRef<string | null>;
  phone: ComputedRef<string>;
  pending: ComputedRef<boolean>;
  complete(name: string): Promise<boolean>;
  captureOperation(): () => boolean;
};
