export type BrowserIssue = {
  source: "console" | "page" | "request" | "response";
  text: string;
};
