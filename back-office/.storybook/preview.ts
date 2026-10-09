import { setup, type Preview } from "@storybook/vue3-vite";
import { defineComponent, onBeforeUnmount, shallowRef } from "vue";
import "vuetify/styles";

import "../src/styles/main.css";
import { createVuetify } from "vuetify";
import { VApp } from "vuetify/components";
import { createMemoryHistory, createRouter } from "vue-router";
import { expressaAdminThemeColors } from "../src/styles/theme";
import { createNotificationRuntime } from "../src/app/notifications/notification-runtime";
import {
  notificationRuntimeKey,
  sameNotificationEntries,
} from "../src/app/notifications/notification-runtime.types";
import NotificationHost from "../src/shared/ui/notifications/NotificationHost.vue";
import { setOperationPort } from "../src/shared/lib/operations/operation-port";

const notificationRuntime = createNotificationRuntime();
setOperationPort(notificationRuntime);

const storyRouter = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: "/", component: { template: "<div />" } }],
});

void storyRouter.push("/");

setup((app) => {
  if (!Object.hasOwn(app.config.globalProperties, "$router"))
    app.use(storyRouter);
  app.use(
    createVuetify({
      theme: {
        defaultTheme: "expressaAdmin",
        themes: {
          expressaAdmin: {
            dark: false,
            colors: expressaAdminThemeColors,
          },
        },
      },
    }),
  );
  app.provide(notificationRuntimeKey, notificationRuntime);
});

const preview: Preview = {
  decorators: [
    (story) =>
      defineComponent({
        components: { NotificationHost, story, VApp },
        setup() {
          const entries = shallowRef(notificationRuntime.entries);
          const visibleEntries = shallowRef(notificationRuntime.visibleEntries);
          const unsubscribe = notificationRuntime.subscribe(() => {
            const nextEntries = notificationRuntime.entries;
            const nextVisibleEntries = notificationRuntime.visibleEntries;
            if (!sameNotificationEntries(entries.value, nextEntries))
              entries.value = nextEntries;
            if (
              !sameNotificationEntries(visibleEntries.value, nextVisibleEntries)
            )
              visibleEntries.value = nextVisibleEntries;
          });
          const dismiss = (id: string) => {
            notificationRuntime.dismiss(id);
          };
          onBeforeUnmount(() => {
            unsubscribe();
          });
          return {
            dismiss,
            entries,
            notificationRuntime,
            visibleEntries,
          };
        },
        template: `
          <VApp>
            <div style="display: grid; grid-template-rows: minmax(0, 1fr); height: 100dvh; min-height: 0; overflow: hidden">
              <NotificationHost
                :candidate-entries="entries"
                :entries="visibleEntries"
                @dismiss="dismiss"
                @recover="notificationRuntime.recover"
                @visibility="notificationRuntime.setVisibility"
              />
              <div style="min-height: 0; overflow-y: auto; overscroll-behavior-y: contain"><story /></div>
            </div>
          </VApp>
        `,
      }),
  ],
  parameters: {
    layout: "fullscreen",
    controls: { expanded: true },
    viewport: {
      options: {
        mobile: {
          name: "Телефон",
          styles: { width: "375px", height: "812px" },
          type: "mobile",
        },
        tablet: {
          name: "Планшет",
          styles: { width: "768px", height: "1024px" },
          type: "tablet",
        },
        desktop: {
          name: "Компьютер",
          styles: { width: "1440px", height: "960px" },
          type: "desktop",
        },
      },
    },
    options: {
      storySort: {
        order: [
          "Базовые элементы",
          [
            "Токены оформления",
            "Иконка",
            "Индикатор загрузки",
            "Кнопка",
            "Текстовое поле",
            "Многострочное поле",
            "Переключатель",
            "Список выбора",
            "Выбор с поиском",
          ],
          "Компоненты",
          ["Формы", "Диалоги", "Навигация", "Обратная связь"],
          "Бизнес компоненты",
          ["Вход", "Заказы", "Доступность", "Меню"],
          "Экраны",
          [
            "Вход",
            "Очередь заказов",
            "Доступность",
            "Меню",
            "Редактирование товара",
          ],
        ],
      },
    },
  },
};

export default preview;
