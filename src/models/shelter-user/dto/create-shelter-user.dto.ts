import { IsEmail, IsEnum, IsNumber } from 'class-validator';
import { ShelterRole } from 'src/common/enums/shelter.enum';

export class CreateShelterUserDto {
  @IsNumber()
  shelterId: number;

  @IsEmail()
  userEmail: string;

  @IsEnum(ShelterRole)
  role: ShelterRole;
}
