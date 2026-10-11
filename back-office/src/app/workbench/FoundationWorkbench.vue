<template>
  <main class="workbench">
    <header class="workbench__header">
      <h1 class="workbench__title">Основа интерфейса</h1>
      <UiFilterGroup
        :model-value="theme.mode.value"
        label="Тема"
        :options="themeOptions"
        @update:model-value="selectTheme"
      />
    </header>
    <div class="workbench__groups"><WorkbenchForm /><WorkbenchStates /></div>
  </main>
</template>

<script setup lang="ts">
import UiFilterGroup from "../../shared/ui/UiFilterGroup/UiFilterGroup.vue";
import { useThemePreference } from "../theme";
import { themeOptions } from "../theme.constants";
import WorkbenchForm from "./WorkbenchForm.vue";
import WorkbenchStates from "./WorkbenchStates.vue";

const theme = useThemePreference();

function selectTheme(value: string) {
  if (value === "light" || value === "dark") {
    theme.select(value);
  }
}
</script>

<style scoped>
.workbench {
  inline-size: 100%;
  max-inline-size: var(--content-width);
  margin-inline: auto;
  padding: var(--space-xl) var(--space-lg);
}
.workbench__header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-xl);
  padding-block-end: var(--space-xl);
  margin-block-end: var(--space-xl);
  border-block-end: var(--border-width) solid var(--color-border);
}
.workbench__title {
  margin: 0;
  font-size: var(--font-page-title);
  line-height: var(--line-page-title);
  letter-spacing: var(--tracking-page-title);
  font-weight: var(--weight-heading);
}
.workbench__groups {
  display: grid;
  gap: var(--section-gap);
}
@media (min-width: 600px) {
  .workbench {
    padding-inline: var(--space-xl);
  }
}
@media (min-width: 960px) {
  .workbench__groups {
    grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
  }
}
</style>
