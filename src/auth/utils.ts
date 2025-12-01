import { SystemRoles } from 'src/common/enums/system-role.enum';

export interface UserPayload {
  id: number;
  email: string;
  role: string;
  [key: string]: unknown;
}

export function isUserPayload(obj: unknown): obj is UserPayload {
  if (!obj) return false;
  if (typeof obj !== 'object') return false;
  return (
    'id' in obj &&
    typeof obj.id === 'number' &&
    'email' in obj &&
    typeof obj.email === 'string' &&
    'role' in obj &&
    typeof obj.role === 'string'
  );
}

export function getUserFronRequest(req: Request): UserPayload | null {
  const user: unknown = req['user'];
  if (isUserPayload(user)) {
    return user;
  }
  return null;
}

export const DEFAULT_SYSTEM_ROLE: SystemRoles = SystemRoles.USER;
