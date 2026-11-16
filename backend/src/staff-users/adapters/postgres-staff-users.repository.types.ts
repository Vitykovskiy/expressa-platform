import type { StaffUsersReader } from "../application/staff-users.repository.types";
import type { StaffUsersUnitOfWork } from "../application/staff-users.repository.types";

export type DatabaseRow = Record<string, unknown>;

export type StaffPorts = StaffUsersReader & StaffUsersUnitOfWork;
