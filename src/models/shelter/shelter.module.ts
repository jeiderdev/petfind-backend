import { Module } from '@nestjs/common';
import { ShelterService } from './shelter.service';
import { ShelterController } from './shelter.controller';
import { AuthModule } from 'src/auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShelterEntity } from './entities/shelter.entity';
import { UserEntity } from '../user/entities/user.entity';
import { ShelterUserModule } from '../shelter-user/shelter-user.module';
import { SmtpModule } from 'src/smtp/smtp.module';
import { AnimalModule } from '../animal/animal.module';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([ShelterEntity, UserEntity]),
    ShelterUserModule,
    SmtpModule,
    AnimalModule,
  ],
  controllers: [ShelterController],
  providers: [ShelterService],
  exports: [ShelterService],
})
export class ShelterModule {}
