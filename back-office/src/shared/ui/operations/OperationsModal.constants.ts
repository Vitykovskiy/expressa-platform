export const MODAL_DEFAULTS = {
  description: "",
  width: 448,
  layout: "form",
  persistent: false,
  bottomSheet: false,
} as const;

export const MODAL_MAX_WIDTH = "calc(100vw - 32px)";
export const MODAL_CONTENT_STYLE = {
  margin: "16px",
  maxHeight: "calc(100% - 32px)",
};

export const MOBILE_SHEET_QUERY = "(max-width: 767px)";
export const MODAL_SHEET_STYLE = {
  position: "fixed",
  bottom: "0",
  left: "0",
  right: "0",
  margin: "0",
  maxHeight: "100dvh",
  width: "100vw",
  maxWidth: "100vw",
};
