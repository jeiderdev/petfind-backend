import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { AnimalGender, AnimalSize } from 'src/common/enums/animal.enum';

export class CreateAnimalDto {
  @IsNumber()
  shelterId: number;

  @IsString()
  name: string;

  @IsString()
  image: string;

  @IsNumber()
  speciesId: number;

  @IsNumber()
  breedId: number;

  @IsOptional()
  @IsEnum(AnimalGender)
  gender: AnimalGender;

  @IsDateString()
  birthDate: Date;

  @IsEnum(AnimalSize)
  size: AnimalSize;

  @IsOptional()
  @IsBoolean()
  isSterilized?: boolean;

  @IsOptional()
  @IsBoolean()
  isVaccinated?: boolean;

  @IsOptional()
  @IsBoolean()
  hasMicrochip?: boolean;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  healthNotes?: string;
}
