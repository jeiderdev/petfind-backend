import { Module } from '@nestjs/common';
import { AdoptionRequestService } from './adoption-request.service';
import { AdoptionRequestController } from './adoption-request.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdoptionRequestEntity } from './entities/adoption-request.entity';
import { AnimalModule } from '../animal/animal.module';
import { AuthModule } from 'src/auth/auth.module';
import { SmtpModule } from 'src/smtp/smtp.module';
import { ShelterUserEntity } from '../shelter-user/entities/shelter-user.entity';
import { UserEntity } from '../user/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AdoptionRequestEntity,
      ShelterUserEntity,
      UserEntity,
    ]),
    AnimalModule,
    AuthModule,
    SmtpModule,
  ],
  controllers: [AdoptionRequestController],
  providers: [AdoptionRequestService],
  exports: [AdoptionRequestService],
})
export class AdoptionRequestModule {}
