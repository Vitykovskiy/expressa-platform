import type { UserAction } from "../../../shared/ui/admin/Admin.types";
import type { StatusPresentation, UserRolePresentation } from "./UserRow.types";

export const USER_ACTION_CHANGE_ROLE: UserAction = "change_role";
export const USER_ACTION_BLOCK: UserAction = "block";
export const USER_ACTION_UNBLOCK: UserAction = "unblock";

export const USER_ROLE_PRESENTATION: UserRolePresentation = {
  administrator: {
    label: "Администратор",
    className: "user-role--administrator",
  },
  barista: { label: "Бариста", className: "user-role--barista" },
};

export const USER_STATUS_PRESENTATION: Record<string, StatusPresentation> = {
  active: { label: "Активен", className: "user-status--active" },
  blocked: { label: "Нет доступа", className: "user-status--blocked" },
  noRole: { label: "Без роли", className: "user-status--no-role" },
};
