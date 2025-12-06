import { IsString } from 'class-validator';

export class CreateAnimalImageDto {
  @IsString()
  image: string;
}
