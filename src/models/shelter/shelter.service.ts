import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateShelterDto } from './dto/create-shelter.dto';
import { UpdateShelterDto } from './dto/update-shelter.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ShelterEntity } from './entities/shelter.entity';
import { FindManyOptions, Repository } from 'typeorm';
import { ShelterStatus } from 'src/common/enums/shelter.enum';
import { UserEntity } from '../user/entities/user.entity';
import { SystemRoles } from 'src/common/enums/system-role.enum';

@Injectable()
export class ShelterService {
  constructor(
    @InjectRepository(ShelterEntity)
    private readonly shelterRepository: Repository<ShelterEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async create(
    createShelterDto: CreateShelterDto,
    userId: number,
  ): Promise<ShelterEntity> {
    const shelter = this.shelterRepository.create({
      ...createShelterDto,
      createdById: userId,
    });
    return this.shelterRepository.save(shelter);
  }

  async findAll(
    options: FindManyOptions<ShelterEntity> = {},
  ): Promise<ShelterEntity[]> {
    return this.shelterRepository.find(options);
  }

  async findOne(
    id: number,
    options: FindManyOptions<ShelterEntity> = {},
  ): Promise<ShelterEntity | null> {
    if (!id) throw new BadRequestException('Shelter ID is required');
    return this.shelterRepository.findOne({
      ...options,
      where: { ...(options.where || {}), id },
    });
  }

  async update(
    id: number,
    updateShelterDto: UpdateShelterDto,
    userId: number,
  ): Promise<ShelterEntity> {
    const shelter = await this.findOne(id);
    if (!shelter) {
      throw new BadRequestException(`Shelter with ID ${id} not found`);
    }
    if (!userId)
      throw new BadRequestException('User ID is required for update');
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: {
        systemRole: true,
      },
    });
    if (!user) {
      throw new BadRequestException(`User with ID ${userId} not found`);
    }
    const isAdmin = user.systemRole?.name === SystemRoles.ADMIN;
    // TODO: Validar en la tabla ShelterUser los permisos del usuario
    if (!isAdmin && shelter.createdById !== userId) {
      throw new BadRequestException(
        `You are not authorized to update this shelter`,
      );
    }
    Object.assign(shelter, updateShelterDto);
    return await this.shelterRepository.save(shelter);
  }

  async approve(id: number, approverId: number): Promise<ShelterEntity> {
    const shelter = await this.findOne(id);
    if (!shelter) {
      throw new BadRequestException(`Shelter with ID ${id} not found`);
    }
    shelter.status = ShelterStatus.APPROVED;
    shelter.approvedById = approverId;
    shelter.approvedAt = new Date();
    return await this.shelterRepository.save(shelter);
  }

  async remove(id: number): Promise<void> {
    const shelter = await this.findOne(id);
    if (!shelter) {
      throw new BadRequestException(`Shelter with ID ${id} not found`);
    }
    await this.shelterRepository.remove(shelter);
  }
}
