export type CategoryFormField = "name" | "description" | "isActive";

export interface CategoryFormData {
  name: string;
  description: string;
  isActive: boolean;
}

export interface AddCategoryDialogProps {
  disabled: boolean;
  fieldErrors?: Partial<Record<CategoryFormField, string>>;
}

export interface AddCategoryDialogEmits {
  confirm: [data: CategoryFormData];
  cancel: [];
}
