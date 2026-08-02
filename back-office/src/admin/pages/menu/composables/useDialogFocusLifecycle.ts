import { nextTick, shallowRef } from "vue";

function isConnectedFocusableElement(value: unknown): value is HTMLElement {
  return (
    typeof globalThis.HTMLElement === "function" &&
    value instanceof globalThis.HTMLElement &&
    typeof value.focus === "function"
  );
}

export function useDialogFocusLifecycle() {
  const returnFocusTarget = shallowRef<HTMLElement | null>(null);

  function captureReturnFocus(): void {
    const activeElement = globalThis.document?.activeElement;
    returnFocusTarget.value = isConnectedFocusableElement(activeElement)
      ? activeElement
      : null;
  }

  function restoreFocus(): void {
    const focusTarget = returnFocusTarget.value;
    returnFocusTarget.value = null;

    if (!focusTarget?.isConnected) return;

    void nextTick(() =>
      nextTick(() => {
        if (focusTarget.isConnected) focusTarget.focus();
      }),
    );
  }

  return { captureReturnFocus, restoreFocus };
}
