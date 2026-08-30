export type SmsRuConfiguration = {
  apiId: string;
  from: string;
};

export type SmsRuMessageResponse = {
  status: "OK";
  status_code: 100;
  sms_id: string;
};
