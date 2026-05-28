import { useAuth } from '../../hooks/useAuth';

/**
 * Hook that exposes helpers for checking the authenticated staff member's
 * permissions (injected into the JWT at login from their assigned StaffRole).
 */
export function useStaffPermission() {
  const { user } = useAuth();
  const permissions = user?.permissions ?? [];

  /** True if the user has the given permission key. */
  const has = (key) => permissions.includes(key);

  /** True if the user has at least one of the given keys. */
  const hasAny = (keys) => keys.some((k) => permissions.includes(k));

  /** True if the user has all of the given keys. */
  const hasAll = (keys) => keys.every((k) => permissions.includes(k));

  return { has, hasAny, hasAll, permissions };
}
