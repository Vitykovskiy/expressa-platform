export interface OtpFormProps {
  phone: string;
  code: string;
  requestedPhone: string | null;
  phoneError: string;
  codeError: string;
  error: string;
  busy: boolean;
  cooldown: number;
  verifyCooldown: number;
}
export interface OtpFormEmits {
  phone: [value: string];
  code: [value: string];
  send: [];
  verify: [];
  changePhone: [];
}
