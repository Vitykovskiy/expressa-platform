import type { EditMenuCategoryData } from "../../shared/ui/Admin.types";

export interface EditCategoryDialogProps {
  categoryName: string | null;
  productCount: number;
  optionGroups?: readonly string[];
  isOptionGroup?: boolean;
  parentGroupId?: string;
}

export interface EditCategoryDialogEmits {
  save: [data: EditMenuCategoryData];
  delete: [];
  cancel: [];
}
