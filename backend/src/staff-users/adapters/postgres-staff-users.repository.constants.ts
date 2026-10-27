export const staffUserColumns = `users.id, users.name, users.phone_e164,
  (users.blocked_at IS NOT NULL) AS blocked, users.created_at, users.updated_at,
  customers.registered_at, employees.role AS employee_role, employees.access_disabled_at`;
export const staffMembershipJoins = `LEFT JOIN customers ON customers.user_id = users.id
  LEFT JOIN employees ON employees.user_id = users.id`;
export const employeeColumns = `users.id, users.name, users.phone_e164,
  employees.role, (employees.access_disabled_at IS NULL) AS access_enabled,
  (users.blocked_at IS NOT NULL) AS account_blocked, employees.created_at, employees.updated_at`;
