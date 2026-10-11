export const availabilityUuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const availabilityPhonePattern = /^\+[1-9]\d{1,14}$/;
export const availabilityDatePattern =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
export const availabilityInt32Maximum = 2147483647;
export const availabilityEndpoint = "/api/v2/backoffice/availability";
export const intakeEndpoint = "/api/v2/backoffice/service/intake";
