import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SecurityModule } from 'src/security/security.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/models/user/entities/user.entity';
import { SystemRoleEntity } from 'src/models/system-role/entities/system-role.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, SystemRoleEntity]),
    SecurityModule,
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const jwtSecret = configService.get<string>('JWT_SECRET');
        if (!jwtSecret) {
          throw new Error('JWT secret is not defined in environment variables');
        }
        const jwtExpiresIn = configService.get<string>('JWT_EXPIRES_IN');
        if (!jwtExpiresIn) {
          throw new Error(
            'JWT expiration time is not defined in environment variables',
          );
        }
        const jwtExpiresInNumber = Number(jwtExpiresIn);
        if (isNaN(jwtExpiresInNumber)) {
          throw new Error(
            'JWT expiration time is not a valid number in environment variables',
          );
        }
        return {
          secret: jwtSecret,
          signOptions: { expiresIn: `${jwtExpiresInNumber}m` },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
