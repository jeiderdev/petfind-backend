import { Module } from '@nestjs/common';
import { AnimalService } from './animal.service';
import { AnimalController } from './animal.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnimalEntity } from './entities/animal.entity';
import { ShelterUserEntity } from '../shelter-user/entities/shelter-user.entity';
import { AuthModule } from 'src/auth/auth.module';
import { SmtpModule } from 'src/smtp/smtp.module';
import { ShelterEntity } from '../shelter/entities/shelter.entity';
import { SpeciesEntity } from '../species/entities/species.entity';
import { BreedEntity } from '../breed/entities/breed.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AnimalEntity,
      ShelterEntity,
      ShelterUserEntity,
      SpeciesEntity,
      BreedEntity,
    ]),
    AuthModule,
    SmtpModule,
  ],
  controllers: [AnimalController],
  providers: [AnimalService],
  exports: [AnimalService],
})
export class AnimalModule {}
