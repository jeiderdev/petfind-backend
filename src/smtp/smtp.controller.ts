import { Controller, Param, Post } from '@nestjs/common';
import { SmtpService } from './smtp.service';

@Controller('smtp')
export class SmtpController {
  constructor(private readonly smtpService: SmtpService) {}

  @Post('resend-email/:emailId')
  async resendEmail(@Param('emailId') emailId: number): Promise<unknown> {
    return await this.smtpService.resendEmail(emailId);
  }
}
