import { IsNumber, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateBreedDto {
  @IsNumber()
  speciesId: number;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsUrl()
  image: string;
}
