import { IsOptional, IsString } from 'class-validator';

export class CreateSystemRoleDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
