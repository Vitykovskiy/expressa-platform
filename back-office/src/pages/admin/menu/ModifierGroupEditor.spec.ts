import { mount, type VueWrapper } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import { vuetify } from "../../../app/plugins/vuetify";
import ModifierGroupEditor from "./ModifierGroupEditor.vue";
import ModifierOptionEditor from "./ModifierOptionEditor.vue";
import type { ModifierGroup } from "./catalog.types";

describe("ModifierGroupEditor", () => {
  it("показывает редактор первого варианта после нажатия кнопки", async () => {
    const wrapper = mount(ModifierGroupEditor, {
      props: { group: null },
      global: { plugins: [vuetify] },
    });

    const addButton = wrapper
      .findAll("button")
      .find((button) => button.text() === "Добавить вариант");

    expect(addButton).toBeDefined();
    await addButton?.trigger("click");

    expect(wrapper.find(".modifier-option-editor").exists()).toBe(true);
    expect(wrapper.text()).not.toContain("Варианты добавок пока не добавлены.");
  });

  it("перемещает только локальный черновик и нормализует порядок при сохранении", async () => {
    const wrapper = mount(ModifierGroupEditor, {
      props: { group },
      global: { plugins: [vuetify] },
    });

    expect(
      wrapper
        .get('button[aria-label="Переместить Первый вверх"]')
        .attributes("disabled"),
    ).toBeDefined();
    expect(
      wrapper
        .get('button[aria-label="Переместить Третий вниз"]')
        .attributes("disabled"),
    ).toBeDefined();
    await wrapper
      .get('button[aria-label="Переместить Второй вверх"]')
      .trigger("click");

    expect(optionNames(wrapper)).toEqual(["Второй", "Первый", "Третий"]);
    expect(wrapper.emitted("save")).toBeUndefined();
    await wrapper.get("form").trigger("submit");

    expect(wrapper.emitted("save")?.[0]?.[0]).toMatchObject({
      options: [
        { name: "Второй", sortOrder: 0 },
        { name: "Первый", sortOrder: 1 },
        { name: "Третий", sortOrder: 2 },
      ],
    });
  });

  it("сохраняет порядок черновика при серверной ошибке", async () => {
    const wrapper = mount(ModifierGroupEditor, {
      props: { group },
      global: { plugins: [vuetify] },
    });
    await wrapper
      .get('button[aria-label="Переместить Второй вверх"]')
      .trigger("click");

    await wrapper.setProps({
      fieldErrors: { "options.0.name": "Проверьте вариант" },
    });

    expect(optionNames(wrapper)).toEqual(["Второй", "Первый", "Третий"]);
    expect(wrapper.text()).toContain("Проверьте вариант");
  });

  it("добавляет вариант в конец и удаляет без сброса остальных", async () => {
    const wrapper = mount(ModifierGroupEditor, {
      props: { group },
      global: { plugins: [vuetify] },
    });

    await wrapper
      .findAll("button")
      .find((button) => button.text() === "Добавить вариант")
      ?.trigger("click");
    expect(optionNames(wrapper)).toEqual(["Первый", "Второй", "Третий", ""]);

    wrapper.findAllComponents(ModifierOptionEditor)[1]?.vm.$emit("remove");
    await wrapper.vm.$nextTick();

    expect(optionNames(wrapper)).toEqual(["Первый", "Третий", ""]);
  });

  it("не сохраняет отрицательное изменение цены", async () => {
    const wrapper = mount(ModifierGroupEditor, {
      props: {
        group: {
          ...group,
          options: [{ ...group.options[0]!, priceDelta: -1 }],
        },
      },
      global: { plugins: [vuetify] },
    });

    await wrapper.get("form").trigger("submit");

    expect(wrapper.text()).toContain("Укажите изменение цены в целых рублях");
    expect(wrapper.emitted("save")).toBeUndefined();
  });
});

const group: ModifierGroup = {
  id: "group",
  name: "Добавки",
  selectionType: "multiple",
  minSelect: 0,
  maxSelect: 3,
  isActive: true,
  options: ["Первый", "Второй", "Третий"].map((name, index) => ({
    id: `option-${index}`,
    groupId: "group",
    name,
    priceDelta: 0,
    sortOrder: index,
    isDefault: false,
    isAvailable: true,
  })),
};

function optionNames(wrapper: VueWrapper): string[] {
  return wrapper
    .findAll('.modifier-option-editor input[type="text"]')
    .map((input) => (input.element as HTMLInputElement).value);
}
