<template>
  <div v-if="props.notice" class="users-page-notice" role="status">
    <p>{{ props.notice }}</p>
    <button
      v-if="props.needsInspection"
      type="button"
      class="users-page-notice__action"
      @click="resumeCommand"
    >
      Открыть изменение
    </button>
  </div>
  <UsersContent
    ref="content"
    :tab="props.tab"
    :customers="props.customers"
    :employees="props.employees"
    :query="props.query"
    :filter="props.filter"
    :loading="props.loading"
    :error="props.error"
    @update:tab="emit('update:tab', $event)"
    @update:query="emit('update:query', $event)"
    @update:filter="emit('update:filter', $event)"
    @create="openCreate"
    @role="openRole"
    @access="openAccess"
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
    @set-work-access="setWorkAccess"
    @select-role="emit('selectRole', $event)"
    @inspect="emit('inspect')"
  />
</template>

<script setup lang="ts">
import { computed, useTemplateRef, watch } from "vue";
import UsersContent from "./components/UsersContent.vue";
import AddUserDialog from "./components/AddUserDialog.vue";
import UserAccessDialog from "./components/UserAccessDialog.vue";
import type { EmployeePresentation, UserRole } from "./components/Users.types";
import type { UsersPageProps, UsersPageEmits } from "./UsersPage.types";
import "../../shared/ui/operations/operations.tokens.css";

const props = defineProps<UsersPageProps>();
const emit = defineEmits<UsersPageEmits>();
const content = useTemplateRef<InstanceType<typeof UsersContent>>("content");
let dialogTrigger: globalThis.HTMLButtonElement | null = null;

watch(() => props.dialog !== null, restoreDialogFocus, { flush: "post" });

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

function openCreate(trigger: globalThis.HTMLButtonElement) {
  dialogTrigger = trigger;
  emit("openCreate");
}

function openRole(
  user: EmployeePresentation,
  trigger: globalThis.HTMLButtonElement | null,
) {
  dialogTrigger = trigger;
  emit("openRole", user);
}

function openAccess(
  user: EmployeePresentation,
  trigger: globalThis.HTMLButtonElement | null,
) {
  dialogTrigger = trigger;
  emit("openAccess", user);
}

function resumeCommand(event: globalThis.MouseEvent) {
  const trigger = event.currentTarget;

  if (trigger instanceof globalThis.HTMLButtonElement) {
    dialogTrigger = trigger;
  }

  emit("resumeCommand");
}

function restoreDialogFocus(open: boolean) {
  if (open) {
    return;
  }

  const trigger = dialogTrigger;

  dialogTrigger = null;

  // Меню уже снято с DOM; возвращаемся к его настоящей кнопке в строке.
  if (trigger?.isConnected) {
    trigger.focus();

    if (trigger.ownerDocument.activeElement === trigger) {
      return;
    }
  }

  // После команды строка может исчезнуть из текущего фильтра.
  content.value?.focusDirectory();
}

function assignRole(id: string, role: UserRole) {
  emit("assignRole", id, role);
}

function setWorkAccess(id: string, enabled: boolean) {
  emit("setWorkAccess", id, enabled);
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
