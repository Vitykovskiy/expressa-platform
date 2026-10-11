<template>
  <UiSelect
    class="theme-control"
    label="Тема"
    :model-value="theme.choice.value"
    :options="themeOptions"
    @update:model-value="select"
  />
</template>

<script setup lang="ts">
import UiSelect from "../shared/ui/UiSelect/UiSelect.vue";
import { useThemePreference } from "./theme";
import { themeOptions } from "./ThemeControl.constants";

const theme = useThemePreference();

function select(value: string | null) {
  if (value === "system") {
    theme.followSystem();
  } else if (value === "light" || value === "dark") {
    theme.select(value);
  }
}
</script>

<style scoped>
.theme-control {
  min-inline-size: 0;
  inline-size: 10rem; /* Three short theme names; local header geometry. */
}
</style>
