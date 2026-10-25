<template>
  <VDialog
    v-bind="dialogAttributes"
    :model-value="true"
    :width="dialogWidth"
    :max-width="dialogMaxWidth"
    :persistent="submitting"
    :opacity="0.4"
    scrim="#000000"
    :transition="false"
    :close-on-back="false"
    :content-props="contentProps"
    @update:model-value="requestClose"
  >
    <form
      class="user-access-dialog"
      :class="dialogClass"
      :aria-busy="submitting"
      @submit.prevent="submit"
    >
      <header class="user-access-dialog__header">
        <h2 :id="titleId" class="user-access-dialog__title">{{ title }}</h2>
        <button
          type="button"
          class="user-access-dialog__close"
          aria-label="Закрыть"
          :disabled="submitting"
          @click="emit('close')"
        >
          <img :src="USER_ASSETS.close" alt="" />
        </button>
      </header>
      <p class="user-access-dialog__identity">{{ props.user.name }}</p>
      <div class="user-access-dialog__body">
        <fieldset
          v-if="isRole"
          class="user-access-dialog__roles"
          :disabled="locked"
          aria-label="Роль пользователя"
        >
          <label
            v-for="option in roleOptions"
            :key="option.value"
            class="user-access-dialog__role"
            :class="option.className"
          >
            <input
              :checked="props.selectedRole === option.value"
              class="user-access-dialog__radio"
              type="radio"
              name="user-role"
              :value="option.value"
              @change="emit('selectRole', option.value)"
            />
            <img :src="option.icon" alt="" />
            <span class="user-access-dialog__role-copy"
              ><span class="user-access-dialog__role-name">{{
                option.label
              }}</span
              ><span class="user-access-dialog__role-description">{{
                option.description
              }}</span></span
            >
          </label>
        </fieldset>
        <p v-else class="user-access-dialog__description" :class="warningClass">
          {{ description }}
        </p>
        <p v-if="props.error" class="user-access-dialog__error" role="alert">
          {{ props.error }}
        </p>
      </div>
      <footer class="user-access-dialog__actions">
        <button
          type="button"
          class="user-access-dialog__action user-access-dialog__action--cancel"
          :disabled="submitting"
          @click="emit('close')"
        >
          Отмена
        </button>
        <button
          type="submit"
          class="user-access-dialog__action"
          :class="submitClass"
          :disabled="cannotSubmit"
        >
          {{ submitLabel }}
        </button>
      </footer>
    </form>
  </VDialog>
</template>

<script setup lang="ts">
import { computed, onMounted, onScopeDispose, shallowRef, useId } from "vue";
import { VDialog } from "vuetify/components/VDialog";
import {
  MOBILE_SHEET_QUERY,
  MODAL_SHEET_STYLE,
} from "../../../shared/ui/operations/OperationsModal.constants";
import {
  USER_ASSETS,
  USER_CONFIRMATION_TITLES,
  USER_DIALOG_CONTENT,
  USER_DIALOG_PHASE_LABELS,
  USER_ROLE_OPTIONS,
} from "./Users.constants";
import type {
  UserAccessDialogProps,
  UserAccessDialogEmits,
} from "./Users.types";

const props = defineProps<UserAccessDialogProps>();
const emit = defineEmits<UserAccessDialogEmits>();

const titleId = useId();
const dialogAttributes = { "aria-labelledby": titleId };
const mobileViewport = shallowRef(false);
let stopWatchingViewport: (() => void) | null = null;

const dialogWidth = computed(() => (mobileViewport.value ? "100vw" : 400));
const dialogMaxWidth = computed(() =>
  mobileViewport.value ? "100vw" : "calc(100vw - 32px)",
);

const dialogClass = computed(() => ({
  "user-access-dialog--sheet": mobileViewport.value,
}));

const contentProps = computed(() => ({
  style: mobileViewport.value ? MODAL_SHEET_STYLE : USER_DIALOG_CONTENT.style,
  "aria-labelledby": titleId,
}));

const title = computed(() => USER_CONFIRMATION_TITLES[props.kind]);
const isRole = computed(() => props.kind === "role");
const isBlock = computed(() => props.kind === "block");

const warningClass = computed(() => ({
  "user-access-dialog__description--warning": isBlock.value,
}));

const submitClass = computed(() => ({
  "user-access-dialog__action--danger": isBlock.value,
}));

const submitting = computed(
  () => props.phase === "sending" || props.phase === "checking",
);

const locked = computed(() => props.phase !== "editing");

const cannotSubmit = computed(() => {
  if (locked.value) {
    // Проверка неизвестного исхода доступна и без редактирования роли.
    return submitting.value;
  }

  return isRole.value && props.selectedRole === null;
});

const description = computed(() =>
  isBlock.value
    ? "Пользователь потеряет доступ к системе. Его данные сохранятся."
    : "Пользователь снова получит доступ к системе.",
);

const submitLabel = computed(() => {
  if (props.phase !== "editing") {
    return USER_DIALOG_PHASE_LABELS[props.phase];
  }

  return isRole.value ? "Назначить" : title.value;
});

const roleOptions = computed(() =>
  USER_ROLE_OPTIONS.map((option) => {
    const isSelected = props.selectedRole === option.value;
    const administratorSelected = props.selectedRole === "administrator";
    let icon: string = USER_ASSETS.radioNeutral;

    if (isSelected) {
      icon = USER_ASSETS.radioSelected;
    } else if (option.value === "barista" && administratorSelected) {
      icon = USER_ASSETS.radioEmpty;
    }

    return {
      ...option,
      description:
        option.value === "barista" ? "Заказы и доступность" : "Полный доступ",
      className: {
        "user-access-dialog__role--selected": isSelected,
        "user-access-dialog__role--administrator":
          administratorSelected && option.value === "administrator",
      },
      icon,
    };
  }),
);

onMounted(() => {
  const viewport = globalThis.matchMedia(MOBILE_SHEET_QUERY);
  const updateViewport = () => {
    mobileViewport.value = viewport.matches;
  };

  updateViewport();
  viewport.addEventListener("change", updateViewport);
  stopWatchingViewport = () =>
    viewport.removeEventListener("change", updateViewport);
});

onScopeDispose(() => {
  stopWatchingViewport?.();
});

function requestClose(open: boolean) {
  if (!open && !submitting.value) {
    emit("close");
  }
}

function submit() {
  if (cannotSubmit.value) {
    return;
  }

  if (props.phase === "unknown") {
    emit("inspect");

    return;
  }

  if (props.phase === "checked") {
    emit("close");

    return;
  }

  if (isRole.value && props.selectedRole !== null) {
    emit("assignRole", props.user.id, props.selectedRole);

    return;
  }

  emit("setBlocked", props.user.id, isBlock.value);
}
</script>

<style scoped>
/* Локальная геометрия и типографика диалога: в теме нет шкал отступов и текста. */
.user-access-dialog {
  width: 100%;
  padding: 20px;
  overflow-y: auto;
  border-radius: var(--radius-surface);
  background: var(--color-surface);
  color: var(--color-foreground);
  font-family: Inter, sans-serif;
}
.user-access-dialog__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 12px;
}
.user-access-dialog__title {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  line-height: 25.5px;
  overflow-wrap: anywhere;
}
.user-access-dialog__close {
  display: flex;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}
.user-access-dialog__identity {
  margin: 0;
  padding-bottom: 16px;
  color: var(--color-foreground-muted);
  font-size: 13px;
  line-height: 19.5px;
  overflow-wrap: anywhere;
}
.user-access-dialog__body {
  padding-bottom: 20px;
}
.user-access-dialog__roles {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  border: 0;
}
.user-access-dialog__role {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  cursor: pointer;
}
.user-access-dialog__role--selected {
  background: var(--operations-created-surface);
}
.user-access-dialog__role--administrator {
  border-color: var(--color-primary);
}
.user-access-dialog__role:focus-within {
  /* Контур собственной radio-карточки не имеет отдельного токена темы. */
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
.user-access-dialog__radio {
  /* Нативное radio остаётся фокусируемым; видимое состояние задаёт SVG рядом. */
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}
.user-access-dialog__role-copy {
  display: flex;
  flex-direction: column;
}
.user-access-dialog__role-name {
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
}
.user-access-dialog__role-description {
  color: var(--color-foreground-muted);
  font-size: 12px;
  line-height: 16px;
}
.user-access-dialog__description {
  margin: 0;
  color: var(--color-foreground-muted);
  font-size: 13px;
  line-height: 19.5px;
}
.user-access-dialog__description--warning {
  padding: 8px 12px;
  /* Радиус этой вложенной плашки отличается от радиуса полей и поверхности. */
  border-radius: 8px;
  background: var(--operations-danger-surface);
  color: var(--color-danger);
}
.user-access-dialog__error {
  margin: 12px 0 0;
  color: var(--color-danger);
  font-size: 13px;
  line-height: 19.5px;
}
.user-access-dialog__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}
.user-access-dialog__action {
  padding: 10px 16px;
  border: 1px solid transparent;
  border-radius: var(--radius-control);
  background: var(--color-primary);
  color: var(--color-on-primary);
  font:
    500 14px/20px Inter,
    sans-serif;
  cursor: pointer;
}
.user-access-dialog__action--cancel {
  border-color: var(--color-border);
  background: var(--color-surface);
  color: var(--color-foreground);
}
.user-access-dialog__action--danger {
  background: var(--color-danger);
}
.user-access-dialog__action:disabled,
.user-access-dialog__close:disabled {
  opacity: var(--opacity-disabled);
  cursor: default;
}
.user-access-dialog--sheet {
  max-height: 100dvh;
}
</style>
