<template>
  <div class="auth-pending" role="status">
    <div class="loader-slot"><img :src="loaderIcon" alt="" /></div>
    <p class="pending-copy">Проверяем доступ…</p>
  </div>
</template>

<script setup lang="ts">
import loaderIcon from "./assets/loader.svg";
</script>

<style scoped>
.auth-pending {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 180px;
}
.loader-slot {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
}
.pending-copy {
  margin: 0;
  color: var(--color-foreground-muted);
  font-size: 13px;
  line-height: 19.5px;
}
</style>
