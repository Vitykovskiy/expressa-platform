import type { AdminTextareaProps } from "./AdminTextarea.types";

export const ADMIN_TEXTAREA_DEFAULTS = {
  modelValue: "",
} satisfies Required<Pick<AdminTextareaProps, "modelValue">>;
