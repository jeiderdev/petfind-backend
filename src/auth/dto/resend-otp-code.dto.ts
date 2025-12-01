import { IsEmail } from 'class-validator';

export class ResendOtpCodeDto {
  @IsEmail()
  email: string;
}
