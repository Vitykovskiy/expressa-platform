import type { CategoryFormField } from "./AddCategoryDialog.types";

export interface CategoryFormFieldsProps {
  disabled: boolean;
  errors: Partial<Record<CategoryFormField, string>>;
  description: string;
  isActive: boolean;
  name: string;
  nameAutofocus?: boolean;
}

export interface CategoryFormFieldsEmits {
  "update:description": [value: string];
  "update:isActive": [value: boolean];
  "update:name": [value: string];
  blurName: [];
  submit: [];
}
