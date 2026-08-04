export const userRoles = ['customer', 'barista', 'administrator'] as const;

export const rolePolicies = {
  Customer: ['customer'],
  Staff: ['barista', 'administrator'],
  Administrator: ['administrator'],
} as const;
