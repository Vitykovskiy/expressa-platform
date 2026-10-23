import type {
  AvailabilityDto,
  AvailabilityGroup,
  AvailabilityIntakeDto,
  AvailabilityProduct,
  AvailabilityProductDto,
  AvailabilityStandalone,
} from "./availability.types";

export function mapAvailability(
  dto: AvailabilityDto,
): readonly AvailabilityGroup[] {
  const categories = [...dto.categories]
    .filter((category) => category.isActive)
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((category) => ({
      key: `category:${category.id}`,
      name: category.name,
      items: dto.products
        .filter(
          (product) => product.isActive && product.categoryId === category.id,
        )
        .sort((left, right) => left.sortOrder - right.sortOrder)
        .map((product) => mapProduct(product, dto)),
    }));
  const modifiers = dto.modifierGroups
    .filter((group) => group.isActive)
    .map((group) => ({
      key: `group:${group.id}`,
      name: group.name,
      items: dto.modifierOptions
        .filter((option) => option.groupId === group.id)
        .sort((left, right) => left.sortOrder - right.sortOrder)
        .map((option) => ({
          id: option.id,
          type: "modifier" as const,
          name: option.name,
          controlLabel: `${group.name} · ${option.name}`,
          description: `${option.priceDelta} ₽`,
          persistedAvailable: option.isAvailable,
          effectiveAvailable: option.isAvailable,
          disabledReason: null,
        })),
    }));

  return [
    {
      key: "service:intake",
      name: "Работа кафе",
      items: [mapIntake(dto.intake)],
    },
    ...categories,
    ...modifiers,
  ].filter((group) => group.items.length > 0);
}

function mapProduct(
  product: AvailabilityProductDto,
  dto: AvailabilityDto,
): AvailabilityProduct {
  const children = dto.priceChoices
    .filter((choice) => choice.productId === product.id)
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((choice) => ({
      id: choice.id,
      type: "price-choice" as const,
      name: choice.portionLabel,
      controlLabel: `${product.name} · ${choice.portionLabel}`,
      description: `${choice.price} ₽`,
      persistedAvailable: choice.isAvailable,
      effectiveAvailable: product.isAvailable && choice.isAvailable,
      disabledReason: product.isAvailable
        ? null
        : ("product-unavailable" as const),
    }));
  const availableCount = children.filter(
    (choice) => choice.effectiveAvailable,
  ).length;
  let description = `${product.price} ₽`;

  if (children.length > 0) {
    if (!product.isAvailable) {
      description = "Весь напиток выключен";
    } else if (availableCount === 0) {
      description = "Нет доступных размеров";
    } else if (availableCount === children.length) {
      description = "Все размеры доступны";
    } else {
      description = `${availableCount} из ${children.length} размеров`;
    }
  }

  return {
    id: product.id,
    type: "product",
    name: product.name,
    controlLabel: product.name,
    description,
    persistedAvailable: product.isAvailable,
    effectiveAvailable:
      product.isAvailable && (children.length === 0 || availableCount > 0),
    disabledReason: null,
    children,
  };
}

export function mapIntake(dto: AvailabilityIntakeDto): AvailabilityStandalone {
  const timestamp =
    dto.updatedAt === null
      ? null
      : new Intl.DateTimeFormat("ru-RU", {
          dateStyle: "short",
          timeStyle: "short",
          timeZone: "UTC",
        }).format(new Date(dto.updatedAt));
  const description =
    timestamp === null
      ? "Не влияет на обработку созданных заказов"
      : `Изменено ${timestamp}${dto.updatedByLabel === null ? "" : ` · ${dto.updatedByLabel}`}`;

  return {
    id: "intake",
    type: "intake",
    name: "Принимать новые заказы",
    controlLabel: "Принимать новые заказы",
    description,
    persistedAvailable: dto.acceptsNewOrders,
    effectiveAvailable: dto.acceptsNewOrders,
    disabledReason: null,
  };
}
