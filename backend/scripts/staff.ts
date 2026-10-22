import { Pool } from "pg";
import { randomUUID } from "node:crypto";
import { validateEnvironment } from "../src/platform/config/environment";
import { PostgresStaffUsersRepository } from "../src/staff-users/adapters/postgres-staff-users.repository";
import { assertAccessChange } from "../src/staff-users/domain/staff-user.policy";
import { phonePattern, staffRoles } from "./staff.constants";
import type { StaffCommand, StaffRole } from "./staff.types";

function exitWithUsage(): never {
  process.stderr.write(
    "Usage: npm run staff -- upsert --phone +7XXXXXXXXXX --role barista|administrator|customer\n",
  );
  process.exit(2);
}

function isStaffRole(value: string): value is StaffRole {
  return staffRoles.some((role) => role === value);
}

function parseCommandArguments(): StaffCommand {
  const arguments_ = process.argv.slice(2);
  if (arguments_[0] !== "upsert" || arguments_.length !== 5) {
    return exitWithUsage();
  }

  let phone: string | undefined;
  let role: StaffRole | undefined;

  for (let index = 1; index < arguments_.length; index += 2) {
    const name = arguments_[index];
    const value = arguments_[index + 1];
    if (name === undefined || value === undefined || value.startsWith("--")) {
      return exitWithUsage();
    }

    if (name === "--phone" && phone === undefined) {
      phone = value;
      continue;
    }
    if (name === "--role" && role === undefined && isStaffRole(value)) {
      role = value;
      continue;
    }

    return exitWithUsage();
  }

  if (phone === undefined || role === undefined || !phonePattern.test(phone)) {
    return exitWithUsage();
  }

  return { phone, role };
}

async function main(): Promise<void> {
  validateEnvironment(process.env);
  const { phone, role } = parseCommandArguments();
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const users = new PostgresStaffUsersRepository(() => pool);
    await users.run(async (repository) => {
      const requestId = "operations:" + randomUUID();
      const creation = await repository.findOrCreateForOperations(phone, role);
      const before = creation.user;
      if (creation.created) {
        const after = creation.user;
        await repository.writeAudit({
          actorId: after.id,
          requestId,
          action: "USER_CREATED",
          before: null,
          after,
        });
        return;
      }
      if (before.role === role) {
        return;
      }
      assertAccessChange(
        before,
        "operations",
        role,
        before.blocked,
        await repository.countActiveAdministrators(),
      );
      const after = await repository.changeRole(before.id, role);
      await repository.revokeAccess(before.id);
      await repository.writeAudit({
        actorId: before.id,
        requestId,
        action: "USER_ROLE_CHANGED",
        before,
        after,
      });
    });
  } finally {
    await pool.end();
  }
}

void main();
