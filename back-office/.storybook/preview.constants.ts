import type { Preview } from "@storybook/vue3-vite";
import { withFoundation } from "./decorators";

export const previewConfiguration: Preview = {
  decorators: [withFoundation],
  globalTypes: {
    theme: {
      description: "Тема компонентов",
      toolbar: {
        icon: "circlehollow",
        dynamicTitle: true,
        items: [
          { value: "light", title: "Светлая" },
          { value: "dark", title: "Тёмная" },
          { value: "system", title: "Системная" },
        ],
      },
    },
  },
  parameters: {
    layout: "fullscreen",
    options: { storySort: { order: ["Основа", "Компоненты"] } },
  },
};
