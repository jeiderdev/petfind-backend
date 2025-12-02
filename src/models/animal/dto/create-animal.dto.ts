import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  AnimalGender,
  AnimalSize,
  AnimalStatus,
} from 'src/common/enums/animal.enum';

export class CreateAnimalDto {
  @IsNumber()
  shelterId: number;

  @IsOptional()
  @IsEnum(AnimalStatus)
  status: AnimalStatus;

  @IsString()
  name: string;

  @IsNumber()
  speciesId: number;

  @IsNumber()
  breedId: number;

  @IsOptional()
  @IsEnum(AnimalGender)
  gender: AnimalGender;

  @IsDate()
  birthDate: Date;

  @IsEnum(AnimalSize)
  size: AnimalSize;

  @IsOptional()
  @IsString()
  color: string;

  @IsOptional()
  @IsBoolean()
  isSterilized: boolean;

  @IsOptional()
  @IsBoolean()
  isVaccinated: boolean;

  @IsOptional()
  @IsBoolean()
  hasMicrochip: boolean;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  healthNotes: string;
}
