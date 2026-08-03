import type { Component } from "vue";
import type { AuthState, AuthStep } from "../../shared/model/customer.types";

export type AuthScreenContent = "form" | "loading" | "success";

export type AuthScreenPresentation = Record<
  AuthStep,
  {
    icon: Component;
    iconTone: "default" | "success";
    content: AuthScreenContent;
    title: string;
    description: (state: AuthState) => string;
  }
>;

export interface AuthScreenProps {
  state: AuthState;
}

export type AuthScreenEmits = {
  updatePhone: [phone: string];
  sendCode: [];
  updateOtp: [otp: string];
  verifyOtp: [otp: string];
  updateName: [name: string];
  submitName: [];
  backToPhone: [];
  continue: [];
};
