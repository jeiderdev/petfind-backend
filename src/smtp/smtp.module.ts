import { Module } from '@nestjs/common';
import { SmtpService } from './smtp.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailEntity } from './entities/email.entity';
import { SmtpController } from './smtp.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmailEntity]),
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const host = configService.get<string>('SMTP_HOST');
        if (!host)
          throw new Error('SMTP_HOST is not defined in environment variables');
        const port = configService.get<number>('SMTP_PORT');
        if (!port)
          throw new Error('SMTP_PORT is not defined in environment variables');
        const user = configService.get<string>('SMTP_USER');
        if (!user)
          throw new Error('SMTP_USER is not defined in environment variables');
        const pass = configService.get<string>('SMTP_PASS');
        if (!pass)
          throw new Error('SMTP_PASS is not defined in environment variables');
        const supportEmail = configService.get<string>('SUPPORT_EMAIL');
        if (!supportEmail)
          throw new Error(
            'SUPPORT_EMAIL is not defined in environment variables',
          );
        return {
          transport: {
            host,
            port: +port,
            secure: true,
            auth: {
              user,
              pass,
            },
            from: `"No Reply" <${supportEmail}>`,
            defaults: {
              from: `"No Reply" <${supportEmail}>`,
            },
          },
          template: {
            dir: join(__dirname.split('dist')[0], 'templates'),
            adapter: new HandlebarsAdapter(),
            options: {
              strict: true,
            },
          },
        };
      },
    }),
  ],
  providers: [SmtpService],
  exports: [SmtpService],
  controllers: [SmtpController],
})
export class SmtpModule {}
