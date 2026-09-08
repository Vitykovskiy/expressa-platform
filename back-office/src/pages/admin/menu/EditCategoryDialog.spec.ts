import { mount } from "@vue/test-utils";
import { defineComponent, nextTick, ref } from "vue";
import { describe, expect, it } from "vitest";

import EditCategoryDialog from "./EditCategoryDialog.vue";

describe("EditCategoryDialog", () => {
  it("pending блокирует input, toggle, close, cancel, archive и сохраняет черновик после Escape/outside/duplicate model paths", async () => {
    const wrapper = mount(EditCategoryDialog, {
      props: {
        category,
        disabled: false,
        open: true,
      },
      global: { stubs: dialogStubs },
    });
    const name = wrapper.get('input[id^="edit-category-name-"]');
    await name.setValue("Черновик");
    await wrapper.setProps({ disabled: true, saveOutcome: "unconfirmed" });
    const dialog = wrapper.getComponent({ name: "AdminDialog" });

    expect(dialog.props("persistent")).toBe(true);
    expect(
      wrapper
        .findAll("button, input")
        .every((control) => control.attributes("disabled") !== undefined),
    ).toBe(true);
    await wrapper.get('[aria-label="Закрыть диалог"]').trigger("click");
    await wrapper.get('[aria-label="Закрыть диалог"]').trigger("click");
    await wrapper.get(".edit-dialog-delete-zone").trigger("click");
    await wrapper
      .findAll("button")
      .find((button) => button.text() === "Отмена")!
      .trigger("click");
    await wrapper.get('[role="switch"]').trigger("click");
    await name.trigger("input");
    await name.trigger("keydown", { key: "Escape" });
    await dialog.vm.$emit("update:modelValue", false);
    await dialog.vm.$emit("update:modelValue", false);

    expect(wrapper.emitted("cancel")).toBeUndefined();
    expect(wrapper.emitted("archive")).toBeUndefined();
    expect((name.element as HTMLInputElement).value).toBe("Черновик");
  });

  it("не испускает cancel при model-close защищённой формы", async () => {
    const wrapper = mount(EditCategoryDialog, {
      props: {
        category: {
          description: "",
          id: "coffee",
          isActive: true,
          name: "Кофе",
          sortOrder: 0,
        },
        disabled: true,
        open: true,
      },
      global: { stubs: dialogStubs },
    });

    await wrapper
      .getComponent({ name: "AdminDialog" })
      .vm.$emit("update:modelValue", false);

    expect(wrapper.emitted("cancel")).toBeUndefined();
  });

  it.each(["unconfirmed", "saved"] as const)(
    "закрывает %s recovery только явной командой",
    async (saveOutcome) => {
      const wrapper = mount(EditCategoryDialog, {
        props: {
          category: {
            description: "",
            id: "coffee",
            isActive: true,
            name: "Кофе",
            sortOrder: 0,
          },
          disabled: false,
          open: true,
          saveOutcome,
        },
        global: { stubs: dialogStubs },
      });
      const close = wrapper
        .findAll("button")
        .find((button) => button.text() === "Закрыть форму");

      expect(close).toBeDefined();
      await close!.trigger("click");
      expect(wrapper.emitted("cancel")).toHaveLength(1);
    },
  );

  it("сохраняет черновик при refetch того же id и archive не испускается при close", async () => {
    const wrapper = mount(EditCategoryDialog, {
      props: {
        category: {
          description: "",
          id: "coffee",
          isActive: true,
          name: "Кофе",
          sortOrder: 0,
        },
        disabled: false,
        open: true,
      },
      global: { stubs: dialogStubs },
    });
    const name = wrapper.get('input[id^="edit-category-name-"]');
    await name.setValue("Черновик");
    await wrapper.setProps({
      category: {
        description: "",
        id: "coffee",
        isActive: true,
        name: "Кофе",
        sortOrder: 0,
      },
    });

    expect((name.element as HTMLInputElement).value).toBe("Черновик");
    await wrapper.get('[aria-label="Закрыть диалог"]').trigger("click");
    expect(wrapper.emitted("archive")).toBeUndefined();
  });

  it("связывает server errors полей с aria и показывает long diagnostic с wrapping", async () => {
    const diagnostic =
      "Диагностическая запись с очень длинным непрерывным идентификатором request_failure_012345678901234567890123456789";
    const wrapper = mount(EditCategoryDialog, {
      props: {
        category: {
          description: "",
          id: "coffee",
          isActive: true,
          name: "Кофе",
          sortOrder: 0,
        },
        disabled: false,
        fieldErrors: {
          description: "Описание",
          isActive: "Статус",
          name: "Имя",
        },
        open: true,
        saveError: { message: diagnostic, requestId: "r-1" },
        saveOutcome: "rejected",
      },
      global: { stubs: dialogStubs },
    });

    const name = wrapper.get('input[id^="edit-category-name-"]');
    const description = wrapper.get('input[id^="edit-category-description-"]');
    const active = wrapper.get('[role="switch"]');

    for (const field of [name, description, active]) {
      expect(field.attributes("aria-invalid")).toBe("true");
      const errorId = field.attributes("aria-describedby");
      expect(errorId).toBeTruthy();
      expect(wrapper.get(`#${errorId}`).attributes("role")).toBe("alert");
    }
    expect(wrapper.findAll('[role="alert"]')).toHaveLength(4);
    expect(wrapper.get("details").text()).toContain(diagnostic);
    expect(wrapper.get("details").classes()).toContain(
      "edit-dialog-technical-details",
    );
    await name.setValue("Чай");
    await description.setValue("Листья");
    await active.trigger("click");
    expect(wrapper.findAll('[role="alert"]')).toHaveLength(1);
  });

  it("reset-ит при reopen, блокирует whitespace-only и сохраняет Enter correction", async () => {
    const wrapper = mount(EditCategoryDialog, {
      props: { category, disabled: false, open: false },
      global: { stubs: dialogStubs },
    });
    await wrapper.setProps({ open: true });
    const name = wrapper.get('input[id^="edit-category-name-"]');
    await name.setValue("   ");
    await name.trigger("blur");
    expect(wrapper.text()).toContain("Введите название категории");
    await wrapper
      .findAll("button")
      .find((button) => button.text() === "Сохранить изменения")!
      .trigger("click");
    expect(wrapper.emitted("save")).toBeUndefined();
    await name.setValue("  Чай  ");
    await name.trigger("keydown", { key: "Enter" });
    expect(wrapper.emitted("save")).toEqual([
      [{ description: "Напитки", isActive: true, name: "Чай" }],
    ]);
    await wrapper.setProps({ open: false });
    await wrapper.setProps({ open: true });
    expect((name.element as HTMLInputElement).value).toBe("Кофе");
  });

  it("pointer сохраняет тот же trimmed snapshot, что и Enter", async () => {
    const wrapper = mount(EditCategoryDialog, {
      props: { category, disabled: false, open: false },
      global: { stubs: dialogStubs },
    });
    await wrapper.setProps({ open: true });
    const name = wrapper.get('input[id^="edit-category-name-"]');
    await name.setValue("  Чай  ");
    await wrapper
      .findAll("button")
      .find((button) => button.text() === "Сохранить изменения")!
      .trigger("click");

    expect(wrapper.emitted("save")).toEqual([
      [{ description: "Напитки", isActive: true, name: "Чай" }],
    ]);
  });

  it.each([
    ["rejected", "Не удалось сохранить категорию"],
    ["unconfirmed", "Не удалось подтвердить сохранение категории"],
  ] as const)(
    "даёт feedback %s с понятной причиной",
    (saveOutcome, feedback) => {
      const wrapper = mount(EditCategoryDialog, {
        props: { category, disabled: false, open: true, saveOutcome },
        global: { stubs: dialogStubs },
      });
      expect(wrapper.get(".edit-dialog-outcome").text()).toContain(feedback);
    },
  );

  it("единственный recovery unconfirmed результата делает один refresh", async () => {
    const wrapper = mount(EditCategoryDialog, {
      props: {
        category,
        disabled: false,
        open: true,
        saveOutcome: "unconfirmed",
      },
      global: { stubs: dialogStubs },
    });
    const recovery = wrapper
      .findAll("button")
      .filter((button) => button.text() === "Обновить меню");

    expect(recovery).toHaveLength(1);
    await recovery[0]!.trigger("click");
    expect(wrapper.emitted("refresh")).toHaveLength(1);
  });

  it("возвращает фокус после explicit close и не архивирует protected close", async () => {
    const opener = document.createElement("button");
    document.body.append(opener);
    opener.focus();
    const Host = defineComponent({
      components: { EditCategoryDialog },
      setup: () => ({ category, open: ref(false) }),
      template:
        '<EditCategoryDialog v-model:open="open" :category="category" :disabled="false" save-outcome="unconfirmed" />',
    });
    const host = mount(Host, {
      attachTo: document.body,
      global: { stubs: dialogStubs },
    });
    (host.vm as { open: boolean }).open = true;
    await nextTick();
    const dialog = host.getComponent(EditCategoryDialog);
    await dialog.getComponent({ name: "AdminDialog" }).vm.$emit("after-enter");
    await dialog
      .findAll("button")
      .find((button) => button.text() === "Закрыть форму")!
      .trigger("click");
    await nextTick();
    expect(document.activeElement).toBe(opener);
    expect(dialog.emitted("archive")).toBeUndefined();
    host.unmount();
    opener.remove();
  });

  it("новая сессия после Escape игнорирует late closed blur, но active blur и Enter остаются invalid", async () => {
    const wrapper = mount(EditCategoryDialog, {
      props: { category, disabled: false, open: false },
      global: { stubs: dialogStubs },
    });
    await wrapper.setProps({ open: true });
    const name = wrapper.get('input[id^="edit-category-name-"]');
    const dialog = wrapper.getComponent({ name: "AdminDialog" });
    await name.setValue("");
    await name.trigger("blur");
    expect(name.attributes("aria-invalid")).toBe("true");
    await dialog.vm.$emit("update:modelValue", false);
    await wrapper.setProps({ open: false });
    await name.trigger("blur");
    await wrapper.setProps({ open: true });

    expect(name.attributes("aria-invalid")).toBe("false");
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
    await name.setValue("");
    await name.trigger("blur");
    await name.trigger("keydown", { key: "Enter" });
    expect(name.attributes("aria-invalid")).toBe("true");
    expect(wrapper.emitted("save")).toBeUndefined();

    await wrapper
      .findAll("button")
      .find((button) => button.text() === "Отмена")!
      .trigger("click");
    expect(wrapper.emitted("cancel")).toHaveLength(2);
  });

  it("оставляет title text shrinkable и close target отдельным локальным контролом", () => {
    const wrapper = mount(EditCategoryDialog, {
      props: { category, disabled: false, open: true },
      global: { stubs: dialogStubs },
    });

    expect(wrapper.get(".edit-dialog-title-text").text()).toBe(
      "Редактировать категорию",
    );
    expect(wrapper.get(".edit-dialog-close").attributes("aria-label")).toBe(
      "Закрыть диалог",
    );
  });
});

const category = {
  description: "Напитки",
  id: "coffee",
  isActive: true,
  name: "Кофе",
  sortOrder: 0,
};

const dialogStubs = {
  ConfirmDialog: { template: "<div />" },
  "v-card": { template: "<div><slot /></div>" },
  "v-card-actions": { template: "<div><slot /></div>" },
  "v-card-text": { template: "<div><slot /></div>" },
  "v-card-title": { template: "<div><slot /></div>" },
  "v-dialog": { template: "<div><slot /></div>" },
};
