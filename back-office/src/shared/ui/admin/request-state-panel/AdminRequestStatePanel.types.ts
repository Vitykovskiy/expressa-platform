export type AdminRequestStatePanelAnnouncementMode =
  "none" | "status" | "alert";

export interface AdminRequestStatePanelProps {
  actionLabel: string;
  announcementMode?: AdminRequestStatePanelAnnouncementMode;
  code?: string;
  focusOnAppear?: boolean;
  pending?: boolean;
  pendingLabel?: string;
  requestId?: string;
  title: string;
}

export interface AdminRequestStatePanelEmits {
  action: [];
}
