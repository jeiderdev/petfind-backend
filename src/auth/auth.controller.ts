import { Controller, Post, Body, Get, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';
import { Auth } from './decorators/auth.decorator';

@ApiTags('auth')
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

  @Auth()
  @Get('profile')
  async getProfile(@Req() req: Request) {
    const user: unknown = req['user'];
    if (!user || typeof user !== 'object' || !('id' in user)) {
      throw new Error('User information is missing in the request');
    }
    return await this.authService.getUserProfile(user.id as number);
  }
}
