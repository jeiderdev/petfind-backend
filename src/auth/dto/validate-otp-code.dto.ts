import { IsEmail, IsString } from 'class-validator';

export class ValidateOtpCodeDto {
  @IsEmail()
  email: string;

  @IsString()
  code: string;
}
