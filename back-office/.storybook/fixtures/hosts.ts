import { shallowRef } from "vue";

export function dialogHost() {
  const open = shallowRef(true);
  const emitted = shallowRef("Нет событий");
  function reopen(): void {
    open.value = true;
    emitted.value = "Нет событий";
  }
  function record(name: string): void {
    emitted.value = name;
  }
  return { open, emitted, reopen, record };
}
