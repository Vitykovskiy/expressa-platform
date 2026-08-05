export const catalogAdvisoryLockKey = 1_904_266_868;

export const catalogCommandAdvisoryLockSql = 'SELECT pg_advisory_xact_lock($1)';
export const publicMenuAdvisoryLockSql = 'SELECT pg_advisory_xact_lock_shared($1)';
