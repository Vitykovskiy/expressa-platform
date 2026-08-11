<template>
  <v-app class="users-screen">
    <TopBar title="Пользователи" />

    <div class="users-screen__controls">
      <header class="users-screen__desktop-header">
        <h1 class="users-screen__title">Пользователи</h1>
        <AdminButton
          class="users-screen__add-button"
          @click="isAddDialogOpen = true"
        >
          <span aria-hidden="true">+</span>
          Добавить
        </AdminButton>
      </header>

      <section
        class="users-screen__filters"
        aria-label="Поиск и фильтры пользователей"
      >
        <label class="users-screen__search-label" for="users-search">
          Фильтр по имени или телефону
        </label>
        <div class="users-screen__search-wrapper">
          <span aria-hidden="true" class="users-screen__search-icon">⌕</span>
          <AdminTextField
            id="users-search"
            v-model="searchQuery"
            class="users-screen__search"
            placeholder="Фильтр по имени или телефону"
            type="search"
          />
        </div>
        <FilterTabs v-model="activeFilter" :items="USER_FILTER_ITEMS" />
      </section>
    </div>

    <main class="users-screen__content">
      <section class="users-screen__list" aria-label="Пользователи">
        <EmptyState
          v-if="filteredUsers.length === 0"
          description="Они появятся после добавления"
          title="Пользователей нет"
        />
        <div v-else class="users-screen__rows">
          <UserRow
            v-for="user in filteredUsers"
            :key="user.id"
            :user="user"
            @action="openActionDialog($event, user)"
          />
        </div>
      </section>
    </main>

    <AdminButton
      aria-label="Добавить"
      class="users-screen__mobile-add"
      type="button"
      @click="isAddDialogOpen = true"
    >
      <span aria-hidden="true">+</span>
    </AdminButton>

    <AddUserDialog v-model:open="isAddDialogOpen" @add="addUser" />
    <UserActionDialog
      v-if="actionSelection"
      v-model:open="isActionDialogOpen"
      :action="actionSelection.action"
      :user="actionSelection.user"
      @cancel="closeActionDialog"
      @confirm="confirmAction"
    />
    <v-snackbar v-model="isSnackbarOpen" :timeout="USERS_SNACKBAR_TIMEOUT">
      {{ snackbarMessage }}
    </v-snackbar>
  </v-app>
</template>

<script setup lang="ts">
import { computed, shallowRef } from "vue";

import type {
  AddUserData,
  User,
  UserAction,
  UserRole,
} from "../../../shared/ui/admin/Admin.types";
import AdminButton from "../../../shared/ui/admin/admin-button/AdminButton.vue";
import AdminTextField from "../../../shared/ui/admin/admin-text-field/AdminTextField.vue";
import EmptyState from "../../../shared/ui/admin/empty-state/EmptyState.vue";
import FilterTabs from "../../../shared/ui/admin/filter-tabs/FilterTabs.vue";
import TopBar from "../../../widgets/admin-shell/TopBar.vue";
import AddUserDialog from "./AddUserDialog.vue";
import UserActionDialog from "./UserActionDialog.vue";
import UserRow from "./UserRow.vue";
import {
  USER_FILTER_ALL,
  USER_FILTER_ITEMS,
  USERS_SNACKBAR_TIMEOUT,
} from "./UsersScreen.constants";
import type {
  ActionSelection,
  UserFilter,
  UsersScreenEmits,
  UsersScreenProps,
} from "./UsersScreen.types";

const props = defineProps<UsersScreenProps>();

const emit = defineEmits<UsersScreenEmits>();

const activeFilter = shallowRef<UserFilter>(USER_FILTER_ALL);
const searchQuery = shallowRef("");
const isAddDialogOpen = shallowRef(false);
const isActionDialogOpen = shallowRef(false);
const actionSelection = shallowRef<ActionSelection | null>(null);
const snackbarMessage = shallowRef("");
const isSnackbarOpen = shallowRef(false);

const filteredUsers = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase("ru-RU");

  return props.users.filter((user) => {
    const matchesSearch =
      !query ||
      user.name.toLocaleLowerCase("ru-RU").includes(query) ||
      user.phone?.toLocaleLowerCase("ru-RU").includes(query);

    if (!matchesSearch) {
      return false;
    }

    if (activeFilter.value === "barista") {
      return user.role === "barista";
    }

    if (activeFilter.value === "no_role") {
      return !user.role;
    }

    if (activeFilter.value === "blocked") {
      return user.status === "blocked";
    }

    return true;
  });
});

function showSnackbar(message: string): void {
  snackbarMessage.value = message;
  isSnackbarOpen.value = true;
}

function openActionDialog(action: UserAction, user: User): void {
  actionSelection.value = { action, user };
  isActionDialogOpen.value = true;
}

function closeActionDialog(): void {
  isActionDialogOpen.value = false;
  actionSelection.value = null;
}

function addUser(data: AddUserData): void {
  emit("add-user", data);
  showSnackbar(`«${data.name}» добавлен`);
}

function confirmAction(role: UserRole | undefined): void {
  const selection = actionSelection.value;

  if (!selection) {
    return;
  }

  if (selection.action === "change_role" && role) {
    emit("update-role", { userId: selection.user.id, role });
    showSnackbar(
      `Роль изменена на «${role === "barista" ? "Бариста" : "Администратор"}»`,
    );
  }

  if (selection.action === "block" || selection.action === "unblock") {
    emit("toggle-block", { userId: selection.user.id });
    showSnackbar(
      `«${selection.user.name}» ${selection.action === "block" ? "заблокирован" : "разблокирован"}`,
    );
  }

  closeActionDialog();
}
</script>

<style scoped lang="scss">
.users-screen {
  display: flex;
  height: 100%;
  flex-direction: column;
  min-height: 100%;
  overflow: hidden;
  color: var(--expressa-color-text-primary);
  background: var(--expressa-color-surface-raised);
}

.users-screen__controls {
  width: 100%;
  margin: 0 auto;
}

.users-screen__desktop-header {
  display: none;
}

.users-screen__title {
  margin: 0;
  font-size: var(--expressa-font-size-screen-title);
  font-weight: var(--expressa-font-weight-bold);
  line-height: 32px;
}

.users-screen__add-button {
  display: inline-flex;
  align-items: center;
  gap: var(--expressa-space-sm);
}

.users-screen__filters {
  padding: 14px 0 0;
}

.users-screen__search-wrapper {
  position: relative;
  margin-bottom: var(--expressa-space-control-inline);
  margin-inline: var(--expressa-space-md);
}

.users-screen__search {
  min-height: var(--expressa-size-control-min-height);
  padding: var(--expressa-space-control-block)
    var(--expressa-space-control-inline);
  padding-left: 36px;
  background: var(--expressa-color-surface-raised);
  font-size: var(--expressa-font-size-action);
  line-height: 19.5px;
}

.users-screen__search-icon {
  position: absolute;
  z-index: 1;
  top: 9px;
  left: var(--expressa-space-control-inline);
  color: var(--expressa-color-text-muted);
  font-size: 24px;
  line-height: 1;
  pointer-events: none;
}

.users-screen__search:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px rgb(26 26 255 / 20%);
}

.users-screen__content {
  width: 100%;
  min-height: 0;
  flex: 1;
  margin: 0 auto;
  padding: var(--expressa-space-md) var(--expressa-space-md)
    var(--expressa-space-tab-bar-clearance);
  overflow-y: auto;
}

.users-screen__list {
  min-height: 100%;
}

.users-screen__search-label {
  position: absolute;
  width: var(--expressa-size-visually-hidden);
  height: var(--expressa-size-visually-hidden);
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.users-screen__rows {
  overflow: hidden;
  border: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  border-radius: var(--expressa-radius-lg);
  background: var(--expressa-color-surface);
}

.users-screen__mobile-add {
  position: fixed;
  z-index: 30;
  right: var(--expressa-space-md);
  bottom: 76px;
  display: inline-grid;
  width: 48px;
  min-width: 48px;
  height: 48px;
  min-height: 48px;
  place-items: center;
  padding: 0;
  border-radius: var(--expressa-radius-pill);
  color: var(--expressa-color-text-on-accent);
  background: var(--expressa-color-accent);
  box-shadow: var(--expressa-shadow-menu);
  font-size: 28px;
  line-height: 1;
}

@media (min-width: 768px) {
  .users-screen {
    background: var(--expressa-color-surface);
  }

  .users-screen__controls {
    width: min(100%, var(--expressa-size-users-content-max-width));
    padding: 20px var(--expressa-space-lg) 0;
  }

  .users-screen__desktop-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--expressa-space-md);
    margin-bottom: 19px;
  }

  .users-screen__desktop-header .users-screen__add-button {
    min-height: 36px;
    height: 36px;
    padding: 8px var(--expressa-space-md);
    border: var(--expressa-border-width-none);
    border-radius: var(--expressa-radius-md);
    font-size: var(--expressa-font-size-action);
    line-height: 19.5px;
  }

  .users-screen__filters {
    padding: 0;
  }

  .users-screen__search-wrapper {
    margin-inline: 0;
  }

  .users-screen__content {
    width: min(100%, var(--expressa-size-users-content-max-width));
    padding: var(--expressa-space-md) var(--expressa-space-lg)
      var(--expressa-space-lg);
  }

  .users-screen__mobile-add {
    display: none;
  }
}
</style>
