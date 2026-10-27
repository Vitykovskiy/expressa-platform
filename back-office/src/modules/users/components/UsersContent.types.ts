import type { UsersTab } from "../users.types";
import type {
  EmployeePresentation,
  UsersFilter,
  CustomerPresentation,
} from "./Users.types";

export interface UsersContentProps {
  readonly tab: UsersTab;
  readonly customers: readonly CustomerPresentation[];
  readonly employees: readonly EmployeePresentation[];
  readonly query: string;
  readonly filter: UsersFilter;
  readonly loading: boolean;
  readonly error: string | null;
}

export interface UsersContentEmits {
  "update:tab": [value: UsersTab];
  "update:query": [value: string];
  "update:filter": [value: UsersFilter];
  create: [trigger: globalThis.HTMLButtonElement];
  role: [
    user: EmployeePresentation,
    trigger: globalThis.HTMLButtonElement | null,
  ];
  access: [
    user: EmployeePresentation,
    trigger: globalThis.HTMLButtonElement | null,
  ];
  retry: [];
}
