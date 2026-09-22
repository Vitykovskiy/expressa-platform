import { setup, type Preview } from "@storybook/vue3-vite";
import {
  defineComponent,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
} from "vue";
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
import { createOverlayCoordinator } from "../src/shared/ui/overlay/overlay-coordinator";
import { overlayCoordinatorKey } from "../src/shared/ui/overlay/overlay-coordinator.types";

const notificationRuntime = createNotificationRuntime();
const overlayCoordinator = createOverlayCoordinator();
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
  app.provide(overlayCoordinatorKey, overlayCoordinator);
});

const preview: Preview = {
  decorators: [
    (story) =>
      defineComponent({
        components: { NotificationHost, story, VApp },
        setup() {
          const entries = shallowRef(notificationRuntime.entries);
          const visibleEntries = shallowRef(notificationRuntime.visibleEntries);
          let unregisterNotificationRegion: (() => void) | undefined;
          const pageRegion = ref<HTMLElement | null>(null);
          let unregisterPageRegion: (() => void) | undefined;
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
            void nextTick(() => overlayCoordinator.restoreFocus(id));
          };
          const captureOrigin = (id: string, origin: HTMLElement | null) =>
            overlayCoordinator.captureNotificationOrigin(id, origin);
          const registerRegion = (region: HTMLElement | null) => {
            unregisterNotificationRegion?.();
            unregisterNotificationRegion =
              region === null
                ? undefined
                : overlayCoordinator.registerNotificationRegion(region);
          };
          onBeforeUnmount(() => {
            unsubscribe();
            unregisterNotificationRegion?.();
            unregisterPageRegion?.();
          });
          onMounted(() => {
            if (pageRegion.value !== null)
              unregisterPageRegion = overlayCoordinator.registerPageRegion(
                pageRegion.value,
                null,
              );
          });
          return {
            captureOrigin,
            dismiss,
            entries,
            notificationRuntime,
            pageRegion,
            registerRegion,
            visibleEntries,
          };
        },
        template: `
          <VApp>
            <div ref="pageRegion"><story /></div>
            <NotificationHost
              :candidate-entries="entries"
              :entries="visibleEntries"
              @dismiss="dismiss"
              @origin="captureOrigin"
              @recover="notificationRuntime.recover"
              @region="registerRegion"
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
