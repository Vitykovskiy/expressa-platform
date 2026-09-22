<template>
  <dl class="token-showcase">
    <div v-for="item in tokens" :key="item.token" class="token-showcase__item">
      <div class="token-showcase__heading">
        <dt class="token-showcase__family">{{ item.family }}</dt>
        <dd class="token-showcase__role">{{ item.role }}</dd>
      </div>

      <div class="token-showcase__preview" :style="tokenStyle(item.token)">
        <div
          v-if="item.kind === 'color'"
          class="token-showcase__color"
          aria-hidden="true"
        />
        <div
          v-else-if="item.kind === 'typography'"
          class="token-showcase__typography"
        >
          Aa Бб 123
        </div>
        <div
          v-else-if="item.kind === 'spacing'"
          class="token-showcase__spacing"
          aria-hidden="true"
        >
          <span />
          <span />
        </div>
        <div
          v-else-if="item.kind === 'size'"
          class="token-showcase__size"
          aria-hidden="true"
        />
        <div
          v-else-if="item.kind === 'border'"
          class="token-showcase__border"
          aria-hidden="true"
        />
        <div
          v-else-if="item.kind === 'radius'"
          class="token-showcase__radius"
          aria-hidden="true"
        />
        <div
          v-else-if="item.kind === 'shadow'"
          class="token-showcase__shadow"
          aria-hidden="true"
        >
          Card
        </div>
        <div
          v-else
          class="token-showcase__motion"
          aria-label="Демонстрация длительности при наведении или фокусе"
          tabindex="0"
        >
          <span />
        </div>
      </div>

      <div class="token-showcase__meta">
        <code>{{ item.token }}</code>
        <span>{{ item.value }}</span>
      </div>
    </div>
  </dl>
</template>

<script setup lang="ts">
import type { CSSProperties } from "vue";

type TokenKind =
  | "color"
  | "typography"
  | "spacing"
  | "size"
  | "border"
  | "radius"
  | "shadow"
  | "motion";

type TokenItem = {
  family: string;
  role: string;
  token: string;
  value: string;
  kind: TokenKind;
};

defineProps<{ tokens: readonly TokenItem[] }>();

function tokenStyle(token: string): CSSProperties {
  return { "--token-value": `var(${token})` };
}
</script>

<style scoped>
.token-showcase {
  display: grid;
  gap: var(--expressa-space-md);
  margin: 0;
}

.token-showcase__item {
  display: grid;
  grid-template-rows: auto 1fr auto;
  overflow: hidden;
  border: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  border-radius: var(--expressa-radius-panel);
  background: var(--expressa-color-surface-raised);
}

.token-showcase__heading,
.token-showcase__meta {
  padding: var(--expressa-space-sm) var(--expressa-space-md);
}

.token-showcase__heading {
  display: flex;
  gap: var(--expressa-space-sm);
  align-items: baseline;
  justify-content: space-between;
}

.token-showcase__family {
  font-size: var(--expressa-font-size-title);
  font-weight: var(--expressa-font-weight-semibold);
  line-height: var(--expressa-line-height-title);
}

.token-showcase__role {
  margin: 0;
  color: var(--expressa-color-text-secondary);
  font-size: var(--expressa-font-size-status);
}

.token-showcase__preview {
  display: grid;
  min-height: var(--expressa-size-textarea-min-height);
  place-items: center;
  overflow: hidden;
  border-block: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  background: var(--expressa-color-surface-subtle);
}

.token-showcase__color {
  width: 100%;
  height: 100%;
  background: var(--token-value);
}

.token-showcase__typography {
  font-size: var(--token-value);
  font-weight: var(--expressa-font-weight-semibold);
}

.token-showcase__spacing {
  display: flex;
  gap: var(--token-value);
  align-items: center;
}

.token-showcase__spacing span {
  width: var(--expressa-size-control-min-height);
  height: var(--expressa-size-control-min-height);
  border-radius: var(--expressa-radius-sm);
  background: var(--expressa-color-accent);
}

.token-showcase__size {
  width: 50%;
  height: var(--token-value);
  border-radius: var(--expressa-radius-sm);
  background: var(--expressa-color-accent);
}

.token-showcase__border {
  width: 75%;
  border-top: var(--token-value) solid var(--expressa-color-text-primary);
}

.token-showcase__radius,
.token-showcase__shadow {
  width: 50%;
  height: var(--expressa-size-role-option-min-height);
  border: var(--expressa-border-width-default) solid
    var(--expressa-color-border-strong);
  background: var(--expressa-color-surface-raised);
}

.token-showcase__radius {
  border-radius: var(--token-value);
}

.token-showcase__shadow {
  display: grid;
  place-items: center;
  border-radius: var(--expressa-radius-panel);
  box-shadow: var(--token-value);
}

.token-showcase__motion {
  width: 75%;
  padding: var(--expressa-space-sm);
  border-radius: var(--expressa-radius-pill);
  background: var(--expressa-color-surface);
  outline: none;
}

.token-showcase__motion span {
  display: block;
  width: var(--expressa-size-checkbox);
  height: var(--expressa-size-checkbox);
  border-radius: var(--expressa-radius-pill);
  background: var(--expressa-color-accent);
  transition: transform var(--token-value) var(--expressa-motion-ease-state);
}

.token-showcase__motion:is(:hover, :focus-visible) span {
  transform: translateX(calc(100% * 6));
}

.token-showcase__motion:focus-visible {
  outline: var(--expressa-focus-ring);
  outline-offset: var(--expressa-focus-offset);
}

.token-showcase__meta {
  display: flex;
  gap: var(--expressa-space-md);
  align-items: baseline;
  justify-content: space-between;
}

.token-showcase__meta code {
  min-width: 0;
  overflow-wrap: anywhere;
  font-size: var(--expressa-font-size-metadata);
}

.token-showcase__meta span {
  color: var(--expressa-color-text-secondary);
  font-size: var(--expressa-font-size-body);
}

@media (min-width: 768px) {
  .token-showcase {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1280px) {
  .token-showcase {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>
