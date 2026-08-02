<template>
  <article class="user-row">
    <div class="user-avatar" aria-hidden="true">
      {{ initials }}
    </div>

    <div class="user-details">
      <div class="user-title">
        <span class="user-name">{{ props.user.name }}</span>
        <span v-if="userRole" class="user-role" :class="userRole.className">
          {{ userRole.label }}
        </span>
        <span class="user-status" :class="statusPresentation.className">
          {{ statusPresentation.label }}
        </span>
      </div>
      <span v-if="props.user.phone" class="user-phone">
        {{ props.user.phone }}
      </span>
    </div>

    <UserActionMenu
      :available-actions="availableActions"
      :user="props.user"
      @select="emit('action', $event)"
    />
  </article>
</template>

<script setup lang="ts">
import { computed } from "vue";

import type { UserAction } from "../../shared/ui/Admin.types";
import UserActionMenu from "./UserActionMenu.vue";
import {
  USER_ACTION_BLOCK,
  USER_ACTION_CHANGE_ROLE,
  USER_ACTION_UNBLOCK,
  USER_ROLE_PRESENTATION,
  USER_STATUS_PRESENTATION,
} from "./UserRow.constants";
import type { UserRowEmits, UserRowProps } from "./UserRow.types";

const props = defineProps<UserRowProps>();

const emit = defineEmits<UserRowEmits>();

const statusPresentation = computed(() => {
  if (props.user.status === "blocked") {
    return USER_STATUS_PRESENTATION.blocked;
  }

  if (!props.user.role) {
    return USER_STATUS_PRESENTATION.noRole;
  }

  return USER_STATUS_PRESENTATION.active;
});

const userRole = computed(() =>
  props.user.role ? USER_ROLE_PRESENTATION[props.user.role] : null,
);

const initials = computed(() =>
  props.user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase(),
);

const availableActions = computed<readonly UserAction[]>(() => [
  USER_ACTION_CHANGE_ROLE,
  props.user.status === "blocked" ? USER_ACTION_UNBLOCK : USER_ACTION_BLOCK,
]);
</script>

<style scoped lang="scss">
.user-row {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: var(--expressa-space-control-inline);
  padding: var(--expressa-space-row-block) var(--expressa-space-md);
  border-bottom: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  background: var(--expressa-color-surface);
}

.user-row:last-child {
  border-bottom: var(--expressa-border-width-none);
}

.user-avatar {
  display: grid;
  width: var(--expressa-size-avatar);
  min-width: var(--expressa-size-avatar);
  height: var(--expressa-size-avatar);
  place-items: center;
  border-radius: var(--expressa-radius-pill);
  color: var(--expressa-color-accent);
  background: var(--expressa-color-status-info-surface);
  font-size: var(--expressa-font-size-caption);
  font-weight: var(--expressa-font-weight-semibold);
}

.user-details {
  min-width: 0;
  flex: 1;
}

.user-title {
  display: flex;
  align-items: center;
  gap: var(--expressa-space-sm);
  flex-wrap: wrap;
}

.user-name {
  min-width: 0;
  color: var(--expressa-color-text-primary);
  font-size: var(--expressa-font-size-body);
  font-weight: var(--expressa-font-weight-semibold);
  overflow-wrap: anywhere;
}

.user-role,
.user-status {
  display: inline-flex;
  min-height: var(--expressa-size-status-min-height);
  align-items: center;
  padding: var(--expressa-space-badge-block) var(--expressa-space-sm);
  border-radius: var(--expressa-radius-pill);
  font-size: var(--expressa-font-size-status);
  font-weight: var(--expressa-font-weight-medium);
  white-space: nowrap;
}

.user-role--administrator {
  color: var(--expressa-color-accent);
  background: var(--expressa-color-status-info-surface);
}

.user-role--barista,
.user-status--active {
  color: var(--expressa-color-status-success);
  background: var(--expressa-color-status-success-surface);
}

.user-status--blocked {
  color: var(--expressa-color-status-error);
  background: var(--expressa-color-status-error-surface);
}

.user-status--no-role {
  color: var(--expressa-color-status-warning);
  background: var(--expressa-color-status-warning-surface);
}

.user-phone {
  display: block;
  margin-top: var(--expressa-space-2xs);
  overflow: hidden;
  color: var(--expressa-color-text-muted);
  font-size: var(--expressa-font-size-caption);
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
