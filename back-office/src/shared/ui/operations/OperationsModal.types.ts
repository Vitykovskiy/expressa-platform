export interface OperationsModalProps {
  readonly open: boolean;
  readonly title: string;
  readonly description?: string;
  readonly width?: number;
  readonly layout?: "form" | "confirmation";
  /** Блокирует закрытие через Escape и фон; действия slots контролирует потребитель. */
  readonly persistent?: boolean;
  readonly bottomSheet?: boolean;
}

export interface OperationsModalEmits {
  /** Запрос закрытия от VDialog. Потребитель решает, менять ли open. */
  close: [];
}

export interface OperationsModalSlots {
  /** Заголовок этого slot использует titleId как id для доступного имени диалога. */
  header?: (props: { titleId: string }) => unknown;
  default?: () => unknown;
  actions?: () => unknown;
}
