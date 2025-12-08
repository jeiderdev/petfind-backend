import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { getUserFronRequest } from '../utils';

export const ROLES_KEY = 'roles';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get<string[]>(
      ROLES_KEY,
      context.getHandler(),
    );
    if (!requiredRoles || requiredRoles.length === 0) {
      return Promise.resolve(true);
    }
    const request: Request = context.switchToHttp().getRequest();
    const user = getUserFronRequest(request);
    if (!user) {
      return Promise.resolve(false);
    }
    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      return Promise.resolve(false);
    }
    return Promise.resolve(true);
  }
}
