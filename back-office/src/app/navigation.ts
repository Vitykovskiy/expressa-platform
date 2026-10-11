import { computed, onUnmounted, ref } from "vue";
import {
  orderNumberLimit,
  uuidPattern,
} from "../entities/order/order.constants";
import { isOrderStage } from "../entities/order/order.validation";
import type { OrderFilters } from "../entities/order/order.types";
import type { OrderLocation, StaffSection } from "./navigation.types";
import { orderQueryKeys } from "./navigation.constants";

function readLocation(): OrderLocation {
  const query = new URLSearchParams(window.location.search);
  const number = query.get("number");
  const stage = query.get("stage");
  const orderId = query.get("order");
  const section = query.get("section");
  const invalidSection =
    section !== null &&
    section !== "orders" &&
    section !== "availability" &&
    section !== "catalog";
  const invalidNumber =
    number !== null &&
    (number.trim() === "" || number.length > orderNumberLimit);
  const invalidStage = stage !== null && !isOrderStage(stage);
  const invalidOrder = orderId !== null && !uuidPattern.test(orderId);
  const duplicate = [...orderQueryKeys, "section"].some(
    (key) => query.getAll(key).length > 1,
  );

  return {
    href: window.location.href,
    section:
      section === "availability" || section === "catalog" ? section : "orders",
    filters: { number, stage: isOrderStage(stage) ? stage : null },
    orderId,
    error:
      invalidNumber ||
      invalidStage ||
      invalidOrder ||
      invalidSection ||
      duplicate
        ? "Параметры адреса недопустимы. Сбросьте фильтры."
        : "",
  };
}

export function useOrderNavigation() {
  const location = ref(readLocation());

  function traverse() {
    location.value = readLocation();
  }

  function commit(filters: OrderFilters, orderId: string | null) {
    const url = new URL(window.location.href);

    for (const key of orderQueryKeys) {
      url.searchParams.delete(key);
    }

    if (filters.number !== null) {
      url.searchParams.set("number", filters.number);
    }

    if (filters.stage !== null) {
      url.searchParams.set("stage", filters.stage);
    }

    if (orderId !== null) {
      url.searchParams.set("order", orderId);
    }

    window.history.pushState(null, "", url);
    traverse();
  }

  function sectionHref(section: StaffSection, originalOrderId?: string) {
    const url = new URL(location.value.href);

    url.searchParams.delete("section");

    if (section !== "orders") url.searchParams.set("section", section);
    if (originalOrderId !== undefined)
      url.searchParams.set("order", originalOrderId);

    return `${url.pathname}${url.search}${url.hash}`;
  }

  function activateSection(section: StaffSection, originalOrderId?: string) {
    window.history.pushState(null, "", sectionHref(section, originalOrderId));
    traverse();
  }

  function resetAddress() {
    const url = new URL(window.location.href);

    for (const key of [...orderQueryKeys, "section"])
      url.searchParams.delete(key);
    if (location.value.section !== "orders")
      url.searchParams.set("section", location.value.section);

    window.history.pushState(null, "", url);
    traverse();
  }

  function search(filters: OrderFilters) {
    commit(filters, null);
  }

  function select(id: string) {
    commit(location.value.filters, id);
  }

  function back() {
    commit(location.value.filters, null);
  }

  window.addEventListener("popstate", traverse);
  onUnmounted(() => window.removeEventListener("popstate", traverse));

  return {
    location: computed(() => location.value),
    search,
    select,
    back,
    sectionHref,
    activateSection,
    resetAddress,
  };
}
