import { Module } from '@nestjs/common';
import { SystemRoleService } from './system-role.service';
import { SystemRoleController } from './system-role.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemRoleEntity } from './entities/system-role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SystemRoleEntity])],
  controllers: [SystemRoleController],
  providers: [SystemRoleService],
})
export class SystemRoleModule {}
