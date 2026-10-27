export const userRoles = ["customer", "barista", "administrator"] as const;

export const rolePolicies = [
  "CustomerContext",
  "Customer",
  "CustomerOrBarista",
  "Staff",
  "Administrator",
] as const;
