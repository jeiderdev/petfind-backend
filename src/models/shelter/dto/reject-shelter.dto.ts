import { IsString } from 'class-validator';

export class RejectShelterDto {
  @IsString()
  reason: string;
}
