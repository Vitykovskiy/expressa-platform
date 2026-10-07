import { shallowRef } from "vue";

export function dialogHost() {
  return { open: shallowRef(true) };
}
