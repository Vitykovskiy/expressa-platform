export const userRoles = ["customer", "barista", "administrator"] as const;

export const rolePolicies = {
  Customer: ["customer"],
  CustomerOrBarista: ["customer", "barista"],
  Staff: ["barista", "administrator"],
  Administrator: ["administrator"],
} as const;
