<template>
  <CustomerShell
    :active-destination="activeDestination"
    :account-label="accountLabel"
    :cart-count="cartCount"
    :categories="data.categories"
    :is-authenticated="isAuthenticated"
    :selected-category-id="selectedCategoryId"
    :show-back="canGoBack"
    @back="back"
    @navigate="handleNavigation"
    @select-category="navigate({ id: 'group', groupId: $event })"
    @sign-out="signOut"
  >
    <div class="customer-journey-host__content">
      <AuthGatePrompt
        v-if="pendingProtectedScreen"
        v-bind="CUSTOMER_JOURNEY_AUTH_GATE_COPY"
        @confirm="confirmProtectedAccess"
      />
      <MenuRootScreen
        v-else-if="currentScreen.id === 'menu'"
        :categories="data.categories"
        @select-category="navigate({ id: 'group', groupId: $event })"
      />
      <MenuGroupScreen
        v-else-if="currentScreen.id === 'group'"
        :category="category"
        @select-product="
          navigate({
            id: 'product',
            groupId: currentScreen.groupId,
            itemId: $event,
          })
        "
      />
      <ProductDetailScreen
        v-else-if="currentScreen.id === 'product' && category && product"
        :cart-item="editedCartItem"
        :category="category"
        :product="product"
        @submit="submitCartItem"
      />
      <CartScreen
        v-else-if="currentScreen.id === 'cart'"
        :items="cartItems"
        @checkout="openProtected({ id: 'slot' })"
        @continue-shopping="goMenu"
        @remove-item="
          cartItems = cartItems.filter((item) => item.id !== $event)
        "
      />
      <SlotPickerScreen
        v-else-if="currentScreen.id === 'slot'"
        :selected-slot-id="selectedSlotId"
        :slots="data.slots"
        @confirm="confirmSlot"
        @select-slot="selectedSlotId = $event"
      />
      <OrdersHistoryScreen
        v-else-if="currentScreen.id === 'orders'"
        :orders="data.orders"
        :refreshing="refreshingOrders"
        :status-labels="data.statusLabels"
        @refresh="refreshOrders"
      />
      <AuthScreen
        v-else-if="currentScreen.id === 'auth'"
        :state="auth"
        @back-to-phone="updateAuth({ step: 'phone' })"
        @continue="finishAuth"
        @reset="resetAuthForm"
        @retry-otp="updateAuth({ step: 'otp', errorMessage: '' })"
        @send-code="sendCode"
        @submit-name="submitName"
        @update-name="updateAuth({ name: $event })"
        @update-phone="updateAuth({ phone: $event })"
        @verify-otp="verifyOtp"
      />
      <MenuRootScreen
        v-else
        :categories="data.categories"
        @select-category="navigate({ id: 'group', groupId: $event })"
      />
    </div>
  </CustomerShell>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import AuthGatePrompt from "../../../customer/pages/auth/AuthGatePrompt.vue";
import AuthScreen from "../../../customer/pages/auth/AuthScreen.vue";
import CartScreen from "../../../customer/pages/checkout/CartScreen.vue";
import SlotPickerScreen from "../../../customer/pages/checkout/SlotPickerScreen.vue";
import MenuGroupScreen from "../../../customer/pages/menu/MenuGroupScreen.vue";
import MenuRootScreen from "../../../customer/pages/menu/MenuRootScreen.vue";
import ProductDetailScreen from "../../../customer/pages/menu/ProductDetailScreen.vue";
import OrdersHistoryScreen from "../../../customer/pages/orders/OrdersHistoryScreen.vue";
import CustomerShell from "../../../customer/shell/CustomerShell.vue";
import {
  CUSTOMER_JOURNEY_AUTH_GATE_COPY,
  CUSTOMER_JOURNEY_KNOWN_PHONE_NUMBERS,
  CUSTOMER_JOURNEY_OTP,
} from "./CustomerJourneyHost.constants";
import type {
  CustomerJourneyCartItemDraft,
  CustomerJourneyHostProps,
  CustomerJourneyNavigationDestination,
  CustomerJourneyProtectedScreen,
  CustomerJourneyScreen,
} from "./CustomerJourneyHost.types";

const props = defineProps<CustomerJourneyHostProps>();

const data = props.seed.data;
const currentScreen = ref<CustomerJourneyScreen>(props.seed.currentScreen);
const navigationStack = ref<CustomerJourneyScreen[]>(
  props.seed.navigationStack,
);
const auth = ref(props.seed.auth);
const cartItems = ref(props.seed.cartItems);
const selectedSlotId = ref(props.seed.selectedSlotId);
const nextCartItemId = ref(cartItems.value.length + 1);
const refreshingOrders = ref(false);
const initialProtectedScreen =
  isProtectedScreen(props.seed.currentScreen) && !props.seed.auth.verified
    ? props.seed.currentScreen
    : undefined;
const pendingProtectedScreen = ref<CustomerJourneyProtectedScreen | undefined>(
  initialProtectedScreen,
);

const cartCount = computed(() =>
  cartItems.value.reduce((total, item) => total + item.quantity, 0),
);
const isAuthenticated = computed(() => auth.value.verified);
const accountLabel = computed(
  () => auth.value.name || auth.value.phone || "Подтверждён",
);
const canGoBack = computed(() => navigationStack.value.length > 0);
const selectedCategoryId = computed(() => {
  const screen = currentScreen.value;
  return screen.id === "group" || screen.id === "product"
    ? screen.groupId
    : undefined;
});
const activeDestination = computed<CustomerJourneyNavigationDestination>(() => {
  const screen = currentScreen.value;

  if (screen.id === "auth" || screen.id === "cart" || screen.id === "orders") {
    return screen.id;
  }

  return "menu";
});
const category = computed(() => {
  const screen = currentScreen.value;
  return screen.id === "group" || screen.id === "product"
    ? data.categories.find((item) => item.id === screen.groupId)
    : undefined;
});
const product = computed(() => {
  const screen = currentScreen.value;
  return screen.id === "product"
    ? category.value?.products.find((item) => item.id === screen.itemId)
    : undefined;
});
const editedCartItem = computed(() => {
  const screen = currentScreen.value;
  return screen.id === "product" && screen.editId
    ? cartItems.value.find((item) => item.id === screen.editId)
    : undefined;
});
const selectedSlot = computed(() =>
  data.slots.find((slot) => slot.id === selectedSlotId.value),
);
const authReturnTo = computed(() =>
  currentScreen.value.id === "auth" ? currentScreen.value.returnTo : undefined,
);
const authOrigin = computed(() =>
  currentScreen.value.id === "auth" && currentScreen.value.returnTo
    ? navigationStack.value.at(-1)
    : undefined,
);

function navigate(screen: CustomerJourneyScreen): void {
  navigationStack.value = [...navigationStack.value, currentScreen.value];
  activate(screen);
}

function isProtectedScreen(
  screen: CustomerJourneyScreen,
): screen is CustomerJourneyProtectedScreen {
  return screen.id === "cart" || screen.id === "slot" || screen.id === "orders";
}

function activate(screen: CustomerJourneyScreen): void {
  if (isProtectedScreen(screen) && !isAuthenticated.value) {
    pendingProtectedScreen.value = screen;
    return;
  }

  pendingProtectedScreen.value = undefined;
  currentScreen.value = screen;
}

function handleNavigation(
  destination: CustomerJourneyNavigationDestination,
): void {
  if (destination === "menu") {
    goMenu();
    return;
  }

  if (destination === "auth") {
    navigate({ id: "auth" });
    return;
  }

  openProtected({ id: destination });
}

function openProtected(screen: CustomerJourneyProtectedScreen): void {
  navigate(screen);
}

function back(): void {
  if (pendingProtectedScreen.value) {
    replaceMenu();
    return;
  }

  const origin = authOrigin.value;
  if (origin) {
    resetAuthForm();
    replaceMenu();
    return;
  }

  const previous = navigationStack.value.at(-1);
  if (!previous) {
    currentScreen.value = { id: "menu" };
    return;
  }

  activate(previous);
  navigationStack.value = navigationStack.value.slice(0, -1);
}

function goMenu(): void {
  replaceMenu();
}

function replaceMenu(): void {
  pendingProtectedScreen.value = undefined;
  navigationStack.value = [];
  currentScreen.value = { id: "menu" };
}

function updateAuth(patch: Partial<typeof auth.value>): void {
  auth.value = { ...auth.value, ...patch };
}

function sendCode(): void {
  updateAuth({ step: "otp", errorMessage: "" });
}

function verifyOtp(code: string): void {
  if (code !== CUSTOMER_JOURNEY_OTP) {
    updateAuth({ step: "error", errorMessage: "Код неверный или истёк" });
    return;
  }

  const knownPhone = CUSTOMER_JOURNEY_KNOWN_PHONE_NUMBERS.has(
    auth.value.phone.replace(/\D/g, ""),
  );
  updateAuth(
    knownPhone
      ? { name: "Клиент", step: "success", verified: true }
      : { step: "register" },
  );
}

function submitName(): void {
  updateAuth({ step: "success", verified: true });
}

function resetAuthForm(): void {
  updateAuth({
    step: "phone",
    name: "",
    phone: "",
    errorMessage: "",
    verified: false,
  });
}

function finishAuth(): void {
  activate(authReturnTo.value ?? { id: "menu" });
}

function confirmProtectedAccess(): void {
  const destination = pendingProtectedScreen.value;
  if (!destination) return;

  pendingProtectedScreen.value = undefined;
  currentScreen.value = { id: "auth", returnTo: destination };
}

function submitCartItem(
  item: CustomerJourneyCartItemDraft,
  editId?: string,
): void {
  if (editId) {
    cartItems.value = cartItems.value.map((cartItem) =>
      cartItem.id === editId ? { ...item, id: editId } : cartItem,
    );
  } else {
    cartItems.value = [
      ...cartItems.value,
      { ...item, id: String(nextCartItemId.value++) },
    ];
  }
  navigate({ id: "cart" });
}

function confirmSlot(): void {
  if (!selectedSlot.value) return;

  cartItems.value = [];
  selectedSlotId.value = null;
  navigate({ id: "orders" });
}

function refreshOrders(): void {
  refreshingOrders.value = true;
  void nextTick().then(() => {
    refreshingOrders.value = false;
  });
}

function signOut(): void {
  resetAuthForm();
  replaceMenu();
}
</script>

<style scoped lang="scss">
.customer-journey-host__content {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}
</style>
