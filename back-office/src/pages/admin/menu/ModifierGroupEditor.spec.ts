import { mount, type VueWrapper } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import { vuetify } from "../../../app/plugins/vuetify";
import ModifierGroupEditor from "./ModifierGroupEditor.vue";
import ModifierOptionEditor from "./ModifierOptionEditor.vue";
import ConfirmDialog from "../../../shared/ui/admin/confirm-dialog/ConfirmDialog.vue";
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

  it("не рендерит status без pending или outcome feedback", () => {
    const wrapper = mount(ModifierGroupEditor, {
      props: { group },
      global: { plugins: [vuetify] },
    });

    expect(wrapper.find('[role="status"]').exists()).toBe(false);
  });

  it("показывает pending feedback с приоритетом над settled outcome", async () => {
    const wrapper = mount(ModifierGroupEditor, {
      props: {
        group,
        pendingMessage: "Группа сохранена. Обновляем меню…",
        saveOutcome: "unconfirmed",
      },
      global: { plugins: [vuetify] },
    });

    expect(wrapper.get('[role="status"]').text()).toBe(
      "Группа сохранена. Обновляем меню…",
    );
    expect(wrapper.text()).not.toContain("Не удалось подтвердить сохранение");
    expect(
      wrapper.findAll("button").some((item) => item.text() === "Обновить меню"),
    ).toBe(false);

    await wrapper.setProps({ pendingMessage: null });
    expect(wrapper.text()).toContain("Не удалось подтвердить сохранение");
    expect(
      wrapper.findAll("button").some((item) => item.text() === "Обновить меню"),
    ).toBe(true);
  });

  it.each([
    ["rejected", "Архивирование группы отклонено."],
    ["unconfirmed", "Не удалось подтвердить архивирование группы."],
  ] as const)(
    "показывает %s archive feedback и только GET recovery",
    async (saveOutcome, message) => {
      const wrapper = mount(ModifierGroupEditor, {
        props: { group, operationKind: "archive", saveOutcome },
        global: { plugins: [vuetify] },
      });

      expect(wrapper.get('[role="status"]').text()).toContain(message);
      expect(
        button(wrapper, "Сохранить группу").attributes("disabled"),
      ).toBeDefined();
      expect(
        button(wrapper, "Архивировать группу").attributes("disabled"),
      ).toBeDefined();

      await button(wrapper, "Обновить меню").trigger("click");

      expect(wrapper.emitted("refresh")).toHaveLength(1);
      expect(wrapper.emitted("save")).toBeUndefined();
      expect(wrapper.emitted("archive")).toBeUndefined();
    },
  );

  it("скрывает archive diagnostic в native details до явного раскрытия", async () => {
    const wrapper = mount(ModifierGroupEditor, {
      props: {
        group,
        operationKind: "archive",
        saveError: {
          message: "Internal server error",
          requestId: "request-500",
        },
        saveOutcome: "unconfirmed",
      },
      attachTo: document.body,
      global: { plugins: [vuetify] },
    });

    const details = wrapper.get(".modifier-group-editor__diagnostics");
    const summary = details.get("summary");

    expect(details.attributes("open")).toBeUndefined();
    expect(summary.text()).toBe("Технические сведения");
    expect(wrapper.get('[role="status"]').text()).toContain(
      "Не удалось подтвердить архивирование группы.",
    );
    expect(
      wrapper
        .findAll(".modifier-group-editor__feedback > p")
        .map((item) => item.text()),
    ).not.toContain("Internal server error");

    (summary.element as HTMLElement).focus();
    expect(document.activeElement).toBe(summary.element);
    await summary.trigger("click");

    expect((details.element as HTMLDetailsElement).open).toBe(true);
    expect(details.text()).toContain("Internal server error");
    expect(details.text()).toContain("Идентификатор запроса: request-500");
  });

  it("отправляет inactive required пустую группу без изменения payload", async () => {
    const wrapper = mount(ModifierGroupEditor, {
      props: {
        group: {
          ...group,
          isActive: false,
          maxSelect: 1,
          minSelect: 1,
          options: [],
        },
      },
      global: { plugins: [vuetify] },
    });

    await wrapper.get("form").trigger("submit");

    expect(wrapper.emitted("save")?.[0]?.[0]).toMatchObject({
      id: group.id,
      isActive: false,
      maxSelect: 1,
      minSelect: 1,
      options: [],
    });
    expect(wrapper.text()).not.toContain(
      "Количество вариантов по умолчанию должно соответствовать границам выбора",
    );
  });

  it("сохраняет structural validation inactive группы", async () => {
    const wrapper = mount(ModifierGroupEditor, {
      props: {
        group: {
          ...group,
          isActive: false,
          maxSelect: 1,
          minSelect: 1,
          options: [],
        },
      },
      global: { plugins: [vuetify] },
    });

    await wrapper.get('input[type="text"]').setValue("");
    await wrapper.get("form").trigger("submit");

    expect(wrapper.emitted("save")).toBeUndefined();
    expect(wrapper.text()).toContain("Введите название группы");
  });

  it("возвращает active default constraint после реактивации", async () => {
    const wrapper = mount(ModifierGroupEditor, {
      props: {
        group: {
          ...group,
          isActive: false,
          maxSelect: 1,
          minSelect: 1,
          options: [],
        },
      },
      global: { plugins: [vuetify] },
    });
    const toggles = wrapper.findAll('[role="switch"]');

    await toggles[1]!.trigger("click");

    expect(wrapper.text()).toContain(
      "Количество вариантов по умолчанию должно соответствовать границам выбора",
    );
    await wrapper.get("form").trigger("submit");
    expect(wrapper.emitted("save")).toBeUndefined();
  });

  it.each(["required", "minimum"] as const)(
    "показывает aggregate default constraint при изменении %s",
    async (interaction) => {
      const wrapper = mount(ModifierGroupEditor, {
        props: { group: { ...group, maxSelect: 1, options: [] } },
        global: { plugins: [vuetify] },
      });

      if (interaction === "required") {
        await wrapper.findAll('[role="switch"]')[0]!.trigger("click");
      } else {
        await wrapper
          .findAll(".modifier-group-editor__limits input")[0]!
          .setValue("1");
      }

      expect(wrapper.text()).toContain(
        "Количество вариантов по умолчанию должно соответствовать границам выбора",
      );
    },
  );

  it("сохраняет valid active группу с существующими default rules", async () => {
    const wrapper = mount(ModifierGroupEditor, {
      props: { group },
      global: { plugins: [vuetify] },
    });

    await wrapper.get("form").trigger("submit");

    expect(wrapper.emitted("save")).toHaveLength(1);
  });

  it("не показывает local errors новому черновику и варианту до касания или submit", async () => {
    const wrapper = mount(ModifierGroupEditor, {
      props: { group: null },
      global: { plugins: [vuetify] },
    });

    await button(wrapper, "Добавить вариант").trigger("click");
    expect(wrapper.text()).not.toContain("Введите название группы");
    expect(wrapper.text()).not.toContain("Введите название варианта");

    await wrapper.get("form").trigger("submit");
    expect(wrapper.text()).toContain("Введите название группы");
    expect(wrapper.text()).toContain("Введите название варианта");
    expect(wrapper.emitted("save")).toBeUndefined();
  });

  it("снимает только исправленную server error и сбрасывает indexed errors при изменении порядка", async () => {
    const wrapper = mount(ModifierGroupEditor, {
      props: {
        fieldErrors: {
          "options.0.name": "Первый уже существует",
          "options.1.priceDelta": "Цена второго неверна",
        },
        group,
      },
      global: { plugins: [vuetify] },
    });

    await wrapper
      .findAll('.modifier-option-editor input[type="text"]')[0]!
      .setValue("Исправленный первый");
    expect(wrapper.text()).not.toContain("Первый уже существует");
    expect(wrapper.text()).toContain("Цена второго неверна");

    await wrapper
      .get('button[aria-label="Переместить Второй вверх"]')
      .trigger("click");
    expect(wrapper.text()).not.toContain("Цена второго неверна");
  });

  it("показывает local errors только после касания их собственного поля", async () => {
    const wrapper = mount(ModifierGroupEditor, {
      props: { group: null },
      global: { plugins: [vuetify] },
    });
    await button(wrapper, "Добавить вариант").trigger("click");
    const option = wrapper.getComponent(ModifierOptionEditor);

    option.vm.$emit("touch", "priceDelta");
    option.vm.$emit("update:modelValue", {
      isAvailable: true,
      isDefault: false,
      name: "",
      priceDelta: "-1",
    });
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain("Укажите изменение цены в целых рублях");
    expect(wrapper.text()).not.toContain("Введите название варианта");
    expect(wrapper.text()).not.toContain("Введите название группы");
  });

  it("показывает относящееся к минимуму и максимуму ограничение выбора без касания типа", async () => {
    const wrapper = mount(ModifierGroupEditor, {
      props: { group: { ...group, maxSelect: 1, selectionType: "single" } },
      global: { plugins: [vuetify] },
    });
    const limits = wrapper.findAll(".modifier-group-editor__limits input");

    await limits[1]!.setValue("2");
    expect(wrapper.text()).toContain(
      "Для одиночного выбора максимум должен быть равен одному",
    );
    expect(wrapper.text()).not.toContain("Введите название группы");
    expect(wrapper.emitted("save")).toBeUndefined();

    await limits[0]!.setValue("1");
    expect(wrapper.text()).toContain(
      "Для одиночного выбора максимум должен быть равен одному",
    );
  });

  it.each(["0", "2"])(
    "блокирует single с max=%s одной связанной подсказкой",
    async (max) => {
      const wrapper = mount(ModifierGroupEditor, {
        props: { group: { ...group, maxSelect: 1, selectionType: "single" } },
        global: { plugins: [vuetify] },
      });
      const maxSelect = wrapper.findAll(
        ".modifier-group-editor__limits input",
      )[1]!;

      await maxSelect.setValue(max);
      await wrapper.get("form").trigger("submit");

      const alerts = wrapper
        .findAll('[role="alert"]')
        .filter((alert) =>
          alert
            .text()
            .includes(
              "Для одиночного выбора максимум должен быть равен одному",
            ),
        );
      expect(alerts).toHaveLength(1);
      expect(alerts[0]!.text()).toContain(
        "Для одиночного выбора максимум должен быть равен одному",
      );
      expect(maxSelect.attributes("aria-invalid")).toBe("true");
      expect(maxSelect.attributes("aria-describedby")).toMatch(
        /^modifier-group-max-select-error-/,
      );
      expect(wrapper.emitted("save")).toBeUndefined();
    },
  );

  it("показывает повторный server error после исправления в том же черновике", async () => {
    const wrapper = mount(ModifierGroupEditor, {
      props: { fieldErrors: { name: "Название отклонено" }, group },
      global: { plugins: [vuetify] },
    });
    const input = wrapper.get('.modifier-group-editor input[type="text"]');

    await input.setValue("Исправленные добавки");
    expect(wrapper.text()).not.toContain("Название отклонено");
    await wrapper.setProps({ fieldErrors: { name: "Название отклонено" } });

    expect((input.element as HTMLInputElement).value).toBe(
      "Исправленные добавки",
    );
    expect(wrapper.text()).toContain("Название отклонено");
  });

  it("показывает aggregate и boolean server errors у корректируемого варианта", async () => {
    const wrapper = mount(ModifierGroupEditor, {
      props: {
        fieldErrors: {
          "options.0.isAvailable": "Сделайте вариант доступным",
          "options.0.isDefault": "Проверьте вариант по умолчанию",
        },
        group: { ...group, minSelect: 1, maxSelect: 2 },
      },
      global: { plugins: [vuetify] },
    });
    const option = wrapper.getComponent(ModifierOptionEditor);

    expect(wrapper.text()).toContain("Сделайте вариант доступным");
    expect(wrapper.text()).toContain("Проверьте вариант по умолчанию");
    option.vm.$emit("touch", "isDefault");
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain(
      "Количество вариантов по умолчанию должно соответствовать границам выбора",
    );
    expect(wrapper.text()).not.toContain("Проверьте вариант по умолчанию");
    expect(wrapper.text()).toContain("Сделайте вариант доступным");
    await wrapper.get("form").trigger("submit");
    expect(wrapper.emitted("save")).toBeUndefined();
  });

  it("снимает min и superseded aggregate errors через required toggle", async () => {
    const wrapper = mount(ModifierGroupEditor, {
      props: {
        fieldErrors: {
          minSelect: "Минимум отклонён сервером",
          options: "Проверьте варианты",
        },
        group,
      },
      global: { plugins: [vuetify] },
    });

    expect(wrapper.text()).toContain("Минимум отклонён сервером");
    expect(wrapper.text()).toContain("Проверьте варианты");
    await wrapper.get('[role="switch"]').trigger("click");

    expect(wrapper.text()).not.toContain("Минимум отклонён сервером");
    expect(wrapper.text()).not.toContain("Проверьте варианты");
    expect(
      (
        wrapper.findAll(".modifier-group-editor__limits input")[0]!
          .element as HTMLInputElement
      ).value,
    ).toBe("1");
  });

  it("исправляет selection server error отдельно от aggregate options error", async () => {
    const wrapper = mount(ModifierGroupEditor, {
      props: {
        fieldErrors: {
          options: "Проверьте варианты",
          selectionType: "Тип выбора недоступен",
        },
        group,
      },
      global: { plugins: [vuetify] },
    });

    expect(wrapper.text()).toContain("Тип выбора недоступен");
    expect(wrapper.text()).toContain("Проверьте варианты");
    await wrapper.get("select").setValue("single");
    expect(wrapper.text()).not.toContain("Тип выбора недоступен");
    expect(wrapper.text()).toContain("Проверьте варианты");

    wrapper.getComponent(ModifierOptionEditor).vm.$emit("touch", "isDefault");
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).not.toContain("Проверьте варианты");
  });

  it("сохраняет touched option вместе с ним при move/remove и начинает fresh null session без errors", async () => {
    const wrapper = mount(ModifierGroupEditor, {
      props: { group },
      global: { plugins: [vuetify] },
    });
    wrapper
      .findAllComponents(ModifierOptionEditor)[1]!
      .vm.$emit("touch", "name");
    wrapper
      .findAllComponents(ModifierOptionEditor)[1]!
      .vm.$emit("update:modelValue", { ...group.options[1]!, name: "" });
    await wrapper
      .get('button[aria-label="Переместить Второй вверх"]')
      .trigger("click");
    expect(wrapper.text()).toContain("Введите название варианта");
    wrapper.findAllComponents(ModifierOptionEditor)[0]!.vm.$emit("remove");
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).not.toContain("Введите название варианта");

    await wrapper.setProps({ group: null });
    expect(wrapper.text()).not.toContain("Введите название варианта");
  });

  it("показывает aggregate error и блокирует save после удаления default из required group", async () => {
    const wrapper = mount(ModifierGroupEditor, {
      props: {
        group: {
          ...group,
          minSelect: 1,
          options: [
            { ...group.options[0]!, isDefault: true },
            group.options[1]!,
          ],
        },
      },
      global: { plugins: [vuetify] },
    });

    wrapper.getComponent(ModifierOptionEditor).vm.$emit("remove");
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain(
      "Количество вариантов по умолчанию должно соответствовать границам выбора",
    );
    await wrapper.get("form").trigger("submit");
    expect(wrapper.emitted("save")).toBeUndefined();
  });

  it("сохраняет черновик при обновлении той же группы и очищает его при fresh null reopen", async () => {
    const wrapper = mount(ModifierGroupEditor, {
      props: { group },
      global: { plugins: [vuetify] },
    });
    const nameInput = wrapper.get('form > fieldset > label input[type="text"]');

    await nameInput.setValue("Локальная правка");
    await wrapper.setProps({ group: { ...group, name: "Обновлено извне" } });
    expect((nameInput.element as HTMLInputElement).value).toBe(
      "Локальная правка",
    );

    await wrapper.setProps({ group: null });
    expect((nameInput.element as HTMLInputElement).value).toBe("");
    expect(wrapper.text()).not.toContain("Введите название группы");
  });

  it("не меняет draft и не завершает confirmation при effective form lock", async () => {
    const wrapper = mount(ModifierGroupEditor, {
      props: { disabled: true, group },
      global: { plugins: [vuetify] },
    });
    const option = wrapper.getComponent(ModifierOptionEditor);

    option.vm.$emit("update:modelValue", {
      ...group.options[0]!,
      name: "Новое",
    });
    option.vm.$emit("moveDown");
    option.vm.$emit("remove");
    await button(wrapper, "Добавить вариант").trigger("click");
    await wrapper.get("form").trigger("submit");
    wrapper.findAllComponents(ConfirmDialog)[0]!.vm.$emit("confirm");
    wrapper.findAllComponents(ConfirmDialog).at(-1)!.vm.$emit("confirm");
    wrapper
      .findAllComponents(ConfirmDialog)
      .at(-1)!
      .vm.$emit("update:open", false);
    await button(wrapper, "Отмена").trigger("click");
    await wrapper.vm.$nextTick();

    expect(optionNames(wrapper)).toEqual(["Первый", "Второй", "Третий"]);
    expect(wrapper.emitted("save")).toBeUndefined();
    expect(wrapper.emitted("archive")).toBeUndefined();
    expect(wrapper.emitted("cancel")).toBeUndefined();
    for (const label of ["Добавить вариант", "Архивировать группу", "Отмена"]) {
      expect(button(wrapper, label).attributes("disabled")).toBeDefined();
    }
  });

  it.each(["unconfirmed", "checked"] as const)(
    "сохраняет draft и разрешает explicit cancel после %s",
    async (saveOutcome) => {
      const wrapper = mount(ModifierGroupEditor, {
        props: { group, saveOutcome },
        global: { plugins: [vuetify] },
      });
      const option = wrapper.getComponent(ModifierOptionEditor);

      option.vm.$emit("update:modelValue", {
        ...group.options[0]!,
        name: "Новое",
      });
      await wrapper.get("form").trigger("submit");
      await button(wrapper, "Отмена").trigger("click");
      await wrapper.vm.$nextTick();

      expect(optionNames(wrapper)).toEqual(["Первый", "Второй", "Третий"]);
      expect(wrapper.emitted("save")).toBeUndefined();
      expect(wrapper.emitted("archive")).toBeUndefined();
      expect(wrapper.emitted("cancel")).toHaveLength(1);
      expect(button(wrapper, "Отмена").attributes("disabled")).toBeUndefined();
    },
  );
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

function button(wrapper: VueWrapper, text: string) {
  return wrapper.findAll("button").find((item) => item.text() === text)!;
}
