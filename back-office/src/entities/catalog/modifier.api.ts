import { contractFailure, request } from "../../shared/api/transport";
import { modifierEndpoint } from "./modifier.constants";
import { parseModifier, parseModifierOptions } from "./catalog.validation";
import type {
  Catalog,
  ModifierIntent,
  ModifierOptionFields,
  CatalogOptionDto,
} from "./catalog.types";

function sameOption(option: CatalogOptionDto, fields: ModifierOptionFields) {
  return (
    option.name === fields.name &&
    option.priceDelta === fields.priceDelta &&
    option.sortOrder === fields.sortOrder &&
    option.isDefault === fields.isDefault &&
    option.isAvailable === fields.isAvailable
  );
}

export async function writeModifier(
  token: string,
  intent: ModifierIntent,
  catalog: Catalog,
) {
  if (intent.kind === "modifier-archive") {
    await request(`${modifierEndpoint}/${intent.baseline.id}`, {
      token,
      method: "DELETE",
      expectedStatus: 204,
    });

    return null;
  }

  if (intent.kind === "modifier-reorder") {
    const options = parseModifierOptions(
      await request(
        `${modifierEndpoint}/${intent.baseline.id}/options/reorder`,
        {
          token,
          method: "POST",
          body: { optionIds: intent.ids },
          expectedStatus: 200,
        },
      ),
    );

    if (
      options.length !== intent.ids.length ||
      options.some((option, index) => {
        const previous = intent.baseline.options.find(
          (item) => item.id === option.id,
        );

        return (
          previous === undefined ||
          option.id !== intent.ids[index] ||
          option.groupId !== intent.baseline.id ||
          !sameOption(option, { ...previous, sortOrder: index })
        );
      })
    )
      contractFailure();

    return options;
  }

  const creating = intent.kind === "modifier-create";
  const group = parseModifier(
    await request(
      creating ? modifierEndpoint : `${modifierEndpoint}/${intent.baseline.id}`,
      {
        token,
        method: creating ? "POST" : "PATCH",
        body: intent.fields,
        expectedStatus: creating ? 201 : 200,
      },
    ),
  );
  const knownIds = new Set([
    ...catalog.categories.map((item) => item.id),
    ...catalog.products.flatMap((item) => [
      item.id,
      ...item.priceChoices.map((choice) => choice.id),
    ]),
    ...catalog.modifierGroups.map((item) => item.id),
    ...catalog.modifierOptions.map((item) => item.id),
  ]);
  const fields = intent.fields;
  const expected = [...fields.options].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );

  if (
    (creating ? knownIds.has(group.id) : group.id !== intent.baseline.id) ||
    group.name !== fields.name ||
    group.selectionType !== fields.selectionType ||
    group.minSelect !== fields.minSelect ||
    group.maxSelect !== fields.maxSelect ||
    group.isActive !== fields.isActive ||
    group.options.length !== expected.length ||
    group.options.some((option, index) => {
      const field = expected[index];

      return (
        field === undefined ||
        !sameOption(option, field) ||
        (field.id !== undefined
          ? option.id !== field.id
          : knownIds.has(option.id) || option.id === group.id) ||
        (!creating && intent.omittedIds.includes(option.id))
      );
    })
  )
    contractFailure();

  return group;
}
