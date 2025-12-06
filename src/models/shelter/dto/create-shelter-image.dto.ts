import { IsString } from 'class-validator';

export class CretaeShelterImageDto {
  @IsString()
  image: string;
}
