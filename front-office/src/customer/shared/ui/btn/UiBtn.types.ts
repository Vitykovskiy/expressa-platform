export type UiBtnType = "button" | "submit" | "reset";

export interface UiBtnProps {
  disabled?: boolean;
  loading?: boolean;
  type?: UiBtnType;
}

export interface UiBtnEmits {
  click: [event: MouseEvent];
}
