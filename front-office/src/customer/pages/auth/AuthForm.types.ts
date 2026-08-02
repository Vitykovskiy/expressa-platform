import type { AuthState } from "../../shared/model/customer.types";

export interface AuthFormProps {
  state: AuthState;
}

export type AuthFormEmits = {
  updatePhone: [phone: string];
  sendCode: [];
  updateOtp: [otp: string];
  verifyOtp: [otp: string];
  updateName: [name: string];
  submitName: [];
  backToPhone: [];
  retryOtp: [];
  reset: [];
};
