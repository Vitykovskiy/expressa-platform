import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { computed, defineComponent, onBeforeUnmount, shallowRef } from "vue";

import { ApiError } from "../../../src/shared/api/client";
import { getOperationPort } from "../../../src/shared/lib/operations/operation-port";
import { createNavigationItems } from "../../../src/app/navigation";
import AuthScreen from "../../../src/pages/admin/auth/AuthScreen.vue";
import OrdersScreen from "../../../src/pages/admin/orders/OrdersScreen.vue";
import type { QueueFilter } from "../../../src/pages/admin/orders/OrdersScreen.types";
import AvailabilityScreen from "../../../src/pages/admin/availability/AvailabilityScreen.vue";
import { AVAILABILITY_ALL_CATEGORY } from "../../../src/pages/admin/availability/AvailabilityScreen.constants";
import MenuOverview from "../../../src/pages/admin/menu/MenuOverview.vue";
import TopBar from "../../../src/widgets/admin-shell/TopBar.vue";
import {
  category,
  modifierGroup,
  order,
  orderDetails,
  product,
  availabilityItems,
} from "../../fixtures/catalog";
import ProductEditContent from "../../../src/pages/admin/menu/product-edit/ProductEditContent.vue";
import PageShell from "../../../src/pages/PageShell.vue";
import AdminShell from "../../../src/widgets/admin-shell/AdminShell.vue";
import AdminDialog from "../../../src/shared/ui/admin/admin-dialog/AdminDialog.vue";
import type { AdminDialogProps } from "../../../src/shared/ui/admin/admin-dialog/AdminDialog.types";
import AdminTextField from "../../../src/shared/ui/admin/admin-text-field/AdminTextField.vue";
import AddCategoryDialog from "../../../src/pages/admin/menu/AddCategoryDialog.vue";
import EditCategoryDialog from "../../../src/pages/admin/menu/EditCategoryDialog.vue";
import AddProductDialog from "../../../src/pages/admin/menu/AddProductDialog.vue";
import PriceChoiceDialog from "../../../src/pages/admin/menu/PriceChoiceDialog.vue";
import ConfirmDialog from "../../../src/shared/ui/admin/confirm-dialog/ConfirmDialog.vue";
import NotificationHost from "../../../src/shared/ui/notifications/NotificationHost.vue";
import type {
  NotificationHostEntry,
  NotificationHostVisibility,
} from "../../../src/shared/ui/notifications/NotificationHost.types";

const meta = {
  title: "Компоненты/Обратная связь/Уведомления",
  id: "feedback-notifications",
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function renderNotification(requestId: string | null) {
  return defineComponent({
    setup() {
      const runtime = getOperationPort();
      const epoch =
        requestId === null
          ? "storybook-error-notice-without-request-id"
          : "storybook-notifications-default";
      void runtime.run(
        {
          attemptId: epoch,
          epoch,
          kind: "read",
          operationKey: "catalog.load",
          origin: "user",
          ownerIsActive: () => true,
          resourceKey: "catalog",
        },
        async () => {
          throw new ApiError({
            code: "NETWORK_ERROR",
            details: null,
            message: "story failure",
            occurrenceId: epoch,
            requestId,
            status: null,
            transportKind: "network",
          });
        },
      );
      onBeforeUnmount(() => runtime.clearSession(epoch));
      return () => null;
    },
  });
}

export const Default: Story = {
  name: "Обычное состояние",
  render: () => renderNotification("req-story"),
};
export const WithoutRequestId: Story = {
  name: "Без номера запроса",
  render: () => renderNotification(null),
};

const errorEntry: NotificationHostEntry = {
  id: "public-error",
  level: "error",
  message: "Не удалось загрузить меню",
  actionLabel: "Повторить",
  busy: false,
  accounting: "3 операции",
};
const longEntry: NotificationHostEntry = {
  ...errorEntry,
  id: "public-long",
  message:
    "НеУдалосьОбновитьСписокТоваровИДобавокПриИзмененииДоступностиВТекущемКаталогеНеУдалосьОбновитьСписокТоваровИДобавокПриИзмененииДоступностиВТекущемКаталоге",
  actionLabel:
    "ПовторитьОбновлениеТоваровИДобавокВТекущемКаталогеПослеВосстановленияПодключения",
};

function renderPublic(
  initialEntries: readonly NotificationHostEntry[],
  composition:
    | "isolated"
    | "auth"
    | "shell"
    | "modal"
    | "queue"
    | "availability"
    | "menu" = "isolated",
  dialogProps: Partial<AdminDialogProps> = {},
  longBody = false,
  consumer:
    | "canonical"
    | "category-create"
    | "category-edit"
    | "product-create"
    | "price"
    | "confirm" = "canonical",
) {
  return {
    components: {
      AdminDialog,
      AdminTextField,
      AddCategoryDialog,
      EditCategoryDialog,
      AddProductDialog,
      PriceChoiceDialog,
      ConfirmDialog,
      AdminShell,
      AuthScreen,
      NotificationHost,
      PageShell,
      ProductEditContent,
      OrdersScreen,
      AvailabilityScreen,
      MenuOverview,
      TopBar,
    },
    setup() {
      const entries = shallowRef(initialEntries.map((entry) => ({ ...entry })));
      const visibility = shallowRef<NotificationHostVisibility>({
        availableHeight: Number.POSITIVE_INFINITY,
        hidden: false,
        hoveredId: null,
        stackFits: true,
        viewportWidth: 768,
      });
      const visibleEntries = computed(() =>
        entries.value.slice(
          0,
          visibility.value.viewportWidth >= 768 && visibility.value.stackFits
            ? 3
            : 1,
        ),
      );
      function dismiss(id: string) {
        entries.value = entries.value.filter((entry) => entry.id !== id);
      }
      function recover(id: string) {
        entries.value = entries.value.map((entry) =>
          entry.id === id
            ? { ...entry, busy: true, actionLabel: "Повторяем…" }
            : entry,
        );
      }
      const search = shallowRef("");
      const stage = shallowRef<QueueFilter>("ALL");
      const orders = Array.from({ length: 16 }, (_, index) => ({
        ...order,
        id: `notice-order-${index}`,
        number: String(42 + index),
      }));
      const selectedOrderId = shallowRef<string | null>(null);
      const details = shallowRef<typeof orderDetails | null>(null);
      const groups = shallowRef([
        {
          id: category.id,
          name: category.name,
          sortOrder: 0,
          items: Array.from({ length: 16 }, (_, index) => ({
            ...availabilityItems[0]!,
            id: `notice-product-${index}`,
            label: index === 0 ? "Капучино" : `Капучино ${index + 1}`,
          })),
        },
      ]);
      const intake = shallowRef({
        acceptsNewOrders: true,
        updatedAt: null,
        updatedByLabel: null,
      });
      const expandedCategoryIds = shallowRef(new Set([category.id]));
      function open(orderId: string) {
        selectedOrderId.value =
          selectedOrderId.value === orderId ? null : orderId;
        const selected = orders.find(
          (entry) => entry.id === selectedOrderId.value,
        );
        details.value = selected ? { ...orderDetails, ...selected } : null;
      }
      return {
        composition,
        dialogProps,
        longBody,
        consumer,
        category,
        priceChoice: {
          portionLabel: "300 мл",
          price: "290",
          isAvailable: true,
        },
        activeSection: computed(() =>
          composition === "queue"
            ? "orders"
            : composition === "availability"
              ? "availability"
              : "menu",
        ),
        search,
        stage,
        orders: computed(() =>
          orders.filter(
            (entry) =>
              (stage.value === "ALL" || entry.stage === stage.value) &&
              entry.number.includes(search.value.trim()),
          ),
        ),
        selectedOrderId,
        details,
        open,
        groups,
        intake,
        activeCategory: shallowRef(AVAILABILITY_ALL_CATEGORY),
        categories: [category],
        products: Array.from({ length: 16 }, (_, index) => ({
          ...product,
          id: `notice-menu-${index}`,
          name: index === 0 ? "Капучино" : `Капучино ${index + 1}`,
          sortOrder: index,
        })),
        modifierGroups: [modifierGroup],
        expandedCategoryIds,
        entries,
        visibleEntries,
        visibility,
        dismiss,
        recover,
        items: createNavigationItems("administrator"),
        dialogOpen: shallowRef(composition === "modal"),
        name: shallowRef("Капучино"),
        categoryId: shallowRef("coffee"),
        description: shallowRef("Эспрессо и молоко"),
        isActive: shallowRef(true),
        choices: shallowRef(
          Array.from({ length: 8 }, (_, index) => ({
            clientId: `public-choice-${index}`,
            portionLabel: `${200 + index * 50} мл`,
            price: String(180 + index * 20),
            isAvailable: true,
          })),
        ),
      };
    },
    template: `
      <div style="display: grid; grid-template-rows: minmax(0, 1fr); height: 100%; min-height: 0; overflow: hidden">
        <NotificationHost :candidate-entries="entries" :entries="visibleEntries"
          @dismiss="dismiss" @recover="recover" @visibility="visibility = $event" />
        <div style="min-height: 0; overflow-y: auto">
          <AuthScreen v-if="composition === 'auth'" state="otp" phone="+7 900 000-00-00"
            otp="" :otp-valid="false" :phone-valid="true" error=""
            :otp-metadata="{ expiresInSeconds: 300, retryAfterSeconds: 60 }"
            :resend-remaining-seconds="60" />
          <AdminShell v-else-if="composition !== 'isolated'" role="administrator" :active-section="activeSection" :items="items">
            <OrdersScreen v-if="composition === 'queue'" :orders="orders" :search="search" :stage="stage"
              status="ready" :selected-order-id="selectedOrderId" :details="details" :details-loading="false"
              :transition-loading="false" :requires-transition-recovery="false"
              @update:search="search = $event" @update:stage="stage = $event" @open="open" />
            <AvailabilityScreen v-else-if="composition === 'availability'" :groups="groups" :intake="intake"
              :loading="false" :saving="false" :search="search" :active-category="activeCategory"
              @update:search="search = $event" @update:active-category="activeCategory = $event"
              @intake-change="intake = { ...intake, acceptsNewOrders: $event }"
              @availability-change="(item, value) => groups = groups.map(group => ({ ...group, items: group.items.map(current => current.id === item.id ? { ...current, isAvailable: value } : current) }))" />
            <PageShell v-else-if="composition === 'menu'" content-spacing="none"><TopBar title="Меню" /><MenuOverview
              :categories="categories" :products="products" :modifier-groups="modifierGroups" :expanded-category-ids="expandedCategoryIds"
              @toggle-category="({ id }) => { const next = new Set(expandedCategoryIds); next.has(id) ? next.delete(id) : next.add(id); expandedCategoryIds = next }" /></PageShell>
            <PageShell v-else content-spacing="none"><ProductEditContent
              v-model:name="name" v-model:category-id="categoryId" v-model:description="description"
              v-model:choices="choices" v-model:is-active="isActive"
              :category-options="[{ id: 'coffee', label: 'Кофе' }]" :choice-errors="{}"
              description-error="" name-error="" :dirty="true" :pending="false" :valid="true"
              @archive="dialogOpen = true" />
            </PageShell>
          </AdminShell>
        </div>
        <AddCategoryDialog v-if="consumer === 'category-create'" v-model:open="dialogOpen"
          :categories="categories" :disabled="dialogProps.pending ?? false" />
        <EditCategoryDialog v-else-if="consumer === 'category-edit'" v-model:open="dialogOpen"
          :category="category" :categories="categories" :disabled="dialogProps.pending ?? false" />
        <AddProductDialog v-else-if="consumer === 'product-create'" v-model:open="dialogOpen"
          :categories="categories" :disabled="dialogProps.pending ?? false" />
        <PriceChoiceDialog v-else-if="consumer === 'price'" v-model:open="dialogOpen"
          :choice="priceChoice" :disabled="dialogProps.pending ?? false" :editing="true"
          :required-label="true" :used-labels="[]" />
        <ConfirmDialog v-else-if="consumer === 'confirm'" v-model:open="dialogOpen"
          title="Удалить цену?" description="Эта цена будет удалена из товара."
          confirm-label="Удалить цену" cancel-label="Продолжить редактирование"
          confirm-variant="destructive" :pending="dialogProps.pending ?? false" />
        <AdminDialog v-else v-model="dialogOpen" title="Редактировать товар" cancel-label="Отмена"
          max-width="var(--expressa-size-settings-content-max-width)" v-bind="dialogProps">
          <form v-if="longBody" id="notification-dialog-story-form" @submit.prevent="dialogOpen = false">
            <p v-for="index in 24" :key="index">Позиция {{ index }}</p>
            <label for="notification-dialog-last-field">Последнее поле</label>
            <AdminTextField id="notification-dialog-last-field" required />
          </form>
          <p v-else style="margin: 0">Капучино · 200 мл · 180 ₽</p>
        </AdminDialog>
      </div>`,
  };
}

export const Hidden: Story = {
  name: "Нет уведомлений",
  render: () => renderPublic([], "shell"),
};
export const Error: Story = {
  name: "Ошибка с повтором",
  render: () => renderPublic([errorEntry]),
};
export const Warning: Story = {
  name: "Предупреждение",
  render: () =>
    renderPublic([
      {
        ...errorEntry,
        id: "public-warning",
        level: "warning",
        message: "Не удалось подтвердить сохранение",
      },
    ]),
};
export const Success: Story = {
  name: "Успех — представление",
  render: () =>
    renderPublic([
      {
        id: "public-success",
        level: "success",
        message: "Изменения сохранены",
        busy: false,
      },
    ]),
};
export const Info: Story = {
  name: "Информация",
  render: () =>
    renderPublic([
      { id: "public-info", level: "info", message: "Новый заказ", busy: false },
    ]),
};
export const Long: Story = {
  name: "Длинные сообщение и действие",
  render: () => renderPublic([longEntry]),
};
export const Multiple: Story = {
  name: "Несколько уведомлений",
  render: () =>
    renderPublic([
      errorEntry,
      {
        id: "public-warning",
        level: "warning",
        message: "Сессия завершена",
        busy: false,
      },
      { id: "public-info", level: "info", message: "Новый заказ", busy: false },
    ]),
};
export const Busy: Story = {
  name: "Повтор выполняется",
  render: () =>
    renderPublic([{ ...errorEntry, busy: true, actionLabel: "Повторяем…" }]),
};
export const AuthComposition: Story = {
  name: "Вход с уведомлением",
  render: () => renderPublic([errorEntry], "auth"),
};
export const ShellComposition: Story = {
  name: "Редактор с уведомлением",
  args: { composition: "shell", longNotice: true },
  argTypes: {
    composition: {
      control: "select",
      options: [
        "shell",
        "auth",
        "queue",
        "availability",
        "menu",
        "modal",
        "isolated",
      ],
    },
    longNotice: { control: "boolean" },
  },
  render: (args) =>
    renderPublic([args.longNotice ? longEntry : errorEntry], args.composition),
};
export const ModalComposition: Story = {
  name: "Диалог с уведомлением",
  args: {
    longNotice: false,
    longBody: false,
    longTitle: false,
    longActions: false,
    threeActions: false,
    fullScreenBelow600: false,
    title: "Редактировать товар",
    cancelLabel: "Отмена",
    submitLabel: "",
    destructiveLabel: "",
    pending: false,
    persistent: false,
    consumer: "canonical",
  },
  argTypes: {
    consumer: {
      control: "select",
      options: [
        "canonical",
        "category-create",
        "category-edit",
        "product-create",
        "price",
        "confirm",
      ],
    },
  },
  render: (args) =>
    renderPublic(
      [args.longNotice ? longEntry : errorEntry],
      "modal",
      {
        title: args.longTitle
          ? "ОченьДлинноеНазваниеКатегорииБезПробеловДляПроверкиГраницДиалога"
          : args.title,
        cancelLabel: args.longActions
          ? "Продолжить редактирование"
          : args.cancelLabel,
        submitLabel: args.longActions ? "Удалить цену" : args.submitLabel,
        submitForm: "notification-dialog-story-form",
        destructiveLabel: args.threeActions
          ? "Архивировать"
          : args.destructiveLabel,
        fullScreenBelow600: args.fullScreenBelow600,
        pending: args.pending,
        persistent: args.persistent,
      },
      args.longBody,
      args.consumer,
    ),
};
