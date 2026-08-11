import type { AddUserData } from "../../../shared/ui/admin/Admin.types";

export interface FocusableElement {
  focus: () => void;
}

export interface AddUserDialogEmits {
  add: [data: AddUserData];
  cancel: [];
}
