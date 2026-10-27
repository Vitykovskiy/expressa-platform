import type { EmployeePresentation } from "./Users.types";

export interface UserRowProps {
  readonly user: EmployeePresentation;
}

export interface UserRowEmits {
  role: [
    user: EmployeePresentation,
    trigger: globalThis.HTMLButtonElement | null,
  ];
  access: [
    user: EmployeePresentation,
    trigger: globalThis.HTMLButtonElement | null,
  ];
}
