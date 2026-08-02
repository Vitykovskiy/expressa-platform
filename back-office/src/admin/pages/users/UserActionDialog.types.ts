import type { AdminButtonVariant } from "../../shared/ui/admin-button/AdminButton.types";
import type { User, UserAction, UserRole } from "../../shared/ui/Admin.types";

export interface FocusableElement {
  focus: () => void;
}

export interface UserActionDialogProps {
  user: User;
  action: UserAction;
}

export interface UserActionDialogEmits {
  confirm: [role: UserRole | undefined];
  cancel: [];
}

export interface UserActionDialogPresentation {
  title: string;
  confirmLabel: string;
  confirmVariant: AdminButtonVariant;
  description: string;
}
