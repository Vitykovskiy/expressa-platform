import type { ProductPriceChoice } from "../catalog.types";
import type {
  ProductPriceChoiceDraft,
  ProductPriceMode,
} from "./useProductDraft.types";
let nextClientChoiceId = 0;
export function createProductPriceChoiceDraft(
  source?: Partial<ProductPriceChoiceDraft>,
): ProductPriceChoiceDraft {
  nextClientChoiceId += 1;
  return {
    clientId: source?.clientId ?? `local-price-${nextClientChoiceId}`,
    id: source?.id,
    isAvailable: source?.isAvailable ?? true,
    portionLabel: source?.portionLabel ?? "",
    price: source?.price ?? "",
  };
}
export function priceChoiceDrafts(
  source: readonly ProductPriceChoice[],
  fallback: {
    isAvailable: boolean;
    portionLabel?: string | null;
    price?: number | null;
  },
): ProductPriceChoiceDraft[] {
  if (source.length)
    return source.map((choice) =>
      createProductPriceChoiceDraft({
        id: choice.id,
        isAvailable: choice.isAvailable,
        portionLabel: choice.portionLabel,
        price: String(choice.price),
      }),
    );
  return [
    createProductPriceChoiceDraft({
      isAvailable: fallback.isAvailable,
      portionLabel: fallback.portionLabel ?? "",
      price: fallback.price == null ? "" : String(fallback.price),
    }),
  ];
}
export function priceMode(
  choices: readonly ProductPriceChoiceDraft[],
): ProductPriceMode {
  return choices.length > 1 ? "multiple" : "single";
}
