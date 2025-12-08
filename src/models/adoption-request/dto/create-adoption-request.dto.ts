import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateAdoptionRequestDto {
  @IsNumber()
  animalId: number;

  @IsNumber()
  shelterId: number;

  @IsOptional()
  @IsString()
  message?: string;
}
