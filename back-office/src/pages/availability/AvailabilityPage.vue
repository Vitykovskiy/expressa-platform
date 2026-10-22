<template>
  <main ref="desktopScroll" class="availability-page">
    <header class="availability-title">
      <h1 ref="heading" class="page-heading" tabindex="-1">Доступность</h1>
    </header>
    <div ref="mobileScroll" class="availability-scroll">
      <AvailabilityFilters
        :groups="availability.groups"
        :selected="availability.selectedGroup"
        @select="availability.selectGroup"
      />
      <div class="availability-content">
        <div v-if="initialLoading" class="loading-state" role="status">
          <img :src="loaderIcon" alt="" />
          <p class="loading-copy">Загружаем доступность…</p>
        </div>
        <div v-else-if="empty" class="empty-state">
          <img :src="emptyIcon" alt="" />
          <h2 class="empty-title">Меню пусто</h2>
          <p class="empty-copy">Позиции появятся после добавления в меню</p>
        </div>
        <AvailabilityGroups
          v-else
          :groups="availability.visibleGroups"
          :command="availability.command"
          :disabled="commandsDisabled"
          @toggle="availability.toggle"
        />
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onMounted,
  onScopeDispose,
  useTemplateRef,
  watch,
} from "vue";
import { useAvailabilityStore } from "../../entities/availability/availability.store";
import AvailabilityFilters from "../../features/availability/AvailabilityFilters.vue";
import AvailabilityGroups from "../../features/availability/AvailabilityGroups.vue";
import emptyIcon from "../../features/availability/assets/empty.svg";
import loaderIcon from "../../features/availability/assets/loader.svg";
import type {
  AvailabilityPageProps,
  AvailabilityHeadingElement,
  AvailabilityScrollElement,
} from "./AvailabilityPage.types";

const props = defineProps<AvailabilityPageProps>();
const emit = defineEmits<{ sessionExpired: [] }>();
const availability = useAvailabilityStore();
const heading = useTemplateRef<AvailabilityHeadingElement>("heading");
const desktopScroll =
  useTemplateRef<AvailabilityScrollElement>("desktopScroll");
const mobileScroll = useTemplateRef<AvailabilityScrollElement>("mobileScroll");
let disposed = false;

const initialLoading = computed(
  () => availability.phase === "loading" && availability.groups.length === 0,
);
const empty = computed(
  () => availability.phase === "ready" && availability.groups.length === 0,
);
const commandsDisabled = computed(
  () => availability.command !== null || availability.phase !== "ready",
);

watch(
  () => availability.sessionExpired,
  (expired) => {
    if (expired) {
      emit("sessionExpired");
    }
  },
);

onMounted(async () => {
  globalThis.document.title = "Доступность · Expressa";
  await nextTick();

  if (disposed) {
    return;
  }

  heading.value?.focus();

  if (desktopScroll.value !== null) {
    desktopScroll.value.scrollTop = availability.scrollPosition.desktop;
  }

  if (mobileScroll.value !== null) {
    mobileScroll.value.scrollTop = availability.scrollPosition.mobile;
  }

  await availability.activate(props.context);
});

onScopeDispose(() => {
  disposed = true;
  if (desktopScroll.value !== null && mobileScroll.value !== null) {
    availability.rememberScroll(props.context.identityId, {
      desktop: desktopScroll.value.scrollTop,
      mobile: mobileScroll.value.scrollTop,
    });
  }

  availability.deactivate();
});
</script>

<style scoped>
.availability-page {
  display: flex;
  flex: 1;
  min-width: 0;
  height: 100dvh;
  flex-direction: column;
  padding: 24px;
  background: var(--color-surface);
  overflow: auto;
}
.availability-title {
  width: 100%;
  max-width: 960px;
  padding-bottom: 16px;
}
.page-heading {
  margin: 0;
  font-size: 24px;
  line-height: 32px;
  font-weight: 700;
  color: var(--color-foreground);
  outline: none;
}
.availability-scroll {
  min-width: 0;
  width: 100%;
  max-width: 960px;
}
.availability-content {
  padding-top: 16px;
}
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 48px 24px;
  text-align: center;
}
.empty-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  line-height: 28px;
}
.empty-copy {
  margin: 0;
  color: var(--color-foreground-muted);
  font-size: 14px;
  line-height: 20px;
}
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px 24px;
}
.loading-copy {
  margin: 0;
  color: var(--color-foreground-muted);
  font-size: 13px;
  line-height: 19.5px;
  text-align: center;
}
@media (max-width: 767px) {
  .availability-page {
    height: calc(100dvh - 60px);
    padding: 0;
    overflow: hidden;
    background: var(--color-background);
  }
  .availability-title {
    display: flex;
    align-items: center;
    flex: 0 0 52px;
    padding: 0 16px;
    background: var(--color-surface);
  }
  .page-heading {
    font-size: 18px;
    line-height: 28px;
    font-weight: 600;
  }
  .availability-scroll {
    flex: 1;
    overflow: auto;
  }
  .availability-content {
    padding: 16px;
  }
}
</style>
