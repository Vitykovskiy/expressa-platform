export const accountMembershipColumns = `customers.registered_at,
  employees.role AS employee_role, employees.access_disabled_at`;

export const accountMembershipJoins = `LEFT JOIN customers ON customers.user_id = users.id
  LEFT JOIN employees ON employees.user_id = users.id`;
