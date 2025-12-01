import { MailerService } from '@nestjs-modules/mailer';
import { BadRequestException, Injectable } from '@nestjs/common';
import { SendEmailDto } from './dtos/send-email.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailEntity } from './entities/email.entity';

@Injectable()
export class SmtpService {
  constructor(
    private readonly mailerService: MailerService,
    @InjectRepository(EmailEntity)
    private readonly emailRepository: Repository<EmailEntity>,
  ) {}

  async sendEmail(body: SendEmailDto): Promise<unknown> {
    const { email, subject, message, template, context } = body;
    if (!template && !message) {
      throw new BadRequestException(
        'Either message or template must be provided',
      );
    }
    const emailRecord = this.emailRepository.create({
      ...body,
      sent: 0,
    });
    await this.emailRepository.save(emailRecord);
    try {
      let res: unknown;
      if (!template) {
        res = await this.mailerService.sendMail({
          to: email,
          subject,
          text: message,
        });
      } else {
        res = await this.mailerService.sendMail({
          to: email,
          subject,
          text: message,
          template,
          context,
        });
      }
      emailRecord.sent = 1;
      await this.emailRepository.save(emailRecord);
      return res;
    } catch (error) {
      console.error('Error sending email:', error);
      return null;
    }
  }

  async resendEmail(emailId: number): Promise<unknown> {
    const emailRecord = await this.emailRepository.findOne({
      where: { id: emailId },
    });
    if (!emailRecord) {
      throw new BadRequestException('Email record not found');
    }
    if (emailRecord.sent) {
      throw new BadRequestException('Email has already been sent');
    }
    const { template } = emailRecord;
    try {
      let res: unknown;
      if (!template) {
        res = await this.mailerService.sendMail({
          to: emailRecord.email,
          subject: emailRecord.subject,
          text: emailRecord.message,
        });
      } else {
        res = this.mailerService.sendMail({
          to: emailRecord.email,
          subject: emailRecord.subject,
          text: emailRecord.message,
          template: emailRecord.template,
          context: emailRecord.context,
        });
      }
      emailRecord.sent = 1;
      await this.emailRepository.save(emailRecord);
      return res;
    } catch (error) {
      console.error('Error resending email:', error);
      return null;
    }
  }
}
