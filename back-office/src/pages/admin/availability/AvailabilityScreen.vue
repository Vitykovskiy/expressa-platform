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
        <AdminFieldWrapper
          id="availability-search"
          v-slot="field"
          class="availability-screen__search"
          :label="availabilityMessages.searchLabel"
        >
          <span
            class="availability-screen__search-control"
            :class="{
              'availability-screen__search-control--with-clear': props.search,
            }"
          >
            <AdminTextField
              :id="field.controlId"
              :model-value="props.search"
              :required="field.required"
              type="search"
              @update:model-value="emit('update:search', $event)"
            />
            <AdminButton
              v-if="props.search"
              class="availability-screen__clear-search"
              variant="ghost"
              @click="emit('update:search', '')"
              ><AdminIcon :icon="X"
            /></AdminButton>
          </span>
        </AdminFieldWrapper>
        <FilterTabs
          v-if="categoryTabs.length > 1"
          :model-value="props.activeCategory ?? AVAILABILITY_ALL_CATEGORY"
          class="availability-screen__tabs"
          :items="categoryTabs"
          layout="bounded-wrapped"
          @update:model-value="emit('update:activeCategory', $event)"
        />
      </div>
      <section v-if="props.loading" class="availability-screen__loading">
        <span
          v-for="index in 3"
          :key="index"
          class="availability-screen__loading-row"
        />
      </section>
      <section v-if="props.intake !== null" class="availability-screen__ready">
        <EmptyState
          v-if="groupedItems.length === 0"
          :title="
            hasItems
              ? availabilityMessages.emptyFilteredTitle
              : availabilityMessages.emptyTitle
          "
        >
          <template #icon><AdminIcon :icon="ToggleRight" /></template>
          <template v-if="hasItems" #action>
            <AdminButton
              variant="secondary"
              type="button"
              @click="resetFilters"
            >
              {{ availabilityMessages.resetFilters }}
            </AdminButton>
          </template>
        </EmptyState>
        <div v-if="groupedItems.length > 0" class="availability-screen__groups">
          <AvailabilityGroup
            v-for="group in groupedItems"
            :key="group.id"
            :category="group.name"
            :disabled="props.saving"
            :items="group.items"
            @availability-change="
              (item, value) => emit('availability-change', item, value)
            "
          />
        </div>
        <section class="availability-screen__intake">
          <ToggleRow
            :disabled="props.saving"
            :divider="false"
            separate-control
            :label="availabilityMessages.intakeLabel"
            :model-value="props.intake.acceptsNewOrders"
            :sublabel="intakeSublabel"
            @update:model-value="updateIntake"
          />
        </section>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ToggleRight, X } from "lucide-vue-next";
import { computed } from "vue";
import AdminButton from "../../../shared/ui/admin/admin-button/AdminButton.vue";
import AdminIcon from "../../../shared/ui/admin/admin-icon/AdminIcon.vue";
import AdminFieldWrapper from "../../../shared/ui/admin/field-wrapper/AdminFieldWrapper.vue";
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
const intakeSublabel = computed(() => {
  if (props.intake === null) return "";
  if (props.intake.updatedAt === null)
    return props.intake.acceptsNewOrders
      ? availabilityMessages.intakeOn
      : availabilityMessages.intakeOff;
  return `Изменил ${props.intake.updatedByLabel ?? "Неизвестный сотрудник"} ${new Date(props.intake.updatedAt).toLocaleString("ru-RU")}`;
});
function updateIntake(value: boolean): void {
  emit("intake-change", value);
}
function resetFilters(): void {
  emit("update:search", "");
  emit("update:activeCategory", AVAILABILITY_ALL_CATEGORY);
}
</script>

<style scoped lang="scss">
.availability-screen {
  min-height: 100%;
  background: var(--expressa-color-surface-raised);
}
.availability-screen__page {
  width: 100%;
  padding: var(--expressa-space-16) var(--expressa-space-16)
    var(--expressa-space-48);
}
.availability-screen__title {
  margin: 0 0 var(--expressa-space-24);
  color: var(--expressa-color-text-primary);
  font-size: var(--expressa-font-size-screen-title);
  font-weight: var(--expressa-font-weight-semibold);
  line-height: var(--expressa-line-height-heading);
}
.availability-screen__toolbar {
  display: grid;
  gap: var(--expressa-space-16);
  align-items: center;
}
.availability-screen__search {
  display: grid;
  width: 100%;
  gap: var(--expressa-space-4);
  min-inline-size: 0;
}
.availability-screen__tabs {
  min-width: 0;
}
.availability-screen__search-control {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: center;
  gap: var(--expressa-space-8);
  min-inline-size: 0;
}
.availability-screen__search-control--with-clear {
  grid-template-columns: minmax(0, 1fr) auto;
}
.availability-screen__clear-search {
  inline-size: var(--expressa-size-control-min-height);
  padding: 0;
}
.availability-screen__loading,
.availability-screen__ready {
  margin-top: var(--expressa-space-24);
}
.availability-screen__loading {
  display: grid;
  width: 100%;
  gap: var(--expressa-space-8);
}
.availability-screen__loading-row {
  display: block;
  height: var(--expressa-size-row-min);
  border: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  border-radius: var(--expressa-radius-panel);
  background: var(--expressa-color-surface);
}
.availability-screen__ready {
  display: grid;
  gap: var(--expressa-space-24);
}
.availability-screen__intake {
  padding-inline: var(--expressa-space-16);
  border: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  border-radius: var(--expressa-radius-panel);
  background: var(--expressa-color-surface);
}
.availability-screen__groups {
  display: grid;
  gap: var(--expressa-space-24);
}
@media (min-width: 768px) {
  .availability-screen {
    background: var(--expressa-color-surface);
  }
  .availability-screen__loading-row {
    background: var(--expressa-color-surface-subtle);
  }
  .availability-screen__page {
    padding: var(--expressa-space-24);
  }
  .availability-screen__title {
    font-size: var(--expressa-font-size-screen-title);
    line-height: var(--expressa-line-height-heading);
  }
  .availability-screen__search {
    max-inline-size: var(--expressa-size-auth-card-max-width);
  }
}
@media (max-width: 767px) {
  .availability-screen__title--desktop {
    display: none;
  }
}
</style>
