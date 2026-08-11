<template>
  <section aria-label="Загрузка" class="auth-state" role="status">
    <VProgressCircular
      aria-hidden="true"
      color="primary"
      indeterminate
      :size="28"
      :width="2"
    />
    <span>Подождите…</span>
  </section>
</template>

<style scoped lang="scss">
.auth-state {
  display: flex;
  flex-direction: column;
  min-height: var(--expressa-size-loading-state-min-height);
  align-items: center;
  gap: var(--expressa-space-control-inline);
  justify-content: center;
  color: var(--expressa-color-text-muted);
  font-size: var(--expressa-font-size-action);
  line-height: var(--expressa-line-height-body);
  -webkit-font-smoothing: auto;
  text-align: center;
}
</style>
