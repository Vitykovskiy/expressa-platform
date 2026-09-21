import { computed, ref } from "vue";

export function useVirtualSiblingRows(
  total: () => number,
  heightAt: (index: number) => number,
  threshold = 100,
  overscanItems = 4,
) {
  const scrollTop = ref(0);
  const viewportHeight = ref(0);
  const offsets = computed(() => {
    const result = [0];
    for (let index = 0; index < total(); index += 1)
      result.push(result[index]! + heightAt(index));
    return result;
  });
  const enabled = computed(() => total() > threshold);
  function firstAfter(offset: number): number {
    const values = offsets.value;
    let low = 0;
    let high = total();
    while (low < high) {
      const middle = Math.floor((low + high) / 2);
      if (values[middle + 1]! > offset) high = middle;
      else low = middle + 1;
    }
    return low;
  }
  const start = computed(() =>
    enabled.value
      ? Math.max(0, firstAfter(scrollTop.value) - overscanItems)
      : 0,
  );
  const end = computed(() =>
    enabled.value
      ? Math.min(
          total(),
          firstAfter(scrollTop.value + viewportHeight.value) +
            overscanItems +
            1,
        )
      : total(),
  );
  function scrollTopForIndex(
    index: number,
    current: number,
    viewport: number,
  ): number {
    const top = offsets.value[index] ?? 0;
    const bottom = offsets.value[index + 1] ?? top;
    if (top < current) return top;
    if (bottom > current + viewport) return Math.max(0, bottom - viewport);
    return current;
  }
  return {
    start,
    end,
    beforeSize: computed(() => offsets.value[start.value] ?? 0),
    afterSize: computed(
      () => (offsets.value[total()] ?? 0) - (offsets.value[end.value] ?? 0),
    ),
    totalSize: computed(() => offsets.value[total()] ?? 0),
    scrollTop,
    viewportHeight,
    scrollTopForIndex,
  };
}
