import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SystemRoleModule } from './models/system-role/system-role.module';
import { SecurityModule } from './security/security.module';
import { UserModule } from './models/user/user.module';
import { AuthModule } from './auth/auth.module';
import { SmtpModule } from './smtp/smtp.module';
import { ShelterModule } from './models/shelter/shelter.module';
import { ShelterUserModule } from './models/shelter-user/shelter-user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes the .env variables available globally
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const host = configService.get<string>('DB_HOST');
        if (!host) {
          throw new Error(
            'Database host is not defined in environment variables',
          );
        }
        const port = configService.get<number>('DB_PORT');
        if (!port || isNaN(port)) {
          throw new Error(
            'Database port is not defined or is not a number in environment variables',
          );
        }
        const dbName = configService.get<string>('DB_NAME');
        if (!dbName) {
          throw new Error(
            'Database name is not defined in environment variables',
          );
        }
        const dbUser = configService.get<string>('DB_USERNAME');
        if (!dbUser) {
          throw new Error(
            'Database username is not defined in environment variables',
          );
        }
        const dbPassword = configService.get<string>('DB_PASSWORD');
        if (dbPassword === undefined) {
          throw new Error(
            'Database password is not defined in environment variables',
          );
        }

        return {
          type: 'mysql',
          host: host,
          port: port,
          username: dbUser,
          password: dbPassword,
          database: dbName,
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: true, // Set to false in production
          // synchronize: false, // Set to false in production
        };
      },
      inject: [ConfigService],
    }),
    SystemRoleModule,
    SecurityModule,
    UserModule,
    AuthModule,
    SmtpModule,
    ShelterModule,
    ShelterUserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
