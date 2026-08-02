export type UiIconBtnType = "button" | "submit" | "reset";

export interface UiIconBtnProps {
  disabled?: boolean;
  loading?: boolean;
  type?: UiIconBtnType;
}

export interface UiIconBtnEmits {
  click: [event: MouseEvent];
}
