import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class SendEmailDto {
  @IsNumber()
  @IsOptional()
  userId?: number;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  message?: string;

  @IsString()
  @IsNotEmpty()
  template?: string;

  @IsObject()
  context?: Record<string, unknown>;
}
