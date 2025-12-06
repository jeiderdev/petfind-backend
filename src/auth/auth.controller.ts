import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';
import { ValidateOtpCodeDto } from './dto/validate-otp-code.dto';
import { ResendOtpCodeDto } from './dto/resend-otp-code.dto';

@ApiTags('Authentication')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signUp(@Body() signUpDto: SignupDto) {
    return this.authService.signUp(signUpDto);
  }

  @Post('signin')
  async signIn(@Body() signInDto: SigninDto) {
    return this.authService.signIn(signInDto);
  }

  @Post('validate-otp')
  async validateOtpCode(@Body() validateOtpCodeDto: ValidateOtpCodeDto) {
    return this.authService.validateOtpCode(validateOtpCodeDto);
  }

  @Post('resend-otp')
  async resendOtpCode(@Body() resendOtpCodeDto: ResendOtpCodeDto) {
    return await this.authService.resendEmailOtpCode(resendOtpCodeDto);
  }
}
