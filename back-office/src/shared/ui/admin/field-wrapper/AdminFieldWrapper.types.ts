export interface AdminFieldWrapperProps {
  error?: string;
  id: string;
  label: string;
  layout?: "row" | "stack" | "table";
  required?: boolean;
}

export interface AdminFieldWrapperSlotProps {
  controlId: string;
  describedBy?: string;
  invalid: boolean;
  labelId: string;
  required: boolean;
}
