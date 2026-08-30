import { SetMetadata } from "@nestjs/common";
import type { RolePolicy } from "../domain/auth.types";
import { rolesMetadataKey } from "./roles.decorator.constants";

export function Roles(policy: RolePolicy) {
  return SetMetadata(rolesMetadataKey, policy);
}
