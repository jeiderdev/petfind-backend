import { BadRequestException, Injectable } from '@nestjs/common';
import { UpdateSystemRoleDto } from './dto/update-system-role.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { SystemRoleEntity } from './entities/system-role.entity';
import { FindManyOptions, Repository } from 'typeorm';
import { SystemRoles } from 'src/common/enums/system-role.enum';

export type SystemRoleType = (typeof SystemRoles)[keyof typeof SystemRoles];

@Injectable()
export class SystemRoleService {
  constructor(
    @InjectRepository(SystemRoleEntity)
    private readonly systemRoleRepository: Repository<SystemRoleEntity>,
  ) {}

  async onModuleInit() {
    const roles: SystemRoleType[] = Object.values(SystemRoles);
    for (const roleName of roles) {
      const existingRole = await this.systemRoleRepository.findOne({
        where: { name: roleName },
      });
      if (!existingRole) {
        const newRole = this.systemRoleRepository.create({ name: roleName });
        await this.systemRoleRepository.save(newRole);
        console.log(`Created missing system role: ${roleName}`);
      } else {
        console.log(`System role already exists: ${roleName}`);
      }
    }
  }

  async findAll(
    options: FindManyOptions<SystemRoleEntity> = {},
  ): Promise<SystemRoleEntity[]> {
    return this.systemRoleRepository.find(options);
  }

  async findOne(
    id: number,
    options: FindManyOptions<SystemRoleEntity> = {},
  ): Promise<SystemRoleEntity | null> {
    return await this.systemRoleRepository.findOne({
      ...options,
      where: { ...(options.where || {}), id },
    });
  }

  async update(id: number, updateSystemRoleDto: UpdateSystemRoleDto) {
    if (!id) {
      throw new BadRequestException('System role ID is required');
    }
    const role = await this.findOne(id);
    if (!role) {
      throw new BadRequestException('System role not found');
    }
    Object.assign(role, updateSystemRoleDto);
    return this.systemRoleRepository.save(role);
  }

  async remove(id: number) {
    if (!id) {
      throw new BadRequestException('System role ID is required');
    }
    const role = await this.findOne(id);
    if (!role) {
      throw new BadRequestException('System role not found');
    }
    return this.systemRoleRepository.remove(role);
  }
}
