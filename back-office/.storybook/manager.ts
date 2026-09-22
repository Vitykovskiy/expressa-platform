import { addons } from "storybook/manager-api";

addons.setConfig({
  sidebar: {
    showRoots: true,
  },
});

addons.register("expressa/preview-skip-focus", () => {
  window.addEventListener("hashchange", () => {
    if (window.location.hash !== "#storybook-preview-wrapper") return;

    window.requestAnimationFrame(() => {
      document.getElementById("storybook-preview-iframe")?.focus();
    });
  });
});
