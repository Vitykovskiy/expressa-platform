export interface OperationsModalProps {
  readonly open: boolean;
  readonly title: string;
  readonly description?: string;
  readonly width?: number;
  readonly layout?: "form" | "confirmation";
  readonly persistent?: boolean;
  readonly bottomSheet?: boolean;
}

export interface OperationsModalEmits {
  close: [];
}

export interface OperationsModalSlots {
  header?: (props: { titleId: string }) => unknown;
  default?: () => unknown;
  actions?: () => unknown;
}
