import { Module } from '@nestjs/common';
import { ShelterUserService } from './shelter-user.service';
import { ShelterUserController } from './shelter-user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShelterUserEntity } from './entities/shelter-user.entity';
import { UserEntity } from '../user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ShelterUserEntity, UserEntity])],
  controllers: [ShelterUserController],
  providers: [ShelterUserService],
  exports: [ShelterUserService],
})
export class ShelterUserModule {}
