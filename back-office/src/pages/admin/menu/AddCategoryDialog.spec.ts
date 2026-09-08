import { mount } from "@vue/test-utils";
import { defineComponent, nextTick, ref } from "vue";
import { describe, expect, it } from "vitest";

import AddCategoryDialog from "./AddCategoryDialog.vue";

describe("AddCategoryDialog", () => {
  it("не показывает required до blur, а whitespace-only имя не отправляет", async () => {
    const wrapper = mount(AddCategoryDialog, {
      global: {
        stubs: {
          AdminButton: {
            template: '<button :disabled="$attrs.disabled"><slot /></button>',
          },
          AdminDialog: { template: "<div><slot /></div>" },
          AdminTextField: { template: "<input />" },
          AdminToggle: { template: '<input type="checkbox" />' },
          VCard: { template: "<div><slot /></div>" },
          VCardActions: { template: "<div><slot /></div>" },
          VCardText: { template: "<div><slot /></div>" },
        },
      },
      props: { disabled: false, open: true },
    });

    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
    const name = wrapper.get('input[id^="add-category-name-"]');
    await name.setValue("   ");
    await name.trigger("blur");

    expect(wrapper.emitted("confirm")).toBeUndefined();
    expect(wrapper.text()).toContain("Введите название категории");
  });

  it.each(["unconfirmed", "saved"] as const)(
    "даёт закрыть форму после %s без повторной записи",
    async (saveOutcome) => {
      const wrapper = mount(AddCategoryDialog, {
        global: { stubs: dialogStubs },
        props: { disabled: false, open: true, saveOutcome },
      });

      const close = wrapper
        .findAll("button")
        .find((button) => button.text() === "Закрыть форму");
      expect(close).toBeDefined();
      await close!.trigger("click");

      expect(wrapper.emitted("cancel")).toHaveLength(1);
      expect(wrapper.emitted("confirm")).toBeUndefined();
    },
  );

  it("единственный recovery uncertain результата делает один refresh", async () => {
    const wrapper = mount(AddCategoryDialog, {
      global: { stubs: dialogStubs },
      props: { disabled: false, open: true, saveOutcome: "unconfirmed" },
    });

    const recovery = wrapper
      .findAll("button")
      .filter((button) => button.text() === "Обновить меню");

    expect(recovery).toHaveLength(1);
    await recovery[0]!.trigger("click");
    expect(wrapper.emitted("refresh")).toHaveLength(1);
  });

  it("связывает server errors полей с aria и снимает их после исправления", async () => {
    const wrapper = mount(AddCategoryDialog, {
      global: { stubs: dialogStubs },
      props: {
        disabled: false,
        fieldErrors: {
          description: "Описание",
          isActive: "Статус",
          name: "Имя",
        },
        open: true,
      },
    });
    const name = wrapper.get('input[id^="add-category-name-"]');
    const description = wrapper.get('input[id^="add-category-description-"]');
    const active = wrapper.get('[role="switch"]');

    for (const field of [name, description, active]) {
      expect(field.attributes("aria-invalid")).toBe("true");
      const errorId = field.attributes("aria-describedby");
      expect(errorId).toBeTruthy();
      expect(wrapper.get(`#${errorId}`).attributes("role")).toBe("alert");
    }
    expect(wrapper.findAll('[role="alert"]')).toHaveLength(3);
    await name.setValue("Чай");
    await description.setValue("Листья");
    await active.trigger("click");
    expect(wrapper.text()).not.toContain("Имя");
    expect(wrapper.findAll('[role="alert"]')).toHaveLength(0);
  });

  it("не позволяет закрыть unconfirmed форму через model-close или duplicate event", async () => {
    const wrapper = mount(AddCategoryDialog, {
      global: { stubs: dialogStubs },
      props: { disabled: false, open: true, saveOutcome: "unconfirmed" },
    });
    const dialog = wrapper.getComponent({ name: "AdminDialog" });

    await dialog.vm.$emit("update:modelValue", false);
    await dialog.vm.$emit("update:modelValue", false);
    expect(wrapper.emitted("cancel")).toBeUndefined();
  });

  it("отображает rejected feedback и long diagnostic с wrapping", () => {
    const diagnostic =
      "Диагностическая запись с очень длинным непрерывным идентификатором request_failure_012345678901234567890123456789";
    const wrapper = mount(AddCategoryDialog, {
      global: { stubs: dialogStubs },
      props: {
        disabled: false,
        open: true,
        saveError: {
          message: diagnostic,
          requestId: "r-1",
        },
        saveOutcome: "rejected",
      },
    });

    expect(wrapper.get("details").text()).toContain(diagnostic);
    expect(wrapper.get("details").classes()).toContain(
      "add-dialog-technical-details",
    );
    expect(wrapper.text()).toContain("Исправьте отмеченные поля");
  });

  it("отправляет trimmed данные pointer и reset-ит черновик при reopen", async () => {
    const wrapper = mount(AddCategoryDialog, {
      global: { stubs: dialogStubs },
      props: { disabled: false, open: true },
    });
    const name = wrapper.get('input[id^="add-category-name-"]');
    await name.setValue("  Кофе  ");
    await wrapper
      .findAll("button")
      .find((button) => button.text() === "Добавить категорию")!
      .trigger("click");
    expect(wrapper.emitted("confirm")).toEqual([
      [{ description: "", isActive: true, name: "Кофе" }],
    ]);
    await wrapper.setProps({ open: false });
    await wrapper.setProps({ open: true });
    expect((name.element as HTMLInputElement).value).toBe("");
  });

  it("Enter отправляет тот же trimmed snapshot, что и pointer", async () => {
    const wrapper = mount(AddCategoryDialog, {
      global: { stubs: dialogStubs },
      props: { disabled: false, open: true },
    });
    const name = wrapper.get('input[id^="add-category-name-"]');

    await name.setValue("  Чай  ");
    await name.trigger("keydown", { key: "Enter" });

    expect(wrapper.emitted("confirm")).toEqual([
      [{ description: "", isActive: true, name: "Чай" }],
    ]);
  });

  it("pending блокирует команды и сохраняет submitted snapshot при Escape, outside и duplicate attempts", async () => {
    const wrapper = mount(AddCategoryDialog, {
      global: { stubs: dialogStubs },
      props: { disabled: false, open: true },
    });
    const name = wrapper.get('input[id^="add-category-name-"]');
    const submit = wrapper
      .findAll("button")
      .find((button) => button.text() === "Добавить категорию")!;
    await name.setValue("Кофе");
    await submit.trigger("click");
    const submitted = [{ description: "", isActive: true, name: "Кофе" }];

    await wrapper.setProps({ disabled: true, saveOutcome: "unconfirmed" });
    const dialog = wrapper.getComponent({ name: "AdminDialog" });
    expect(dialog.props("persistent")).toBe(true);
    expect(
      wrapper
        .findAll("button, input")
        .every((control) => control.attributes("disabled") !== undefined),
    ).toBe(true);
    await submit.trigger("click");
    await wrapper.get('[role="switch"]').trigger("click");
    await wrapper
      .findAll("button")
      .find((button) => button.text() === "Отмена")!
      .trigger("click");
    await name.trigger("keydown", {
      key: "Escape",
    });
    await dialog.vm.$emit("update:modelValue", false);
    await dialog.vm.$emit("update:modelValue", false);

    expect(wrapper.emitted("cancel")).toBeUndefined();
    expect(wrapper.emitted("confirm")).toEqual([submitted]);
  });

  it.each([
    ["rejected", "Не удалось сохранить категорию"],
    ["unconfirmed", "Не удалось подтвердить сохранение категории"],
  ] as const)(
    "даёт feedback %s с понятной причиной",
    (saveOutcome, feedback) => {
      const wrapper = mount(AddCategoryDialog, {
        global: { stubs: dialogStubs },
        props: { disabled: false, open: true, saveOutcome },
      });
      expect(wrapper.get(".add-dialog-outcome").text()).toContain(feedback);
    },
  );

  it("возвращает фокус opener после явного uncertainty close", async () => {
    const opener = document.createElement("button");
    document.body.append(opener);
    opener.focus();
    const Host = defineComponent({
      components: { AddCategoryDialog },
      setup: () => ({ open: ref(false) }),
      template:
        '<AddCategoryDialog v-model:open="open" :disabled="false" save-outcome="unconfirmed" />',
    });
    const host = mount(Host, {
      attachTo: document.body,
      global: { stubs: dialogStubs },
    });
    (host.vm as { open: boolean }).open = true;
    await nextTick();
    const dialog = host.getComponent(AddCategoryDialog);
    await dialog.getComponent({ name: "AdminDialog" }).vm.$emit("after-enter");
    await dialog
      .findAll("button")
      .find((button) => button.text() === "Закрыть форму")!
      .trigger("click");
    await nextTick();
    expect(document.activeElement).toBe(opener);
    host.unmount();
    opener.remove();
  });

  it("новая сессия после Escape игнорирует late closed blur, но active blur и Enter остаются invalid", async () => {
    const wrapper = mount(AddCategoryDialog, {
      global: { stubs: dialogStubs },
      props: { disabled: false, open: true },
    });
    const name = wrapper.get('input[id^="add-category-name-"]');
    const dialog = wrapper.getComponent({ name: "AdminDialog" });

    await name.trigger("blur");
    expect(name.attributes("aria-invalid")).toBe("true");
    await dialog.vm.$emit("update:modelValue", false);
    await wrapper.setProps({ open: false });
    await name.trigger("blur");
    await wrapper.setProps({ open: true });

    expect(name.attributes("aria-invalid")).toBe("false");
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
    await name.trigger("blur");
    await name.trigger("keydown", { key: "Enter" });
    expect(name.attributes("aria-invalid")).toBe("true");
    expect(wrapper.emitted("confirm")).toBeUndefined();

    await wrapper
      .findAll("button")
      .find((button) => button.text() === "Отмена")!
      .trigger("click");
    expect(wrapper.emitted("cancel")).toHaveLength(2);
  });
});

const dialogStubs = {
  "v-card": { template: "<div><slot /></div>" },
  "v-card-actions": { template: "<div><slot /></div>" },
  "v-card-text": { template: "<div><slot /></div>" },
  "v-dialog": { template: "<div><slot /></div>" },
};
