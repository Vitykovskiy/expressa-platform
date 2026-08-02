<template>
  <section class="permission" :class="permissionClass" role="status">
    <strong>{{ label }}</strong
    ><button v-if="canRequest" type="button" @click="emit('request')">
      Разрешить
    </button>
  </section>
</template>
<script setup lang="ts">
import { computed } from "vue";
defineOptions({ name: "FoNotificationPermission" });
type Permission = "default" | "granted" | "denied";
const props = defineProps<{ permission: Permission }>();
const emit = defineEmits<{ request: [] }>();
const labels: Record<Permission, string> = {
  default: "Разрешите уведомления о готовности заказа",
  granted: "Уведомления разрешены",
  denied: "Уведомления запрещены в браузере",
};
const label = computed(() => labels[props.permission]);
const canRequest = computed(() => props.permission === "default");
const permissionClass = computed(() => `permission--${props.permission}`);
</script>
<style scoped>
.permission {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--fo-space-3);
  padding: var(--fo-space-3);
  border: 1px solid var(--fo-border);
  border-radius: var(--fo-radius-md);
  font: 400 0.875rem/1.3 var(--fo-font);
}
.permission strong {
  overflow-wrap: anywhere;
}
.permission--granted {
  border-color: var(--fo-success);
}
.permission--denied {
  border-color: var(--fo-danger);
}
.permission button {
  flex: none;
  min-height: 2.75rem;
  border: 0;
  border-radius: var(--fo-radius-sm);
  padding: 0 var(--fo-space-3);
  color: var(--fo-surface);
  background: var(--fo-brand);
  font: 700 0.875rem/1 var(--fo-font);
  cursor: pointer;
}
</style>
