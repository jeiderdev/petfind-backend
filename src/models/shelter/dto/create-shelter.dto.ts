import { IsOptional, IsString } from 'class-validator';

export class CreateShelterDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  address: string;

  @IsString()
  city: string;

  // latitude?: number;
  // longitude?: number;

  @IsString()
  contactEmail: string;

  @IsString()
  contactPhone: string;

  @IsOptional()
  @IsString()
  comments?: string;
}
