import { SystemRoles } from 'src/common/enums/system-role.enum';

export interface UserPayload {
  id: number;
  email: string;
  role: string;
  [key: string]: unknown;
}

export function isUserPayload(obj: unknown): obj is UserPayload {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    typeof obj.id === 'number' &&
    'email' in obj &&
    typeof obj.email === 'string' &&
    'role' in obj &&
    typeof obj.role === 'string'
  );
}

export const DEFAULT_SYSTEM_ROLE: SystemRoles = SystemRoles.USER;
