import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateSystemRoleDto } from './create-system-role.dto';

export class UpdateSystemRoleDto extends PartialType(
  OmitType(CreateSystemRoleDto, ['name'] as const),
) {}
