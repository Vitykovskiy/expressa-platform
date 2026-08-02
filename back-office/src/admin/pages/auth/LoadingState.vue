<template>
  <section class="auth-state" role="status">Подождите…</section>
</template>

<script setup lang="ts"></script>

<style scoped lang="scss">
.auth-state {
  display: grid;
  min-height: var(--expressa-size-loading-state-min-height);
  place-items: center;
  color: var(--expressa-color-text-muted);
  font-size: var(--expressa-font-size-action);
}
</style>
