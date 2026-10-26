import type {
  AvailabilityCategoryDto,
  AvailabilityChoice,
  AvailabilityChoiceDto,
  AvailabilityDto,
  AvailabilityGroup,
  AvailabilityGroupDto,
  AvailabilityModifierDto,
  AvailabilityIntakeDto,
  AvailabilityProduct,
  AvailabilityProductDto,
  AvailabilityStandalone,
} from "./availability.types";

export function mapAvailability(
  dto: AvailabilityDto,
): readonly AvailabilityGroup[] {
  const categories = dto.categories
    .filter((category) => category.isActive)
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((category) => mapCategory(category, dto));
  const modifiers = dto.modifierGroups
    .filter((group) => group.isActive)
    .map((group) => mapModifierGroup(group, dto.modifierOptions));

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

function mapCategory(
  category: AvailabilityCategoryDto,
  dto: AvailabilityDto,
): AvailabilityGroup {
  return {
    key: `category:${category.id}`,
    name: category.name,
    items: dto.products
      .filter(
        (product) => product.isActive && product.categoryId === category.id,
      )
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((product) => mapProduct(product, dto.priceChoices)),
  };
}

function mapModifierGroup(
  group: AvailabilityGroupDto,
  options: readonly AvailabilityModifierDto[],
): AvailabilityGroup {
  return {
    key: `group:${group.id}`,
    name: group.name,
    items: options
      .filter((option) => option.groupId === group.id)
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((option) => ({
        id: option.id,
        type: "modifier",
        name: option.name,
        controlLabel: `${group.name} · ${option.name}`,
        description: `${option.priceDelta} ₽`,
        persistedAvailable: option.isAvailable,
        effectiveAvailable: option.isAvailable,
        disabledReason: null,
      })),
  };
}

function mapProduct(
  product: AvailabilityProductDto,
  priceChoices: readonly AvailabilityChoiceDto[],
): AvailabilityProduct {
  const children = priceChoices
    .filter((choice) => choice.productId === product.id)
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((choice): AvailabilityChoice => ({
      id: choice.id,
      type: "price-choice",
      name: choice.portionLabel,
      controlLabel: `${product.name} · ${choice.portionLabel}`,
      description: `${choice.price} ₽`,
      // Выключение товара не меняет сохранённые настройки его размеров.
      persistedAvailable: choice.isAvailable,
      effectiveAvailable: product.isAvailable && choice.isAvailable,
      disabledReason: product.isAvailable ? null : "product-unavailable",
    }));
  const availableCount = children.filter(
    (choice) => choice.effectiveAvailable,
  ).length;

  return {
    id: product.id,
    type: "product",
    name: product.name,
    controlLabel: product.name,
    description: productAvailabilityDescription(
      product,
      children.length,
      availableCount,
    ),
    persistedAvailable: product.isAvailable,
    effectiveAvailable:
      product.isAvailable && (children.length === 0 || availableCount > 0),
    disabledReason: null,
    children,
  };
}

function productAvailabilityDescription(
  product: AvailabilityProductDto,
  choiceCount: number,
  availableChoiceCount: number,
): string {
  if (choiceCount === 0) {
    return `${product.price} ₽`;
  }

  if (!product.isAvailable) {
    return "Весь напиток выключен";
  }

  if (availableChoiceCount === 0) {
    return "Нет доступных размеров";
  }

  if (availableChoiceCount === choiceCount) {
    return "Все размеры доступны";
  }

  return `${availableChoiceCount} из ${choiceCount} размеров`;
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
