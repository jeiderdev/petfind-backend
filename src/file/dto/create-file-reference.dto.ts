import { IsInt, IsString } from 'class-validator';

export class createFileReferenceDto {
  @IsInt()
  fileId: number;

  @IsString()
  tableName: string;

  @IsString()
  columnName: string;
}
