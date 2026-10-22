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
    @after-enter="focusName"
    @update:model-value="requestClose"
  >
    <form
      ref="form"
      class="add-user-dialog"
      :class="dialogClass"
      :aria-busy="submitting"
      @submit.prevent="submit"
    >
      <h2 :id="titleId" class="add-user-dialog__title">Новый пользователь</h2>
      <div class="add-user-dialog__fields">
        <OperationsInput
          :model-value="props.draft.name"
          label="Имя"
          placeholder="Например: Иван Петров"
          autocomplete="name"
          autofocus
          required
          :disabled="locked"
          @update:model-value="updateName"
        />
        <OperationsInput
          :model-value="props.draft.phone"
          type="tel"
          label="Телефон"
          placeholder="+7 900 000-00-00"
          autocomplete="tel"
          required
          :disabled="locked"
          @update:model-value="updatePhone"
        />
        <OperationsInput
          :model-value="props.draft.role"
          type="select"
          label="Роль"
          :options="USER_ROLE_OPTIONS"
          :disabled="locked"
          @update:model-value="selectRole"
        />
        <p class="add-user-dialog__help">
          Администраторы имеют полный доступ ко всем функциям
        </p>
        <p v-if="props.error" class="add-user-dialog__error" role="alert">
          {{ props.error }}
        </p>
      </div>
      <footer class="add-user-dialog__actions">
        <OperationsButton
          label="Отмена"
          kind="ghost"
          compact
          :disabled="submitting"
          @click="emit('close')"
        />
        <OperationsButton
          :label="submitLabel"
          type="submit"
          compact
          :disabled="cannotSubmit"
        />
      </footer>
    </form>
  </VDialog>
</template>

<script setup lang="ts">
import {
  computed,
  onMounted,
  onScopeDispose,
  shallowRef,
  useId,
  useTemplateRef,
} from "vue";
import { VDialog } from "vuetify/components/VDialog";
import OperationsInput from "../../../shared/ui/operations/OperationsInput.vue";
import OperationsButton from "../../../shared/ui/operations/OperationsButton.vue";
import {
  MOBILE_SHEET_QUERY,
  MODAL_SHEET_STYLE,
} from "../../../shared/ui/operations/OperationsModal.constants";
import {
  USER_DIALOG_CONTENT,
  USER_DIALOG_PHASE_LABELS,
  USER_ROLE_OPTIONS,
} from "./Users.constants";
import type { AddUserDialogProps, AddUserDialogEmits } from "./Users.types";

const props = defineProps<AddUserDialogProps>();
const emit = defineEmits<AddUserDialogEmits>();
const form = useTemplateRef<globalThis.HTMLFormElement>("form");
const titleId = useId();
const dialogAttributes = { "aria-labelledby": titleId };
const mobileViewport = shallowRef(false);
let stopWatchingViewport: (() => void) | null = null;

const dialogWidth = computed(() => (mobileViewport.value ? "100vw" : 448));
const dialogMaxWidth = computed(() =>
  mobileViewport.value ? "100vw" : "calc(100vw - 32px)",
);
const dialogClass = computed(() => ({
  "add-user-dialog--sheet": mobileViewport.value,
}));

const contentProps = computed(() => ({
  style: mobileViewport.value ? MODAL_SHEET_STYLE : USER_DIALOG_CONTENT.style,
  "aria-labelledby": titleId,
}));
const submitting = computed(
  () => props.phase === "sending" || props.phase === "checking",
);
const locked = computed(() => props.phase !== "editing");
const cannotSubmit = computed(
  () =>
    submitting.value ||
    (!locked.value && (!props.draft.name.trim() || !props.draft.phone.trim())),
);
const submitLabel = computed(() =>
  props.phase === "editing"
    ? "Добавить"
    : USER_DIALOG_PHASE_LABELS[props.phase],
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

function focusName() {
  if (!locked.value) {
    form.value
      ?.querySelector<globalThis.HTMLInputElement>('input[autocomplete="name"]')
      ?.focus({ preventScroll: true });
  }
}

function updateName(name: string) {
  emit("updateDraft", { ...props.draft, name });
}

function updatePhone(phone: string) {
  emit("updateDraft", { ...props.draft, phone });
}

function selectRole(value: string) {
  if (value === "barista" || value === "administrator") {
    emit("updateDraft", { ...props.draft, role: value });
  }
}

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
  } else if (props.phase === "checked") {
    emit("close");
  } else {
    emit("submit", { ...props.draft });
  }
}
</script>

<style scoped>
.add-user-dialog {
  width: 100%;
  padding: 24px;
  overflow-y: auto;
  border-radius: var(--radius-surface);
  background: var(--color-surface);
  font-family: Inter, sans-serif;
}
.add-user-dialog__title {
  margin: 0;
  padding-bottom: 20px;
  color: var(--color-foreground);
  font-size: 18px;
  font-weight: 600;
  line-height: 28px;
}
.add-user-dialog__fields {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 24px;
}
.add-user-dialog__help {
  margin: 0;
  color: var(--color-foreground-muted);
  font-size: 12px;
  line-height: 16px;
}
.add-user-dialog__error {
  margin: 0;
  color: var(--color-danger);
  font-size: 13px;
  line-height: 19.5px;
}
.add-user-dialog__actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
}
.add-user-dialog--sheet {
  max-height: 100dvh;
}
</style>
