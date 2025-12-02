import { Module } from '@nestjs/common';
import { BreedService } from './breed.service';
import { BreedController } from './breed.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BreedEntity } from './entities/breed.entity';
import { SpeciesEntity } from '../species/entities/species.entity';
import { AuthModule } from 'src/auth/auth.module';
import { SmtpModule } from 'src/smtp/smtp.module';
import { UserEntity } from '../user/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([BreedEntity, UserEntity, SpeciesEntity]),
    AuthModule,
    SmtpModule,
  ],
  controllers: [BreedController],
  providers: [BreedService],
  exports: [BreedService],
})
export class BreedModule {}
