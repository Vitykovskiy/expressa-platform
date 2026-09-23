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
            <div><story /></div>
            <NotificationHost
              :candidate-entries="entries"
              :entries="visibleEntries"
              @dismiss="dismiss"
              @recover="notificationRuntime.recover"
              @visibility="notificationRuntime.setVisibility"
            />
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
          name: "Mobile",
          styles: { width: "375px", height: "812px" },
          type: "mobile",
        },
        tablet: {
          name: "Tablet",
          styles: { width: "768px", height: "1024px" },
          type: "tablet",
        },
        desktop: {
          name: "Desktop",
          styles: { width: "1440px", height: "960px" },
          type: "desktop",
        },
      },
    },
    options: {
      storySort: {
        order: [
          "Foundations",
          "Navigation",
          "Feedback",
          "Forms",
          "Dialogs",
          "Data display",
          "Layout",
          "Features",
          "Internals",
        ],
      },
    },
  },
};

export default preview;
