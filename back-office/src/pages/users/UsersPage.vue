<template>
  <div v-if="props.notice" class="users-page-notice" role="status">
    <p>{{ props.notice }}</p>
    <button
      v-if="props.needsInspection"
      type="button"
      class="users-page-notice__action"
      @click="emit('resumeCommand')"
    >
      Открыть изменение
    </button>
  </div>
  <UsersContent
    :users="props.users"
    :query="props.query"
    :filter="props.filter"
    :loading="props.loading"
    :error="props.error"
    @update:query="emit('update:query', $event)"
    @update:filter="emit('update:filter', $event)"
    @create="emit('openCreate')"
    @role="emit('openRole', $event)"
    @access="emit('openAccess', $event)"
    @retry="emit('retry')"
  />
  <AddUserDialog
    v-if="createDraft"
    :draft="createDraft"
    :phase="props.commandPhase"
    :error="props.commandError"
    @close="emit('closeDialog')"
    @submit="emit('create', $event)"
    @update-draft="emit('updateDraft', $event)"
    @inspect="emit('inspect')"
  />
  <UserAccessDialog
    v-else-if="accessDialog"
    :key="dialogKey"
    :kind="accessDialog.kind"
    :user="accessDialog.user"
    :selected-role="accessDialog.selectedRole"
    :phase="props.commandPhase"
    :error="props.commandError"
    @close="emit('closeDialog')"
    @assign-role="assignRole"
    @set-blocked="setBlocked"
    @select-role="emit('selectRole', $event)"
    @inspect="emit('inspect')"
  />
</template>

<script setup lang="ts">
import { computed } from "vue";
import UsersContent from "../../widgets/users/UsersContent.vue";
import AddUserDialog from "../../features/users/ui/AddUserDialog.vue";
import UserAccessDialog from "../../features/users/ui/UserAccessDialog.vue";
import type { UserRole } from "../../features/users/ui/Users.types";
import type { UsersPageProps, UsersPageEmits } from "./UsersPage.types";
import "../../shared/ui/operations/operations.tokens.css";

const props = defineProps<UsersPageProps>();
const emit = defineEmits<UsersPageEmits>();

const createDraft = computed(() => {
  const dialog = props.dialog;

  return dialog?.kind === "create" ? dialog.draft : null;
});

const accessDialog = computed(() => {
  const dialog = props.dialog;

  if (dialog === null || dialog.kind === "create") {
    return null;
  }

  return dialog;
});

const dialogKey = computed(() => {
  const dialog = accessDialog.value;

  if (dialog === null) {
    return "closed";
  }

  return `${dialog.kind}:${dialog.user.id}`;
});

function assignRole(id: string, role: UserRole) {
  emit("assignRole", id, role);
}

function setBlocked(id: string, blocked: boolean) {
  emit("setBlocked", id, blocked);
}
</script>

<style scoped>
/* Ширина, отступы и типографика уведомления согласованы с каталогом пользователей;
   в теме нет соответствующих шкал геометрии и текста. */
.users-page-notice {
  max-width: 720px;
  margin: 0 auto;
  padding: 16px 24px;
  color: var(--color-foreground-muted);
  background: var(--color-background);
  font:
    400 13px/19.5px Inter,
    sans-serif;
}
.users-page-notice__action {
  padding: 8px 0;
  border: 0;
  background: transparent;
  color: var(--color-primary);
  cursor: pointer;
  font: inherit;
}
</style>
