export interface AdminRequestStatePanelProps {
  actionLabel: string;
  code?: string;
  pending?: boolean;
  pendingLabel?: string;
  requestId?: string;
  title: string;
}

export interface AdminRequestStatePanelEmits {
  action: [];
}
