export type BrowserIssue = {
  source: "console" | "page" | "request" | "response";
  text: string;
};
export type CurrentUser = { id: string };

export type CheckoutOrderStage = "ISSUED";
