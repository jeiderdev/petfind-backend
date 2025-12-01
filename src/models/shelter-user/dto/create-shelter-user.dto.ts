import { IsEnum, IsNumber } from 'class-validator';
import { ShelterRole } from 'src/common/enums/shelter.enum';

export class CreateShelterUserDto {
  @IsNumber()
  shelterId: number;

  @IsNumber()
  userId: number;

  @IsEnum(ShelterRole)
  role: ShelterRole;
}
