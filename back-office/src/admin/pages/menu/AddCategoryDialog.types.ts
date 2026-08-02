import type { CreateMenuCategoryData } from "../../shared/ui/Admin.types";

export interface AddCategoryDialogProps {
  categories?: readonly string[];
  optionGroups?: readonly string[];
}
export interface AddCategoryDialogEmits {
  confirm: [data: CreateMenuCategoryData];
  cancel: [];
}
