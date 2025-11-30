import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { RolesGuard } from '../guards/roles.guard';
import { JwtGuard } from '../guards/jwt.guard';

export interface AuthDecoratorOptions {
  roles?: string[];
}

export function Auth(options: AuthDecoratorOptions = {}) {
  const { roles = [] } = options;
  const rolesMetadata = SetMetadata('roles', roles);
  return applyDecorators(rolesMetadata, UseGuards(JwtGuard, RolesGuard));
}
