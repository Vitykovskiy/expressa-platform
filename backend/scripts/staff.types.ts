import type { staffRoles } from "./staff.constants";

export type StaffRole = (typeof staffRoles)[number];
export type StaffCommand = { phone: string; role: StaffRole };
