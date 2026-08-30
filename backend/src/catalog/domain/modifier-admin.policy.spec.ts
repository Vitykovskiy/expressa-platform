import {
  assertFullModifierOptionReorder,
  assertPublishableModifierGroup,
  ModifierAdminError,
} from "./modifier-admin.policy";

const group = {
  name: "Молоко",
  selectionType: "multiple" as const,
  minSelect: 1,
  maxSelect: 2,
  isActive: true,
};
const option = {
  name: "Овсяное",
  priceDelta: 0,
  sortOrder: 0,
  isDefault: true,
  isAvailable: true,
};
describe("modifier admin policy", () => {
  it("публикует обязательную группу только с доступными бесплатными defaults в границах", () => {
    expect(() => assertPublishableModifierGroup(group, [option])).not.toThrow();
    expect(() =>
      assertPublishableModifierGroup(group, [{ ...option, priceDelta: 1 }]),
    ).toThrow(ModifierAdminError);
    expect(() =>
      assertPublishableModifierGroup(group, [
        { ...option, isAvailable: false },
      ]),
    ).toThrow(ModifierAdminError);
  });
  it("не допускает отрицательную доплату", () => {
    expect(() =>
      assertPublishableModifierGroup(group, [{ ...option, priceDelta: -1 }]),
    ).toThrow("MODIFIER_INVALID");
  });
  it("не допускает single с максимумом больше одного и неполный reorder", () => {
    expect(() =>
      assertPublishableModifierGroup(
        { ...group, selectionType: "single", maxSelect: 2 },
        [option],
      ),
    ).toThrow("MODIFIER_INVALID");
    const options = [
      { id: "a", groupId: "group", ...option, archivedAt: null },
      { id: "b", groupId: "group", ...option, sortOrder: 1, archivedAt: null },
    ];
    expect(() =>
      assertFullModifierOptionReorder(options, "group", ["a"]),
    ).toThrow("MODIFIER_REORDER_INVALID");
    expect(() =>
      assertFullModifierOptionReorder(options, "group", ["b", "a"]),
    ).not.toThrow();
  });
});
