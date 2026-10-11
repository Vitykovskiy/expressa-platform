<template>
  <VApp class="foundation-root" :data-theme="theme.mode.value">
    <slot />
  </VApp>
</template>

<script setup lang="ts">
import { VApp } from "vuetify/components";
import { useThemePreference } from "./theme";
import type { FoundationSurfaceSlots } from "./FoundationSurface.types";

const theme = useThemePreference();

defineSlots<FoundationSurfaceSlots>();
</script>
