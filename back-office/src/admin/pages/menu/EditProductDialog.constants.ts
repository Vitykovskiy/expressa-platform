import type { MenuItem } from "../../shared/ui/Admin.types";
import type { ProductSizeDraft } from "./EditProductDialog.types";

export function createEditProductSizeDrafts(
  product: MenuItem | null,
): ProductSizeDraft[] {
  return ["S", "M", "L"].map((size) => ({
    id: size,
    size,
    price: product?.sizes?.find((item) => item.size === size)?.price ?? 0,
  }));
}
