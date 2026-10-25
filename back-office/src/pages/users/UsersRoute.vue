<template>
  <div ref="viewport" class="users-route">
    <UsersPage
      :users="users.users"
      :query="users.query"
      :filter="users.filter"
      :loading="loading"
      :error="users.readError"
      :dialog="users.dialog"
      :command-phase="users.dialogPhase"
      :command-error="users.commandError"
      :notice="users.notice"
      :needs-inspection="users.needsInspection"
      @update:query="users.selectQuery"
      @update:filter="users.selectFilter"
      @open-create="users.openCreate"
      @open-role="openRole"
      @open-access="openAccess"
      @close-dialog="users.closeDialog"
      @create="users.create"
      @assign-role="users.assignRole"
      @set-blocked="users.setBlocked"
      @update-draft="users.updateDraft"
      @select-role="users.selectRole"
      @inspect="users.inspectCommand"
      @resume-command="users.revealPending"
      @retry="users.load"
    />
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  watch,
  nextTick,
  useTemplateRef,
} from "vue";
import UsersPage from "./UsersPage.vue";
import { useUsersStore } from "../../features/users/model/users.store";
import type { UserPresentation } from "../../features/users/ui/Users.types";
import type { UsersRouteProps, UsersRouteEmits } from "./UsersRoute.types";

const props = defineProps<UsersRouteProps>();
const emit = defineEmits<UsersRouteEmits>();

const users = useUsersStore();
const viewport = useTemplateRef<globalThis.HTMLDivElement>("viewport");
const loading = computed(() => users.phase === "loading");

async function activateDirectory() {
  const activationSession = props.session;
  const { identity, accessToken } = activationSession;

  await users.activate({
    identityId: identity.id,
    role: identity.role,
    accessToken,
  });
  await nextTick();

  // Загрузка прежнего сеанса не должна прокручивать страницу нового.
  if (props.session !== activationSession || viewport.value === null) {
    return;
  }

  viewport.value.scrollTop = users.scrollTop;
}

function deactivateDirectory() {
  if (viewport.value !== null) {
    users.rememberScroll(props.session.identity.id, viewport.value.scrollTop);
  }

  users.deactivate();
}

function openRole(user: UserPresentation) {
  users.openUser(user, "role");
}

function openAccess(user: UserPresentation) {
  users.openUser(user, "access");
}

watch(() => props.session, activateDirectory, { immediate: true });
watch(
  () => users.sessionExpired,
  (expired) => {
    if (expired) {
      emit("sessionExpired");
    }
  },
);
onBeforeUnmount(deactivateDirectory);
</script>

<style scoped>
.users-route {
  height: 100%;
  min-height: 0;
  overflow-y: auto;
}
</style>
