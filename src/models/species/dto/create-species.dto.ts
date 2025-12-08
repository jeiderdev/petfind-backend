import { IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateSpeciesDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsUrl()
  image: string;
}
