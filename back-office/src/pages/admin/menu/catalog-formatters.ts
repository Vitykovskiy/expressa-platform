/** Russian catalogue labels kept in one place so every menu surface agrees. */
export function russianCount(
  count: number,
  one: string,
  few: string,
  many: string,
): string {
  const lastTwo = Math.abs(count) % 100;
  const last = Math.abs(count) % 10;
  const word =
    lastTwo >= 11 && lastTwo <= 14
      ? many
      : last === 1
        ? one
        : last >= 2 && last <= 4
          ? few
          : many;

  return `${count} ${word}`;
}

export function categoryCountLabel(count: number): string {
  return russianCount(count, "категория", "категории", "категорий");
}

export function productCountLabel(count: number): string {
  return russianCount(count, "товар", "товара", "товаров");
}

export function modifierGroupCountLabel(count: number): string {
  return russianCount(
    count,
    "группа добавок",
    "группы добавок",
    "групп добавок",
  );
}

export function modifierOptionCountLabel(count: number): string {
  return russianCount(count, "опция", "опции", "опций");
}
