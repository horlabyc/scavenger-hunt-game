/** Verify an admin password against the ADMIN_PASSWORD env var. */
export function isAdminPassword(password: unknown): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return typeof password === 'string' && password === expected;
}
