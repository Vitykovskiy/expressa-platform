import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { shallowRef } from "vue";

import { createSettingsFixture } from "../fixtures";
import type { Settings } from "../../../../src/shared/ui/admin/Admin.types";
import SettingsScreen from "../../../../src/pages/admin/settings/SettingsScreen.vue";

const meta = {
  title: "Admin/Settings/SettingsScreen",
  component: SettingsScreen,
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    settings: { control: "object" },
    onSave: { action: "save" },
  },
} satisfies Meta<typeof SettingsScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

function render(args: Story["args"]) {
  return {
    components: { SettingsScreen },
    setup() {
      const currentSettings = shallowRef<Settings>({ ...args.settings });

      function save(nextSettings: Settings) {
        currentSettings.value = { ...nextSettings };
        args?.onSave?.(nextSettings);
      }

      return { currentSettings, save };
    },
    template: '<SettingsScreen :settings="currentSettings" @save="save" />',
  };
}

export const InitialValues: Story = {
  args: {
    settings: createSettingsFixture(),
    onSave: fn<(settings: Settings) => void>(),
  },
  render,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole("heading", { name: "Настройки", level: 1 }),
    ).toBeVisible();
    await expect(canvas.getByLabelText("Открытие")).toHaveValue("09:00");
    await expect(canvas.getByLabelText("Закрытие")).toHaveValue("20:00");
    await expect(
      canvas.getByLabelText("Вместимость слота (заказов)"),
    ).toHaveValue(5);
  },
};

export const EditAndSaveWithKeyboard: Story = {
  args: {
    settings: createSettingsFixture(),
    onSave: fn<(settings: Settings) => void>(),
  },
  render,
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const capacity = canvas.getByLabelText("Вместимость слота (заказов)");

    await user.clear(capacity);
    await user.type(capacity, "8");
    await user.keyboard("{Enter}");

    await expect(args.onSave).toHaveBeenCalledWith({
      workingHoursOpen: "09:00",
      workingHoursClose: "20:00",
      slotCapacity: 8,
    });
    await waitFor(() =>
      expect(page.getByText("Настройки сохранены")).toBeVisible(),
    );
  },
};

export const LongContentNarrow: Story = {
  args: {
    settings: {
      workingHoursOpen: "00:00",
      workingHoursClose: "23:59",
      slotCapacity: 50,
    },
    onSave: fn<(settings: Settings) => void>(),
  },
  parameters: {
    viewport: { defaultViewport: "mobile1" },
  },
  render,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const screen = canvas.getByRole("main");

    await expect(
      canvas.getByText(
        "Сколько активных заказов помещается в один 10-минутный слот",
      ),
    ).toBeVisible();
    await expect(screen.scrollWidth).toBeLessThanOrEqual(screen.clientWidth);
  },
};
