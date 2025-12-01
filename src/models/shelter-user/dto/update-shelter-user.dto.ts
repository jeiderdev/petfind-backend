import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateShelterUserDto } from './create-shelter-user.dto';

export class UpdateShelterUserDto extends PartialType(
  OmitType(CreateShelterUserDto, ['shelterId', 'userId'] as const),
) {}
