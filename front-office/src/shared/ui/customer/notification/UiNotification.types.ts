export interface UiNotificationProps {
  message: string | null;
  role?: "status" | "alert";
}

export type UiNotificationEmits = {
  close: [];
};
