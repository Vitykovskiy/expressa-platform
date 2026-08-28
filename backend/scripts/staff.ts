import { Pool } from 'pg';
import { validateEnvironment } from '../src/platform/config/environment';

const phonePattern = /^\+7\d{10}$/;
const staffRoles = ['barista', 'administrator', 'customer'] as const;
type StaffRole = (typeof staffRoles)[number];

function exitWithUsage(): never {
  process.stderr.write('Usage: npm run staff -- upsert --phone +7XXXXXXXXXX --role barista|administrator|customer\n');
  process.exit(2);
}

function isStaffRole(value: string): value is StaffRole {
  return staffRoles.includes(value as StaffRole);
}

function parseCommandArguments(): { phone: string; role: StaffRole } {
  const arguments_ = process.argv.slice(2);
  if (arguments_[0] !== 'upsert' || arguments_.length !== 5) {
    return exitWithUsage();
  }

  let phone: string | undefined;
  let role: StaffRole | undefined;

  for (let index = 1; index < arguments_.length; index += 2) {
    const name = arguments_[index];
    const value = arguments_[index + 1];
    if (name === undefined || value === undefined || value.startsWith('--')) {
      return exitWithUsage();
    }

    if (name === '--phone' && phone === undefined) {
      phone = value;
      continue;
    }
    if (name === '--role' && role === undefined && isStaffRole(value)) {
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
    await pool.query(
      `INSERT INTO users (phone_e164, role) VALUES ($1, $2)
       ON CONFLICT (phone_e164) DO UPDATE SET role = EXCLUDED.role, updated_at = CURRENT_TIMESTAMP
      `,
      [phone, role],
    );
  } finally {
    await pool.end();
  }
}

void main();
