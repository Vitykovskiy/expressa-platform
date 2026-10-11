<template>
  <main class="foundations">
    <h1 class="foundations__title">Дизайн-система</h1>
    <section class="foundations__section">
      <h2 class="foundation-section-title">Семантические цвета</h2>
      <dl class="foundations__swatches">
        <div v-for="role in colorRoles" :key="role" class="foundations__swatch">
          <dt
            class="foundations__sample"
            :style="swatchStyle(role)"
            aria-hidden="true"
          />
          <dd>{{ role }}</dd>
        </div>
      </dl>
    </section>
    <section class="foundations__section">
      <h2 class="foundation-section-title">Типографика</h2>
      <p class="foundations__heading-example">Название страницы</p>
      <p class="foundation-section-title">Название раздела</p>
      <p>Основной текст. Лимонад с чёрной смородиной и розмарином.</p>
      <p class="ui-label">Подпись поля</p>
      <p class="foundations__caption">Дополнительные сведения</p>
    </section>
    <section class="foundations__section">
      <h2 class="foundation-section-title">Интервалы</h2>
      <dl class="foundations__spacing">
        <div v-for="space in spacingRoles" :key="space">
          <dt>{{ space }}</dt>
          <dd class="foundations__space" :style="spacingStyle(space)" />
        </div>
      </dl>
    </section>
  </main>
</template>

<script setup lang="ts">
import { colorRoles, spacingRoles } from "./Foundations.constants";

function swatchStyle(role: string) {
  return { backgroundColor: `var(--color-${role})` };
}

function spacingStyle(role: string) {
  return { inlineSize: `var(--space-${role})` };
}
</script>

<style scoped>
.foundations {
  max-inline-size: var(--content-width);
  padding: var(--space-xl);
  margin: auto;
}
.foundations__title,
.foundations__heading-example {
  font-size: var(--font-page-title);
  font-weight: var(--weight-heading);
  line-height: var(--line-page-title);
  letter-spacing: var(--tracking-page-title);
}
.foundations__section {
  display: grid;
  gap: var(--space-lg);
  margin-block: var(--space-xl);
}
.foundations__swatches {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  gap: var(--space-lg);
}
.foundations__swatch {
  display: grid;
  gap: var(--space-sm);
  min-inline-size: 0;
}
.foundations__swatch dd {
  margin: 0;
  overflow-wrap: anywhere;
  font-size: var(--font-label);
}
.foundations__sample {
  block-size: var(--control-height);
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--radius-control);
}
.foundations__spacing {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xl);
}
.foundations__space {
  background: var(--color-primary);
  block-size: var(--space-lg);
  margin: 0;
}
.foundations__caption {
  font-size: var(--font-caption);
  line-height: var(--line-caption);
  color: var(--color-foreground-muted);
}
</style>
