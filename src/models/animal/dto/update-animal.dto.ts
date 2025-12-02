import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateAnimalDto } from './create-animal.dto';

export class UpdateAnimalDto extends PartialType(
  OmitType(CreateAnimalDto, ['shelterId', 'breedId', 'speciesId'] as const),
) {}
