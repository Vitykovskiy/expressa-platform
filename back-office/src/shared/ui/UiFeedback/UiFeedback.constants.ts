import {
  mdiAlertCircleOutline,
  mdiCheckCircleOutline,
  mdiClockOutline,
  mdiInboxOutline,
} from "@mdi/js";
import type { FeedbackKind } from "./UiFeedback.types";

export const feedbackIcons: Record<FeedbackKind, string> = {
  loading: mdiClockOutline,
  empty: mdiInboxOutline,
  error: mdiAlertCircleOutline,
  success: mdiCheckCircleOutline,
};
