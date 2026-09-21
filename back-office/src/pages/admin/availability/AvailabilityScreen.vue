<template>
  <main class="availability-screen">
    <TopBar title="Доступность" />
    <div class="availability-screen__page">
      <h1
        class="availability-screen__title availability-screen__title--desktop"
      >
        Доступность
      </h1>
      <div class="availability-screen__toolbar">
        <label class="availability-screen__search" for="availability-search">
          <span class="availability-screen__search-label">{{
            availabilityMessages.searchLabel
          }}</span>
          <span class="availability-screen__search-control">
            <AdminTextField
              id="availability-search"
              :aria-describedby="searchHintId"
              :disabled="isAuthorizationError"
              :model-value="props.search"
              :placeholder="availabilityMessages.searchPlaceholder"
              type="search"
              @keydown="handleSearchKeydown"
              @update:model-value="emit('update:search', $event)"
            />
            <AdminButton
              v-if="props.search && !isAuthorizationError"
              aria-label="Очистить поиск"
              class="availability-screen__clear-search"
              variant="ghost"
              @click="emit('update:search', '')"
              >×</AdminButton
            >
          </span>
          <span :id="searchHintId" class="availability-screen__hint">{{
            isAuthorizationError ? "Недоступно, пока не выполнен вход" : ""
          }}</span>
        </label>
        <FilterTabs
          v-if="categoryTabs.length > 1"
          :model-value="props.activeCategory ?? AVAILABILITY_ALL_CATEGORY"
          class="availability-screen__tabs"
          :disabled="isAuthorizationError"
          :items="categoryTabs"
          layout="responsive"
          @update:model-value="emit('update:activeCategory', $event)"
        />
      </div>
      <section
        v-if="props.loading"
        aria-label="Загружаем доступность"
        class="availability-screen__loading"
      >
        <span
          v-for="index in 3"
          :key="index"
          class="availability-screen__loading-row"
        />
      </section>
      <AdminRequestStatePanel
        v-else-if="props.error !== null"
        :action-label="errorAction"
        :announcement-mode="props.errorFocus ? 'alert' : 'none'"
        :body="errorBody"
        :code="props.error.code"
        :focus-on-appear="props.errorFocus"
        :pending="props.accessRecoveryPending"
        :pending-label="isAuthorizationError ? 'Переходим…' : 'Повторяем…'"
        :request-id="props.error.requestId ?? ''"
        :title="errorTitle"
        @action="recover"
      />
      <section v-if="props.intake !== null" class="availability-screen__ready">
        <section class="availability-screen__intake">
          <h2 class="availability-screen__intake-title">Приём заказов</h2>
          <ToggleRow
            :disabled="props.saving || isAuthorizationError"
            :label="availabilityMessages.intakeLabel"
            :model-value="props.intake.acceptsNewOrders"
            :sublabel="intakeSublabel"
            @update:model-value="updateIntake"
          />
        </section>
        <EmptyState
          v-if="groupedItems.length === 0"
          :description="
            hasItems
              ? 'Измените запрос.'
              : availabilityMessages.emptyDescription
          "
          :title="
            hasItems
              ? availabilityMessages.emptyFilteredTitle
              : availabilityMessages.emptyTitle
          "
          ><template #icon
            ><ToggleRight :size="48" :stroke-width="1.5" /></template
        ></EmptyState>
        <AdminButton
          v-if="hasItems && groupedItems.length === 0"
          class="availability-screen__reset-filters"
          type="button"
          @click="resetFilters"
          >{{ availabilityMessages.resetFilters }}</AdminButton
        >
        <div v-if="groupedItems.length > 0" class="availability-screen__groups">
          <AvailabilityGroup
            v-for="group in groupedItems"
            :key="group.id"
            :category="group.name"
            :disabled="props.saving || isAuthorizationError"
            :items="group.items"
            @availability-change="
              (item, value) => emit('availability-change', item, value)
            "
          />
        </div>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ToggleRight } from "lucide-vue-next";
import { computed, useId } from "vue";
import AdminButton from "../../../shared/ui/admin/admin-button/AdminButton.vue";
import AdminRequestStatePanel from "../../../shared/ui/admin/request-state-panel/AdminRequestStatePanel.vue";
import AdminTextField from "../../../shared/ui/admin/admin-text-field/AdminTextField.vue";
import EmptyState from "../../../shared/ui/admin/empty-state/EmptyState.vue";
import FilterTabs from "../../../shared/ui/admin/filter-tabs/FilterTabs.vue";
import ToggleRow from "../../../shared/ui/admin/toggle-row/ToggleRow.vue";
import TopBar from "../../../widgets/admin-shell/TopBar.vue";
import AvailabilityGroup from "./AvailabilityGroup.vue";
import {
  AVAILABILITY_ALL_CATEGORY,
  availabilityMessages,
} from "./AvailabilityScreen.constants";
import type {
  AvailabilityItemGroup,
  AvailabilityScreenEmits,
  AvailabilityScreenProps,
} from "./AvailabilityScreen.types";

const props = defineProps<AvailabilityScreenProps>();
const emit = defineEmits<AvailabilityScreenEmits>();
const searchHintId = `availability-search-hint-${useId()}`;
const isAuthorizationError = computed(
  () => props.error?.code === "UNAUTHORIZED",
);
const isPermissionError = computed(() => props.error?.status === 403);
const categories = computed(() => [
  AVAILABILITY_ALL_CATEGORY,
  ...props.groups.map((group) => group.id),
]);
const categoryTabs = computed(() =>
  categories.value.map((category) => ({
    value: category,
    label:
      category === AVAILABILITY_ALL_CATEGORY
        ? "Все"
        : (props.groups.find((group) => group.id === category)?.name ?? ""),
  })),
);
const groupedItems = computed(() => {
  const normalizedSearch = (props.search ?? "")
    .trim()
    .toLocaleLowerCase("ru-RU");
  return props.groups.reduce<AvailabilityItemGroup[]>((groups, group) => {
    if (
      (props.activeCategory ?? AVAILABILITY_ALL_CATEGORY) !==
        AVAILABILITY_ALL_CATEGORY &&
      group.id !== props.activeCategory
    )
      return groups;
    const items = group.items.filter(
      (item) =>
        normalizedSearch === "" ||
        `${item.label} ${item.sublabel}`
          .toLocaleLowerCase("ru-RU")
          .includes(normalizedSearch),
    );
    if (items.length > 0)
      groups.push({ id: group.id, items, name: group.name });
    return groups;
  }, []);
});
const hasItems = computed(() =>
  props.groups.some((group) => group.items.length > 0),
);
const errorTitle = computed(() =>
  isPermissionError.value
    ? "Нет доступа к разделу"
    : isAuthorizationError.value
      ? "Сессия завершена"
      : "Не удалось загрузить данные",
);
const errorBody = computed(() =>
  props.error?.code === "LOGIN_NAVIGATION_ERROR"
    ? "Не удалось открыть страницу входа. Повторите попытку."
    : isPermissionError.value
      ? "Обратитесь к администратору, чтобы получить доступ."
      : isAuthorizationError.value
        ? "Войдите снова, чтобы продолжить работу."
        : "Проверьте подключение к интернету и повторите попытку.",
);
const errorAction = computed(() =>
  isPermissionError.value
    ? "Вернуться назад"
    : isAuthorizationError.value
      ? "Войти снова"
      : "Повторить",
);
const intakeSublabel = computed(() => {
  if (props.intake === null) return "";
  if (props.intake.updatedAt === null)
    return props.intake.acceptsNewOrders
      ? availabilityMessages.intakeOn
      : availabilityMessages.intakeOff;
  return `Изменил ${props.intake.updatedByLabel ?? "Неизвестный сотрудник"} ${new Date(props.intake.updatedAt).toLocaleString("ru-RU")}`;
});
function recover(): void {
  if (isPermissionError.value) {
    emit("go-back");
    return;
  }
  if (isAuthorizationError.value) {
    emit("restore-access");
    return;
  }
  emit("retry");
}
function updateIntake(value: boolean): void {
  emit("intake-change", value);
}
function resetFilters(): void {
  emit("update:search", "");
  emit("update:activeCategory", AVAILABILITY_ALL_CATEGORY);
}
function handleSearchKeydown(event: KeyboardEvent): void {
  if (event.key === "Escape") emit("update:search", "");
}
</script>

<style scoped lang="scss">
.availability-screen {
  min-height: 100%;
  background: var(--expressa-color-surface-raised);
}
.availability-screen__page {
  width: min(100%, 1200px);
  margin: 0 auto;
  padding: var(--expressa-space-16) var(--expressa-space-16)
    var(--expressa-space-48);
}
.availability-screen__title {
  margin: 0 0 var(--expressa-space-24);
  color: var(--expressa-color-text-primary);
  font-size: 28px;
  font-weight: var(--expressa-font-weight-bold);
  line-height: 36px;
}
.availability-screen__toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--expressa-space-16);
  align-items: end;
}
.availability-screen__search {
  display: grid;
  width: min(100%, 640px);
  gap: var(--expressa-space-4);
}
.availability-screen__search-label,
.availability-screen__intake-title {
  font-size: var(--expressa-font-size-action);
  font-weight: var(--expressa-font-weight-semibold);
}
.availability-screen__search-control {
  position: relative;
}
.availability-screen__clear-search {
  position: absolute;
  top: 0;
  right: 0;
  width: var(--expressa-size-control-min-height);
  padding: 0;
  font-size: 24px;
}
.availability-screen__hint {
  min-height: 18px;
  color: var(--expressa-color-text-secondary);
  font-size: var(--expressa-font-size-caption);
}
.availability-screen__loading,
.availability-screen__ready,
.availability-screen__page > :deep(.request-state-panel) {
  margin-top: var(--expressa-space-24);
}
.availability-screen__loading {
  display: grid;
  width: min(100%, 720px);
  gap: var(--expressa-space-8);
}
.availability-screen__loading-row {
  display: block;
  height: var(--expressa-size-row-min);
  border-radius: var(--expressa-radius-panel);
  background: var(--expressa-color-surface-subtle);
}
.availability-screen__ready {
  display: grid;
  gap: var(--expressa-space-24);
}
.availability-screen__intake {
  padding: var(--expressa-space-16);
  border: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  border-radius: var(--expressa-radius-panel);
  background: var(--expressa-color-surface);
}
.availability-screen__intake-title {
  margin: 0 0 var(--expressa-space-8);
}
.availability-screen__groups {
  display: grid;
  gap: var(--expressa-space-24);
}
@media (min-width: 768px) {
  .availability-screen {
    background: var(--expressa-color-surface);
  }
  .availability-screen__page {
    padding: var(--expressa-space-32);
  }
  .availability-screen__title {
    font-size: var(--expressa-font-size-screen-title);
    line-height: var(--expressa-line-height-heading);
  }
}
@media (max-width: 479px) {
  .availability-screen__page > :deep(.request-state-panel) {
    width: 100%;
  }
}
@media (max-width: 767px) {
  .availability-screen__title--desktop {
    display: none;
  }
}
</style>
