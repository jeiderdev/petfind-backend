import { Transform } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class CreateFileDto {
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : Number(value)))
  @IsInt()
  isPublic?: number;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : Number(value)))
  @IsInt()
  collectionId?: number;
}
