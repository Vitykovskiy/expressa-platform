import { onScopeDispose, readonly, shallowRef } from "vue";
import type { SectionIntent } from "./navigation.types";

export function readSectionIntent(search: string): SectionIntent {
  const values = new URLSearchParams(search).getAll("section");

  if (values.length === 0) {
    return { kind: "valid", section: "orders" };
  }

  if (values.length !== 1) {
    return { kind: "invalid" };
  }

  const section = values[0];

  if (
    section === "orders" ||
    section === "availability" ||
    section === "catalog" ||
    section === "users" ||
    section === "settings"
  ) {
    return { kind: "valid", section };
  }

  return { kind: "invalid" };
}

export function useSectionIntent() {
  const intent = shallowRef(readSectionIntent(window.location.search));

  function syncIntent() {
    intent.value = readSectionIntent(window.location.search);
  }

  window.addEventListener("popstate", syncIntent);
  onScopeDispose(() => window.removeEventListener("popstate", syncIntent));

  return readonly(intent);
}
