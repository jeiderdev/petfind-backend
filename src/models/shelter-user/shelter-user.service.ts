import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateShelterUserDto } from './dto/create-shelter-user.dto';
import { UpdateShelterUserDto } from './dto/update-shelter-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ShelterUserEntity } from './entities/shelter-user.entity';
import { FindManyOptions, Repository } from 'typeorm';
import { UserEntity } from '../user/entities/user.entity';
import { SystemRoles } from 'src/common/enums/system-role.enum';
import { ShelterRole } from 'src/common/enums/shelter.enum';

@Injectable()
export class ShelterUserService {
  constructor(
    @InjectRepository(ShelterUserEntity)
    private readonly shelterUserRepository: Repository<ShelterUserEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async hasPermissionToManageMembers(
    shelterId: number,
    userId: number,
  ): Promise<boolean> {
    if (!userId || !shelterId) return false;
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: {
        systemRole: true,
      },
    });
    if (!user) return false;
    const systemRole = user.systemRole;
    if (systemRole && systemRole.name === SystemRoles.ADMIN) {
      return true;
    }
    const shelterUser = await this.shelterUserRepository.findOne({
      where: { shelterId, userId },
    });
    if (!shelterUser) return false;
    return shelterUser.role === ShelterRole.OWNER;
  }

  async create(createShelterUserDto: CreateShelterUserDto, userId: number) {
    const { shelterId } = createShelterUserDto;
    const hasPermission = await this.hasPermissionToManageMembers(
      shelterId,
      userId,
    );
    if (!hasPermission) {
      throw new BadRequestException(
        'Only shelter admins or system admins can add shelter users',
      );
    }
    const shelterUser = this.shelterUserRepository.create({
      ...createShelterUserDto,
    });
    return this.shelterUserRepository.save(shelterUser);
  }

  async findAll(
    options: FindManyOptions<ShelterUserEntity> = {},
  ): Promise<ShelterUserEntity[]> {
    return this.shelterUserRepository.find(options);
  }

  async findOne(
    id: number,
    options: FindManyOptions<ShelterUserEntity> = {},
  ): Promise<ShelterUserEntity | null> {
    if (!id) {
      throw new BadRequestException('ID must be provided');
    }
    return this.shelterUserRepository.findOne({
      ...options,
      where: { ...(options.where || {}), id },
    });
  }

  async update(
    id: number,
    updateShelterUserDto: UpdateShelterUserDto,
    userId: number,
  ): Promise<ShelterUserEntity> {
    const shelterUser = await this.findOne(id);
    if (!shelterUser) {
      throw new BadRequestException('Shelter user not found');
    }
    const hasPermission = await this.hasPermissionToManageMembers(
      shelterUser.shelterId,
      userId,
    );
    if (!hasPermission) {
      throw new BadRequestException(
        'Only shelter admins or system admins can update shelter users',
      );
    }
    Object.assign(shelterUser, updateShelterUserDto);
    return this.shelterUserRepository.save(shelterUser);
  }

  async remove(id: number, userId: number): Promise<void> {
    const shelterUser = await this.findOne(id);
    if (!shelterUser) {
      throw new BadRequestException('Shelter user not found');
    }
    const hasPermission = await this.hasPermissionToManageMembers(
      shelterUser.shelterId,
      userId,
    );
    if (!hasPermission) {
      throw new BadRequestException(
        'Only shelter admins or system admins can remove shelter users',
      );
    }
    await this.shelterUserRepository.remove(shelterUser);
  }
}
