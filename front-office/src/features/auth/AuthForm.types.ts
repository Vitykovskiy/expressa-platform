import type { AuthState } from "@/entities/customer/model/customer.types";

export interface AuthFormProps {
  state: AuthState;
  otp: string;
  resendRemainingSeconds: number;
  isLoading?: boolean;
}

export type AuthFormEmits = {
  updatePhone: [phone: string];
  sendCode: [];
  updateOtp: [otp: string];
  verifyOtp: [otp: string];
  updateName: [name: string];
  submitName: [];
  backToPhone: [];
};
