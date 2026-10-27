import type {
  Employee,
  EmployeeDto,
  Customer,
  CustomerDto,
} from "./users.types";

export function mapEmployee(dto: EmployeeDto): Employee {
  return {
    id: dto.id,
    name: dto.name,
    phone: dto.phoneE164,
    role: dto.role,
    accessEnabled: dto.accessEnabled,
    accountBlocked: dto.accountBlocked,
  };
}

export function mapCustomer(dto: CustomerDto): Customer {
  return {
    id: dto.id,
    name: dto.name,
    phone: dto.phoneE164,
    registeredAt: dto.registeredAt,
  };
}
