import { PartialType } from '@nestjs/swagger';
import { CreateAdoptionRequestDto } from './create-adoption-request.dto';

export class UpdateAdoptionRequestDto extends PartialType(
  CreateAdoptionRequestDto,
) {}
