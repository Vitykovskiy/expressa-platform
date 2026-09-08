import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { describe, expect, it } from "vitest";

import AvailabilityScreen from "./AvailabilityScreen.vue";
import type {
  AvailabilityScreenError,
  AvailabilityScreenProps,
} from "./AvailabilityScreen.types";

const groups: AvailabilityScreenProps["groups"] = [
  {
    id: "coffee",
    items: [
      {
        id: "latte",
        isAvailable: true,
        label: "Латте",
        sublabel: "Товар",
        type: "product",
      },
    ],
    name: "Кофе",
    sortOrder: 0,
  },
  {
    id: "tea",
    items: [
      {
        id: "tea",
        isAvailable: true,
        label: "Чай",
        sublabel: "Товар",
        type: "product",
      },
    ],
    name: "Чай",
    sortOrder: 1,
  },
];

const intake: NonNullable<AvailabilityScreenProps["intake"]> = {
  acceptsNewOrders: true,
  updatedAt: null,
  updatedByLabel: null,
};

const failureCases: readonly {
  action: string;
  error: AvailabilityScreenError;
  guidance: string;
  lead: string;
  position?: string;
}[] = [
  {
    action: "Загрузить снова",
    error: {
      code: "AVAILABILITY_READ_REJECTED",
      kind: "read",
      message: "Служебная ошибка чтения",
      requestId: "read-42",
    },
    guidance: "Проверьте соединение и загрузите данные ещё раз.",
    lead: "Не удалось загрузить доступность.",
  },
  {
    action: "Проверить состояние",
    error: {
      code: "AVAILABILITY_UPDATE_REJECTED",
      kind: "item",
      label: "Латте",
      message: "Служебная ошибка позиции",
      requestId: "item-42",
      sublabel: "Товар",
    },
    guidance:
      "Показано предыдущее состояние. Проверьте актуальное состояние на сервере.",
    lead: "Не удалось подтвердить изменение доступности.",
    position: "Позиция: «Латте», Товар",
  },
  {
    action: "Проверить состояние",
    error: {
      code: "INTAKE_UPDATE_REJECTED",
      kind: "intake",
      message: "Служебная ошибка приёма",
      requestId: "intake-42",
    },
    guidance:
      "Показано предыдущее состояние. Проверьте актуальное состояние на сервере.",
    lead: "Не удалось подтвердить изменение приёма заказов.",
  },
];

function mountScreen(overrides: Partial<AvailabilityScreenProps> = {}) {
  return mount(AvailabilityScreen, {
    props: {
      error: null,
      groups,
      intake,
      loading: false,
      saving: false,
      ...overrides,
    },
  });
}

function resetIsAbsent(wrapper: ReturnType<typeof mountScreen>) {
  expect(wrapper.find(".availability-screen__reset-filters").exists()).toBe(
    false,
  );
}

async function selectTab(
  wrapper: ReturnType<typeof mountScreen>,
  label: string,
) {
  await wrapper
    .findAll(".filter-tab")
    .find((tab) => tab.text() === label)!
    .trigger("click");
}

describe("AvailabilityScreen", () => {
  it.each(failureCases)(
    "показывает русскую иерархию $error.kind с единственным действием $action",
    async ({ action, error, guidance, lead, position }) => {
      const wrapper = mountScreen({ error });
      const alert = wrapper.get('[role="alert"]');
      const primaryMessages = wrapper
        .findAll(".availability-screen__error-message")
        .map((message) => message.text())
        .join(" ");

      expect(primaryMessages).toContain(lead);
      expect(primaryMessages).toContain(guidance);
      if (position !== undefined) expect(primaryMessages).toContain(position);
      expect(primaryMessages).not.toContain(error.code);
      expect(primaryMessages).not.toContain(error.message);
      expect(primaryMessages).not.toContain(error.requestId!);
      expect(alert.findAll("button")).toHaveLength(1);
      expect(alert.get("button").text()).toBe(action);
      const diagnostics = alert.get("details");
      expect(diagnostics.attributes("open")).toBeUndefined();
      expect(diagnostics.text()).toContain(`Код: ${error.code}`);
      expect(diagnostics.text()).toContain(error.message);
      expect(diagnostics.text()).toContain(
        `Идентификатор запроса: ${error.requestId}`,
      );

      await alert.get("button").trigger("click");
      expect(wrapper.emitted("retry")).toHaveLength(1);
      wrapper.unmount();
    },
  );

  it("скрывает recovery во время loading и блокирует его во время saving", () => {
    const error = failureCases[0].error;
    const loading = mountScreen({ error, loading: true });
    const saving = mountScreen({ error, saving: true });

    expect(loading.find('[role="alert"] button').exists()).toBe(false);
    expect(
      saving.get('[role="alert"] button').element.hasAttribute("disabled"),
    ).toBe(true);
    loading.unmount();
    saving.unmount();
  });

  it("отделяет настоящее пустое меню от отфильтрованного и не показывает reset", () => {
    const wrapper = mountScreen({ groups: [] });

    expect(wrapper.text()).toContain("Меню пусто");
    expect(wrapper.text()).toContain(
      "Позиции появятся после добавления в меню",
    );
    expect(wrapper.text()).not.toContain("Ничего не найдено");
    resetIsAbsent(wrapper);
    wrapper.unmount();
  });

  it("показывает reset только для search, category и combined filtered-empty и восстанавливает локальное состояние", async () => {
    const error = failureCases[1].error;
    const wrapper = mountScreen({
      error,
      groups: [groups[0], { ...groups[1], items: [] }],
    });

    resetIsAbsent(wrapper);
    await wrapper.get('input[type="search"]').setValue("  лАтТе  ");
    expect(wrapper.text()).toContain("Латте");
    resetIsAbsent(wrapper);
    await wrapper.get('input[type="search"]').setValue("нет совпадений");
    expect(wrapper.text()).toContain("Ничего не найдено");
    expect(wrapper.text()).toContain(
      "Измените поиск или выберите другую категорию",
    );
    expect(wrapper.get(".availability-screen__reset-filters").text()).toBe(
      "Сбросить фильтры",
    );
    await wrapper.get(".availability-screen__reset-filters").trigger("click");
    await nextTick();
    expect(wrapper.text()).toContain("Латте");
    resetIsAbsent(wrapper);

    await selectTab(wrapper, "Чай");
    expect(wrapper.text()).toContain("Ничего не найдено");
    expect(wrapper.text()).toContain(
      "Измените поиск или выберите другую категорию",
    );
    expect(wrapper.find(".availability-screen__reset-filters").exists()).toBe(
      true,
    );
    await wrapper.get(".availability-screen__reset-filters").trigger("click");
    await nextTick();
    expect(wrapper.text()).toContain("Чай");
    resetIsAbsent(wrapper);

    await selectTab(wrapper, "Кофе");
    await wrapper.get('input[type="search"]').setValue("чай");
    expect(wrapper.text()).toContain("Ничего не найдено");
    expect(wrapper.text()).toContain(
      "Измените поиск или выберите другую категорию",
    );
    expect(wrapper.find(".availability-screen__reset-filters").exists()).toBe(
      true,
    );
    await wrapper.get(".availability-screen__reset-filters").trigger("click");
    await nextTick();
    expect(wrapper.text()).toContain("Латте");
    expect(wrapper.get(".availability-screen__intake").text()).toContain(
      "Приём заказов",
    );
    expect(wrapper.get('[role="alert"]').text()).toContain(
      "Не удалось подтвердить изменение доступности.",
    );
    expect(wrapper.emitted("retry")).toBeUndefined();
    expect(wrapper.emitted("availability-change")).toBeUndefined();
    expect(wrapper.emitted("intake-change")).toBeUndefined();
    wrapper.unmount();
  });

  it("не показывает reset при видимом списке независимо от активной категории", async () => {
    const wrapper = mountScreen();

    resetIsAbsent(wrapper);
    await selectTab(wrapper, "Чай");
    expect(wrapper.text()).toContain("Чай");
    resetIsAbsent(wrapper);
    wrapper.unmount();
  });
});
