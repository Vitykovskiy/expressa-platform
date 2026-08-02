import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, within } from "storybook/test";

import StoryCanvas from "./StoryCanvas.vue";

const meta = {
  title: "Foundations/Back office",
  parameters: {
    layout: "fullscreen",
    viewport: {
      viewports: {
        tablet: {
          name: "Планшет 768",
          styles: { height: "900px", width: "768px" },
          type: "tablet",
        },
        workspace: {
          name: "Рабочий экран 1280",
          styles: { height: "900px", width: "1280px" },
          type: "desktop",
        },
        wide: {
          name: "Широкий экран 1440",
          styles: { height: "900px", width: "1440px" },
          type: "desktop",
        },
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Tokens: Story = {
  render: () => ({
    components: { StoryCanvas },
    template: `<StoryCanvas><section class="foundation-page" aria-labelledby="tokens-title"><h1 id="tokens-title">Токены back-office</h1><p class="foundation-note">Единая тема Vuetify: рабочий акцент, поверхности и понятные статусные роли.</p><h2>Цветовые роли</h2><div class="token-grid" role="list"><div class="token-card" role="listitem"><div class="token-swatch" style="background: rgb(var(--v-theme-primary))"></div><strong>Основное действие</strong><code>primary</code></div><div class="token-card" role="listitem"><div class="token-swatch" style="background: rgb(var(--v-theme-surface))"></div><strong>Рабочая поверхность</strong><code>surface</code></div><div class="token-card" role="listitem"><div class="token-swatch" style="background: rgb(var(--v-theme-background))"></div><strong>Фон рабочей области</strong><code>background</code></div><div class="token-card" role="listitem"><div class="token-swatch" style="background: rgb(var(--v-theme-error))"></div><strong>Ошибка: текст и знак</strong><code>error</code></div></div></section></StoryCanvas>`,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("heading", { name: "Токены back-office" }),
    ).toBeVisible();
    await expect(canvas.getAllByRole("listitem")).toHaveLength(4);
  },
};

export const Typography: Story = {
  render: () => ({
    components: { StoryCanvas },
    template: `<StoryCanvas><section class="foundation-page" aria-labelledby="typography-title"><h1 id="typography-title">Типографика</h1><div class="type-sample"><strong>Заголовок рабочего экрана</strong><span class="type-sample-title">Очередь заказов</span><span class="type-sample-subtitle">Заказ #1048</span><span class="type-sample-body">Капучино, большой стакан, овсяное молоко</span><span class="type-sample-caption">Обновлено 2 минуты назад</span></div></section></StoryCanvas>`,
  }),
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText("Очередь заказов"),
    ).toBeVisible();
  },
};

export const Grid: Story = {
  parameters: { viewport: { defaultViewport: "workspace" } },
  render: () => ({
    components: { StoryCanvas },
    template: `<StoryCanvas><section class="foundation-page" aria-labelledby="grid-title"><h1 id="grid-title">Рабочая сетка</h1><p class="foundation-note">Боковая навигация и двенадцать колонок сохраняют рабочую структуру на 768, 1280 и 1440 px.</p><h2>Навигация + контент</h2><div class="workspace-grid"><div class="workspace-navigation" aria-label="Навигация">Разделы</div><div class="workspace-content" aria-label="Сетка контента" data-testid="workspace-content"><span style="grid-column: span 8">Основная очередь</span><span style="grid-column: span 4">Детали</span><span style="grid-column: span 4">Заказ</span><span style="grid-column: span 4">Состав</span><span style="grid-column: span 4">Действия</span></div></div></section></StoryCanvas>`,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Разделы")).toBeVisible();
    await expect(canvas.getByText("Основная очередь")).toBeVisible();
    const workspaceContent = canvas.getByTestId("workspace-content");
    await expect(getComputedStyle(workspaceContent).display).toBe("grid");
    await expect(
      getComputedStyle(workspaceContent).gridTemplateColumns.split(" "),
    ).toHaveLength(12);
  },
};

export const Density: Story = {
  render: () => ({
    components: { StoryCanvas },
    template: `<StoryCanvas><section class="foundation-page" aria-labelledby="density-title"><h1 id="density-title">Плотность интерфейса</h1><p class="foundation-note">Текст и размер строки сохраняют различимость статуса при плотной очереди.</p><h2>Варианты строки</h2><div class="density-list"><div class="density-row density-compact"><strong>Компактная очередь</strong><span>Готовится</span><small>40 px</small></div><div class="density-row density-default"><strong>Обычная строка</strong><span>Принят</span><small>52 px</small></div><div class="density-row density-comfortable"><strong>Комфортная строка</strong><span>Оформлен</span><small>64 px</small></div></div></section></StoryCanvas>`,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Компактная очередь")).toBeVisible();
    await expect(canvas.getByText("40 px")).toBeVisible();
  },
};

export const Icons: Story = {
  render: () => ({
    components: { StoryCanvas },
    template: `<StoryCanvas><section class="foundation-page" aria-labelledby="icons-title"><h1 id="icons-title">Иконки</h1><p class="foundation-note">Каждая иконка получает текстовую подпись; смысл не зависит от формы или цвета.</p><div class="icon-grid" role="list"><div class="icon-card" role="listitem"><span class="icon-symbol" aria-hidden="true">+</span><strong>Добавить</strong></div><div class="icon-card" role="listitem"><span class="icon-symbol" aria-hidden="true">⌕</span><strong>Поиск</strong></div><div class="icon-card" role="listitem"><span class="icon-symbol" aria-hidden="true">✓</span><strong>Подтверждено</strong></div><div class="icon-card" role="listitem"><span class="icon-symbol" aria-hidden="true">!</span><strong>Требует внимания</strong></div></div></section></StoryCanvas>`,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByText(
        "Каждая иконка получает текстовую подпись; смысл не зависит от формы или цвета.",
      ),
    ).toBeVisible();
    await expect(canvas.getAllByRole("listitem")).toHaveLength(4);
  },
};
