import type {
  AvailabilityDto,
  AvailabilityGroup,
  AvailabilityIntakeDto,
  AvailabilityItem,
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
        .flatMap((product) => [
          {
            id: product.id,
            type: "product" as const,
            name: product.name,
            description:
              product.price === null
                ? dto.priceChoices
                    .filter((choice) => choice.productId === product.id)
                    .sort((left, right) => left.sortOrder - right.sortOrder)
                    .map(
                      (choice) => `${choice.portionLabel} · ${choice.price} ₽`,
                    )
                    .join(" / ")
                : `${product.price} ₽`,
            available: product.isAvailable,
          },
          ...dto.priceChoices
            .filter((choice) => choice.productId === product.id)
            .sort((left, right) => left.sortOrder - right.sortOrder)
            .map((choice) => ({
              id: choice.id,
              type: "price-choice" as const,
              name: `${product.name} · ${choice.portionLabel}`,
              description: `${choice.price} ₽`,
              available: choice.isAvailable,
            })),
        ]),
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
          description: `${option.priceDelta} ₽`,
          available: option.isAvailable,
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

export function mapIntake(dto: AvailabilityIntakeDto): AvailabilityItem {
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
      : `Изменено ${timestamp} UTC${dto.updatedByLabel === null ? "" : ` · ${dto.updatedByLabel}`}`;

  return {
    id: "intake",
    type: "intake",
    name: "Принимать новые заказы",
    description,
    available: dto.acceptsNewOrders,
  };
}
