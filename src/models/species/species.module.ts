import { Module } from '@nestjs/common';
import { SpeciesService } from './species.service';
import { SpeciesController } from './species.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SpeciesEntity } from './entities/species.entity';
import { AuthModule } from 'src/auth/auth.module';
import { UserEntity } from '../user/entities/user.entity';
import { SmtpModule } from 'src/smtp/smtp.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SpeciesEntity, UserEntity]),
    AuthModule,
    SmtpModule,
  ],
  controllers: [SpeciesController],
  providers: [SpeciesService],
  exports: [SpeciesService],
})
export class SpeciesModule {}
